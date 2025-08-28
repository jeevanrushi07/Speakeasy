import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://52.71.153.48:80/api" : "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});
