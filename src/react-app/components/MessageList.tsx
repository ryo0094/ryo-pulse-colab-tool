import { Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Message } from "@/shared/types";
import { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { authedFetch } from "@/react-app/lib/api";
import EmojiPicker from "./EmojiPicker";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentUser: User;
}

export default function MessageList({ messages, isLoading, currentUser }: MessageListProps) {
  const { t } = useTranslation();
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getDisplayName = (message: Message) => {
    if (message.user_id === currentUser.id) {
      return t('chat.you');
    }
    
    if (message.user_data) {
      return message.user_data.name || 
             message.user_data.given_name || 
             message.user_data.email?.split('@')[0] || 
             t('chat.unknownUser');
    }
    
    return t('chat.unknownUser');
  };

  const getAvatarUrl = (message: Message) => {
    if (message.user_id === currentUser.id) {
      return currentUser.user_metadata.picture;
    }
    return message.user_data?.picture;
  };

  const getInitials = (message: Message) => {
    const name = getDisplayName(message);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t('chat.loadingMessages')}</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">{t('chat.noMessages')}</p>
          <p className="text-sm">{t('chat.firstMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map((message, index) => {
        const showAvatar = index === 0 || 
          messages[index - 1].user_id !== message.user_id ||
          new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 5 * 60 * 1000; // 5 minutes
        
        return (
          <div key={message.id} className={`flex ${showAvatar ? 'mt-4' : 'mt-1'}`}>
            <div className="w-10 mr-3 flex-shrink-0">
              {showAvatar && (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  {getAvatarUrl(message) ? (
                    <img
                      src={getAvatarUrl(message)!}
                      alt={getDisplayName(message)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {getInitials(message)}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {showAvatar && (
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-semibold ${
                    message.user_id === currentUser.id ? 'text-blue-400' : 'text-white'
                  }`}>
                    {getDisplayName(message)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              )}
              
              <div className="text-gray-200 break-words whitespace-pre-wrap">
                {message.content}
              </div>

              {message.attachment_url && (
                <div className="mt-2">
                  {message.attachment_type?.startsWith('image/') ? (
                    <img
                      src={message.attachment_url}
                      alt={message.attachment_name || 'image attachment'}
                      className="max-w-full rounded-lg border border-gray-700"
                    />
                  ) : (
                    <a
                      href={message.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline break-all"
                    >
                      {message.attachment_name || t('chat.attachment')}
                    </a>
                  )}
                </div>
              )}

              {/* Reactions */}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {(message.reactions || []).map(r => (
                  <button
                    key={r.emoji}
                    className={`px-2 py-0.5 rounded-full border text-sm flex items-center gap-1 ${r.reactedByMe ? 'bg-blue-900/30 border-blue-600 text-blue-300' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                    onClick={async () => {
                      await authedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${message.id}/reactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emoji: r.emoji })
                      });
                    }}
                    title={r.reactedByMe ? t('chat.removeReaction') : t('chat.addReaction')}
                  >
                    <span>{r.emoji}</span>
                    <span className="text-xs">{r.count}</span>
                  </button>
                ))}
                <div className="relative">
                  <button
                    className="px-2 py-0.5 rounded-full border border-dashed border-gray-600 text-gray-300 hover:bg-gray-700 text-sm flex items-center gap-1"
                    onClick={() => setPickerFor(pickerFor === message.id ? null : message.id)}
                    title={t('chat.addReaction')}
                  >
                    <Plus className="w-3 h-3" />
                    {t('chat.addReaction')}
                  </button>
                  {pickerFor === message.id && (
                    <EmojiPicker
                      onSelect={async (emoji) => {
                        setPickerFor(null);
                        await authedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${message.id}/reactions`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ emoji })
                        });
                      }}
                      onClose={() => setPickerFor(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
