import axios from 'axios';

export const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';
export const LOCAL_API_URL = 'http://192.168.1.11:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

// Interceptor to auto-retry on 502/503 Render cold starts silently
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if ((status === 502 || status === 503 || !error.response) && originalRequest && !originalRequest._retryCount) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      if (originalRequest._retryCount <= 2) {
        console.log(`[API Auto-Retry]: Render backend cold-start (${status}). Retry attempt ${originalRequest._retryCount}...`);
        await new Promise((resolve) => setTimeout(resolve, 2500));
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
