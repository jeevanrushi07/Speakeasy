import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import useAuthUser from "./useAuthUser";
import { getStreamToken } from "../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

async function getUnreadChannels(authUser, tokenData) {
  if (!STREAM_API_KEY || !authUser || !tokenData?.token) return [];

  const client = StreamChat.getInstance(STREAM_API_KEY);
  if (client.userID !== authUser._id) {
    await client.connectUser(
      {
        id: authUser._id,
        name: authUser.fullName,
        image: authUser.profilePic,
      },
      tokenData.token
    );
  }

  const channels = await client.queryChannels(
    { type: "messaging", members: { $in: [authUser._id] } },
    { last_message_at: -1 },
    { limit: 30, state: true, watch: false }
  );

  return channels
    .map((channel) => {
      const unread = channel.countUnread();
      const otherMember = Object.values(channel.state.members || {}).find(
        (member) => member.user_id !== authUser._id
      );
      const lastMessage = channel.state.messages?.at(-1);

      return {
        id: channel.id,
        targetUserId: otherMember?.user_id,
        unread,
        senderName: lastMessage?.user?.name || otherMember?.user?.name || "A friend",
        senderId: lastMessage?.user?.id || otherMember?.user_id,
      };
    })
    .filter((channel) => channel.unread > 0);
}

const useStreamUnread = () => {
  const { authUser, isLoading: authLoading } = useAuthUser();
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000,
  });

  const unreadQuery = useQuery({
    queryKey: ["streamUnread", authUser?._id],
    queryFn: () => getUnreadChannels(authUser, tokenData),
    enabled: !!authUser && !!tokenData?.token && !authLoading,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const channels = unreadQuery.data || [];
  return {
    channels,
    totalUnread: channels.reduce((total, channel) => total + channel.unread, 0),
    isLoading: authLoading || tokenLoading || unreadQuery.isLoading,
  };
};

export default useStreamUnread;
