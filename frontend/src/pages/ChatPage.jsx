import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, translateMessage } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  MessageSimple,
  Thread,
  useMessageContext,
  Avatar as StreamAvatar,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import SpeechTranscriber from "../components/SpeechTranscriber";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const translationLanguages = [
  ["en-IN", "English"],
  ["hi-IN", "Hindi"],
  ["bn-IN", "Bengali"],
  ["ta-IN", "Tamil"],
  ["te-IN", "Telugu"],
  ["mr-IN", "Marathi"],
  ["gu-IN", "Gujarati"],
  ["kn-IN", "Kannada"],
  ["ml-IN", "Malayalam"],
  ["pa-IN", "Punjabi"],
];

function TranslatedMessage({
  targetLanguage,
  ...messageProps
}) {
  const { message } = useMessageContext("TranslatedMessage");
  const [translatedText, setTranslatedText] = useState("");

  useEffect(() => {
    let isCurrent = true;
    const originalText = message?.text?.trim();

    if (!targetLanguage || !originalText) {
      setTranslatedText("");
      return () => {
        isCurrent = false;
      };
    }

    setTranslatedText("");
    translateMessage(originalText, targetLanguage)
      .then((text) => {
        if (isCurrent) setTranslatedText(text || "");
      })
      .catch((error) => {
        console.error("Message translation failed:", error);
      });

    return () => {
      isCurrent = false;
    };
  }, [message?.id, message?.text, targetLanguage]);

  const renderText = (text) => {
    const displayText = translatedText || text || "";

    if (!displayText) return "";

    return displayText.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
      if (!part.startsWith("http://") && !part.startsWith("https://")) {
        return <span key={`${message?.id || "message"}-${index}`}>{part}</span>;
      }

      return (
        <a
          key={`${message?.id || "message"}-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer noopener"
          className="link link-primary break-all"
        >
          {part}
        </a>
      );
    });
  };

  return (
    <MessageSimple
      key={`${message?.id || "message"}-${targetLanguage || "original"}-${translatedText}`}
      {...messageProps}
      renderText={renderText}
    />
  );
}

function LocalChatAvatar({ name, className, onClick, onMouseOver }) {
  const displayName = name || "User";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const background = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#2563eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="white">${initials}</text></svg>`
  );

  return (
    <StreamAvatar
      className={className}
      image={`data:image/svg+xml,${background}`}
      name={displayName}
      onClick={onClick}
      onMouseOver={onMouseOver}
    />
  );
}

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  const { authUser, isLoading: authLoading } = useAuthUser();

  const {
    data: tokenData,
    error: tokenError,
    isPending: tokenLoading,
  } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  useEffect(() => {
    const initChat = async () => {
      if (authLoading || (authUser && tokenLoading)) return;

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
  }, [tokenData, tokenError, tokenLoading, authLoading, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) {
    if (chatError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
          <p className="text-lg font-semibold">Unable to open chat</p>
          <p className="mt-2 opacity-70">{chatError}</p>
        </div>
      );
    }
    return <ChatLoader />;
  }

  return (
    <div className="h-[93vh] min-h-0">
      <Chat client={chatClient}>
        <Channel channel={channel} Avatar={LocalChatAvatar}>
          <div className="flex h-full min-h-0 w-full flex-col">
            <div className="min-h-0 flex-1">
              <Window>
                <div className="relative">
                  <ChannelHeader />
                  <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
                    <label
                      htmlFor="translation-language"
                      className="hidden text-xs font-medium sm:inline"
                    >
                      Translate to
                    </label>
                    <select
                      id="translation-language"
                      value={targetLanguage}
                      onChange={(event) => setTargetLanguage(event.target.value)}
                      className="select select-bordered select-sm bg-base-100 text-base-content"
                      title="Translate received messages"
                    >
                      <option value="">Original</option>
                      {translationLanguages.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <SpeechTranscriber
                        title="Voice"
                        onFinalText={(text) => channel.sendMessage({ text })}
                      />
                      <CallButton handleVideoCall={handleVideoCall} />
                    </div>
                  </div>
                </div>
                <MessageList
                  key={`translation-${targetLanguage || "original"}`}
                  Message={(messageProps) => (
                    <TranslatedMessage
                      {...messageProps}
                      targetLanguage={targetLanguage}
                    />
                  )}
                />
                <MessageInput focus />
              </Window>
            </div>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
