import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // sends the httpOnly cookie automatically
});

// only guest tokens need manual attaching now — real user auth rides the cookie
api.interceptors.request.use((config) => {
  const guestToken = localStorage.getItem("guestToken");
  if (guestToken) config.headers.Authorization = `Bearer ${guestToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const guestToken = localStorage.getItem("guestToken");
      if (!guestToken) {
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;