// src/cases/CaseService.js
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

// Case endpoints
const CASE_API_URL = '/cases/';
export const fetchCases = () => apiClient.get(CASE_API_URL);
export const fetchCase = (id) => apiClient.get(`${CASE_API_URL}${id}/`);
export const createCase = (data) => apiClient.post(CASE_API_URL, data);
export const updateCase = (id, data) => apiClient.put(`${CASE_API_URL}${id}/`, data);
export const deleteCase = (id) => apiClient.delete(`${CASE_API_URL}${id}/`);

// Evidence endpoints
const EVIDENCE_API_URL = '/evidence/';
export const fetchEvidence = (caseId) => apiClient.get(`${EVIDENCE_API_URL}?case_id=${caseId}`);
export const createEvidence = (data) => apiClient.post(EVIDENCE_API_URL, data);
export const updateEvidence = (id, data) => apiClient.put(`${EVIDENCE_API_URL}${id}/`, data);
export const deleteEvidence = (id) => apiClient.delete(`${EVIDENCE_API_URL}${id}/`);

// Witness endpoints
const WITNESS_API_URL = '/witnesses/';
export const fetchWitnesses = (caseId) => apiClient.get(`${WITNESS_API_URL}?case_id=${caseId}`);
export const createWitness = (data) => apiClient.post(WITNESS_API_URL, data);
export const updateWitness = (id, data) => apiClient.put(`${WITNESS_API_URL}${id}/`, data);
export const deleteWitness = (id) => apiClient.delete(`${WITNESS_API_URL}${id}/`);

// Criminal Record endpoints
const CRIMINAL_RECORD_API_URL = '/criminal-records/';
export const fetchCriminalRecords = (caseId) => apiClient.get(`${CRIMINAL_RECORD_API_URL}?case_id=${caseId}`);
export const createCriminalRecord = (data) => apiClient.post(CRIMINAL_RECORD_API_URL, data);
export const updateCriminalRecord = (id, data) => apiClient.put(`${CRIMINAL_RECORD_API_URL}${id}/`, data);
export const deleteCriminalRecord = (id) => apiClient.delete(`${CRIMINAL_RECORD_API_URL}${id}/`);