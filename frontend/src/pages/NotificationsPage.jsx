import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import { Link } from "react-router";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { handleAvatarError } from "../lib/utils";
import useStreamUnread from "../hooks/useStreamUnread";

const NotificationsPage = () => {
  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];
  const { channels: unreadChannels, totalUnread } = useStreamUnread();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <UserCheckIcon className="h-5 w-5 text-primary" />
                    Friend Requests
                    <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                  </h2>
                  <Link to="/friend-requests" className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="card-body p-4">
                      <p className="font-semibold">
                        {incomingRequests.length === 1
                          ? `${incomingRequests[0].sender.fullName} sent you a friend request`
                          : `${incomingRequests.length} people sent you friend requests`}
                      </p>
                      <p className="text-sm opacity-70">Click to review and respond.</p>
                    </div>
                  </Link>
              </section>
            )}

            {unreadChannels.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquareIcon className="h-5 w-5 text-primary" />
                  New Messages
                  <span className="badge badge-primary ml-2">{totalUnread}</span>
                </h2>
                <div className="space-y-3">
                  {unreadChannels.map((channel) => (
                    <Link
                      key={channel.id}
                      to={`/chat/${channel.targetUserId}`}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4 flex-row items-center justify-between">
                        <div>
                          <p className="font-semibold">New message from {channel.senderName}</p>
                          <p className="text-sm opacity-70">Click to open the conversation.</p>
                        </div>
                        <span className="badge badge-primary">{channel.unread}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ACCEPTED REQS NOTIFICATONS */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                              onError={(event) =>
                                handleAvatarError(event, notification.recipient.fullName)
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 &&
              acceptedRequests.length === 0 &&
              unreadChannels.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
