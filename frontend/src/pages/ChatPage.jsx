import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatError, setChatError] = useState("");

  const { authUser } = useAuthUser();

  const {
    data: tokenData,
    error: tokenError,
  } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  useEffect(() => {
    const initChat = async () => {
      if (!authUser) {
        setChatError("Your session could not be verified. Please log in again.");
        setLoading(false);
        return;
      }

      if (tokenError) {
        setChatError(tokenError.response?.data?.message || "Could not get a chat token.");
        setLoading(false);
        return;
      }

      if (!tokenData?.token) return;

      if (!STREAM_API_KEY) {
        setChatError("Stream chat is not configured. Add VITE_STREAM_API_KEY in Render and redeploy.");
        setLoading(false);
        return;
      }

      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        //
        const channelId = [authUser._id, targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        setChatError(error.message || "Could not connect to chat.");
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, tokenError, authUser, targetUserId]);

  const handleVideoCall = () => {
      const { authUser, isLoading: authLoading } = useAuthUser();
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
        isPending: tokenLoading,

      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) {
    if (chatError) {
      return (
          if (authLoading || (authUser && tokenLoading)) return;
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
          <p className="text-lg font-semibold">Unable to open chat</p>
          <p className="mt-2 opacity-70">{chatError}</p>
        </div>
      );
    }
    return <ChatLoader />;
  }

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
