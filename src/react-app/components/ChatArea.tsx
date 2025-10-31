import { useState, useEffect, useRef } from "react";
import { Send, Hash, Paperclip, Smile } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Channel, Message } from "@/shared/types";
import { User } from "@supabase/supabase-js";
import MessageList from "./MessageList";
import { authedFetch } from "@/react-app/lib/api";
import { supabase } from "@/react-app/lib/supabaseClient";
import EmojiPicker from "./EmojiPicker";

interface ChatAreaProps {
  channel: Channel;
  user: User;
}

export default function ChatArea({ channel, user }: ChatAreaProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (channel) {
      fetchMessages();
    }
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await authedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/channels/${channel.id}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const response = await authedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/channels/${channel.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageContent,
        }),
      });

      if (response.ok) {
        const newMessageData = await response.json();
        setMessages(prev => [...prev, newMessageData]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageContent); // Restore message on failure
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const sanitizeFileName = (name: string) => {
        const dotIdx = name.lastIndexOf('.');
        const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
        const ext = dotIdx > 0 ? name.slice(dotIdx) : '';
        const cleanedBase = base
          .normalize('NFKD')
          .replace(/[^a-zA-Z0-9-_]+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '');
        const cleaned = `${cleanedBase || 'file'}${ext.replace(/[^a-zA-Z0-9.]+/g, '')}`;
        return cleaned.slice(0, 200);
      };

      const safeName = sanitizeFileName(file.name);
      const timestamp = Date.now();
      const path = `${channel.id}/${user.id}/${timestamp}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('uploads').getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const response = await authedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "",
          attachment_url: publicUrl,
          attachment_name: file.name,
          attachment_type: file.type,
          attachment_size: file.size,
        }),
      });
      if (response.ok) {
        const newMessageData = await response.json();
        setMessages(prev => [...prev, newMessageData]);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-700 p-4 bg-gray-800">
        <div className="flex items-center space-x-2">
          <Hash className="w-5 h-5 text-gray-400" />
          <h1 className="text-lg font-semibold text-white">{channel.name}</h1>
        </div>
        {channel.description && (
          <p className="text-sm text-gray-400 mt-1">{channel.description}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          currentUser={user}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={handleSendMessage} className="relative flex space-x-3">
          <label className={`flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white px-3 rounded-lg cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} title={t('chat.uploadFile') as string}>
            <Paperclip className="w-5 h-5" />
            <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
          </label>
          <button
            type="button"
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded-lg"
            onClick={() => setShowEmojiPicker(v => !v)}
            title={t('chat.addEmoji') as string}
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.messagePlaceholder', { channelName: channel.name })}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => {
                setNewMessage(prev => `${prev}${emoji}`);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </form>
      </div>
    </div>
  );
}