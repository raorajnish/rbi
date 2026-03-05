import axios from "axios";

// Axios instance with backend base URL
const api = axios.create({
  baseURL: "http://localhost:8000/api/",
});

// REQUEST interceptor (runs before every request)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    // If token exists, attach it
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // must return config
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;