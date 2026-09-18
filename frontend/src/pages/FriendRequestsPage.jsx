import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, UserCheckIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
} from "../lib/api";
import { handleAvatarError } from "../lib/utils";
import NoNotificationsFound from "../components/NoNotificationsFound";

const FriendRequestsPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const refreshRequests = () => {
    queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
  };

  const { mutate: acceptRequest, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      toast.success("Friend request accepted");
      refreshRequests();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Could not accept request"),
  });

  const { mutate: declineRequest, isPending: isDeclining } = useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => {
      toast.success("Friend request declined");
      refreshRequests();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Could not decline request"),
  });

  const requests = data?.incomingReqs || [];
  const isMutating = isAccepting || isDeclining;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Friend Requests</h1>
          <p className="mt-2 opacity-70">Review people who want to connect with you.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : requests.length === 0 ? (
          <NoNotificationsFound />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((request) => (
              <article key={request._id} className="card bg-base-200 shadow-sm">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3">
                    <div className="avatar size-14 rounded-full bg-base-300">
                      <img
                        src={request.sender.profilePic}
                        alt={request.sender.fullName}
                        onError={(event) => handleAvatarError(event, request.sender.fullName)}
                      />
                    </div>
                    <div>
                      <h2 className="font-semibold">{request.sender.fullName}</h2>
                      <p className="text-sm opacity-70">wants to be your friend</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="badge badge-secondary">Native: {request.sender.nativeLanguage}</span>
                    <span className="badge badge-outline">Learning: {request.sender.learningLanguage}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="btn btn-primary flex-1"
                      onClick={() => acceptRequest(request._id)}
                      disabled={isMutating}
                    >
                      <CheckIcon className="size-4" />
                      Accept
                    </button>
                    <button
                      className="btn btn-outline flex-1"
                      onClick={() => declineRequest(request._id)}
                      disabled={isMutating}
                    >
                      <XIcon className="size-4" />
                      Decline
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequestsPage;
