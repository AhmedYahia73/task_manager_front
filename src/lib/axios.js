import axios from 'axios';
import { getAuthToken } from '@/utils/auth';

const defaultBaseUrl = 'https://taskitobcknd.wegostation.com';

export const apiClient = axios.create({
  // Vite reads environment variables using import.meta.env, fallback to production backend
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach token and sales_project_id to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach active sales project ID if stored in localStorage (only for non-auth requests)
    const isAuthRequest = config.url && (config.url.includes('/auth/') || config.url.includes('/login'));
    if (!isAuthRequest) {
      const salesProjectId = localStorage.getItem('sales_project_id');
      if (salesProjectId) {
        config.headers['x-sales-project-id'] = salesProjectId;
      }
    }

    // Let browser and Axios generate multipart boundary automatically for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);