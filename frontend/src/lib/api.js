import { axiosInstance } from "./axios";

// ---------- AUTH ----------
export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData, {
    withCredentials: true,
  });
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData, {
    withCredentials: true,
  });
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout", {}, {
    withCredentials: true,
  });
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me", {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData, {
    withCredentials: true,
  });
  return response.data;
};

// ---------- USERS ----------
export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends", {
    withCredentials: true,
  });
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users", {
    withCredentials: true,
  });
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests", {
    withCredentials: true,
  });
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(
    `/users/friend-request/${userId}`,
    {},
    { withCredentials: true }
  );
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests", {
    withCredentials: true,
  });
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(
    `/users/friend-request/${requestId}/accept`,
    {},
    { withCredentials: true }
  );
  return response.data;
}

// ---------- CHAT ----------
export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token", {
    withCredentials: true,
  });
  return response.data;
}
