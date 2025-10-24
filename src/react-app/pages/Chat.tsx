import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import Sidebar from "@/react-app/components/Sidebar";
import ChatArea from "@/react-app/components/ChatArea";
import { Channel } from "@/shared/types";

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { channelId } = useParams();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user]);

  useEffect(() => {
    if (channels.length > 0) {
      const currentChannelId = channelId ? parseInt(channelId) : null;
      const channel = currentChannelId 
        ? channels.find(c => c.id === currentChannelId)
        : channels.find(c => c.is_general) || channels[0];
      
      if (channel && (!selectedChannel || selectedChannel.id !== channel.id)) {
        setSelectedChannel(channel);
        if (!channelId) {
          navigate(`/chat/${channel.id}`, { replace: true });
        }
      }
    }
  }, [channels, channelId, selectedChannel, navigate]);

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/channels`, {
        credentials: "include"
      });
      if (response.ok) {
        const channelsData = await response.json();
        setChannels(channelsData);
      }
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    navigate(`/chat/${channel.id}`);
  };

  

  return (
    <div className="h-screen flex bg-gray-900">
      <Sidebar
        channels={channels}
        selectedChannel={selectedChannel}
        onChannelSelect={handleChannelSelect}
        onChannelCreate={fetchChannels}
        user={user}
      />
      {selectedChannel && (
        <ChatArea
          channel={selectedChannel}
          user={user}
        />
      )}
    </div>
  );
}
