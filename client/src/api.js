import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`,
  timeout: 5000,
});

// Add a request interceptor to automatically attach authorization tokens if they exist
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      if (config.headers.set) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      if (config.headers.delete) {
        config.headers.delete('Authorization');
      } else {
        delete config.headers['Authorization'];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[AUTH] 401 Unauthorized detected. Clearing session.');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Auto-redirect to login screen with feedback message
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = `/login?message=${encodeURIComponent('Your account has been deleted or your session has expired. Please log in again.')}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
