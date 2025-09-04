// src/services/CaseService.js
import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const CASE_API_URL = '/cases/';

export const fetchCases = () => apiClient.get(CASE_API_URL);
export const fetchCase = (id) => apiClient.get(`${CASE_API_URL}${id}/`);
export const createCase = (data) => apiClient.post(CASE_API_URL, data);
export const updateCase = (id, data) => apiClient.put(`${CASE_API_URL}${id}/`, data);
export const deleteCase = (id) => apiClient.delete(`${CASE_API_URL}${id}/`);