import axios from 'axios';

// Create an Axios instance
// In a real production app (like on Vercel), this URL would be your actual backend domain.
// For local development, it points to your local Node.js server.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Intercept requests to add the JWT token if it exists
// This is how the frontend proves to the backend that the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
