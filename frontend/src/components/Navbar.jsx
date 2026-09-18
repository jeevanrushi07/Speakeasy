import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  LogOutIcon,
  ShipWheelIcon,
  UserXIcon,
} from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { handleAvatarError } from "../lib/utils";
import { deleteAccount } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

import { useState } from "react";
  // const queryClient = useQueryClient();
  // const { mutate: logoutMutation } = useMutation({
  //   mutationFn: logout,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  const { logoutMutation } = useLogout();
  const [showProfile, setShowProfile] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: deleteAccountMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.setQueryData(["authUser"], null);
      toast.success("Account deleted. Recover it within 24 hours by logging in again.");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Could not delete account"),
  });

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">
          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  Speakeasy
                </span>
              </Link>
            </div>
          )}

          {/* TODO */}
          <ThemeSelector />

          <div className="avatar">
            <div className="w-9 rounded-full">
              <img
                src={authUser?.profilePic}
          <button
            type="button"
            className="avatar cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            title="View profile"
            onClick={() => setShowProfile(true)}
          >
            <div className="w-9 rounded-full">
              <img
                src={authUser?.profilePic}
                alt="User Avatar"
                rel="noreferrer"
                onError={(event) => handleAvatarError(event, authUser?.fullName)}
              />
            </div>
          </button>
            title="Delete account"
            disabled={isDeleting}
            onClick={() => {
              if (window.confirm("Delete your account? You can recover it within 24 hours.")) {
                deleteAccountMutation();
              }
            }}
          >
            <UserXIcon className="h-6 w-6 text-error opacity-70" />
          </button>
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;

      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProfile(false)}
        >
          <section
            className="card w-full max-w-md bg-base-100 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-body items-center text-center">
              <div className="avatar">
                <div className="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                  <img
                    src={authUser?.profilePic}
                    alt={authUser?.fullName || "Profile"}
                    onError={(event) => handleAvatarError(event, authUser?.fullName)}
                  />
                </div>
              </div>
              <h2 className="card-title mt-2">{authUser?.fullName}</h2>
              <p className="text-sm opacity-70">{authUser?.email}</p>
              <div className="mt-4 w-full space-y-2 text-left">
                <p><strong>Bio:</strong> {authUser?.bio || "No bio added"}</p>
                <p><strong>Native language:</strong> {authUser?.nativeLanguage || "Not set"}</p>
                <p><strong>Learning language:</strong> {authUser?.learningLanguage || "Not set"}</p>
                <p><strong>Location:</strong> {authUser?.location || "Not set"}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary mt-5 w-full"
                onClick={() => setShowProfile(false)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
