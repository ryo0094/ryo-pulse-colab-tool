import { useState } from "react";
import { Hash, Plus, LogOut, ChevronDown, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Channel } from "@/shared/types";
import { User } from '@supabase/supabase-js';
import LanguageToggle from "./LanguageToggle";
import { authedFetch } from "@/react-app/lib/api";

interface SidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  onChannelCreate: () => void;
  user: User;
}

export default function Sidebar({ 
  channels, 
  selectedChannel, 
  onChannelSelect, 
  onChannelCreate,
  user 
}: SidebarProps) {
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");

  const handleLogout = async () => {
    // No need for authedFetch here, supabase client handles its own auth
    await supabase.auth.signOut();
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const response = await authedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || null,
        }),
      });

      if (response.ok) {
        setNewChannelName("");
        setNewChannelDescription("");
        setShowCreateForm(false);
        onChannelCreate();
      }
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
  };

  const getDisplayName = (user: User) => {
    return user.user_metadata.full_name || (user.email || '').split('@')[0];
  };

  return (
    <div className="w-64 bg-gray-800 flex flex-col h-full border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{t('app.name')}</h1>
          </div>
          <LanguageToggle />
        </div>
        
        {/* User info */}
        <div className="flex items-center space-x-3">
          {user.user_metadata.picture && (
            <img
              src={user.user_metadata.picture}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {getDisplayName(user)}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors"
            title={t('auth.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ChevronDown className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                {t('chat.channels')}
              </h2>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-gray-400 hover:text-white transition-colors"
              title={t('chat.newChannel')}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Create channel form */}
          {showCreateForm && (
            <form onSubmit={handleCreateChannel} className="mb-4 p-3 bg-gray-700 rounded-lg">
              <input
                type="text"
                placeholder={t('chat.channelName')}
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <input
                type="text"
                placeholder={t('chat.channelDescription')}
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {t('chat.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {t('chat.cancel')}
                </button>
              </div>
            </form>
          )}

          {/* Channel list */}
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedChannel?.id === channel.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}