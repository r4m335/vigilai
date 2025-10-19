// src/cases/CaseService.js
import axios from 'axios';
import { getToken } from './services/Authservice';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
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
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
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
const EVIDENCE_API_URL = '/evidences/';
export const fetchEvidence = (caseId) => apiClient.get(`${EVIDENCE_API_URL}?case=${caseId}`);
export const createEvidence = (data) => apiClient.post(EVIDENCE_API_URL, data);
export const updateEvidence = (id, data) => apiClient.put(`${EVIDENCE_API_URL}${id}/`, data);
export const deleteEvidence = (id) => apiClient.delete(`${EVIDENCE_API_URL}${id}/`);

// Witness endpoints
const WITNESS_API_URL = '/witnesses/';
export const fetchWitnesses = (caseId) => apiClient.get(`${WITNESS_API_URL}?case=${caseId}`);
export const createWitness = (data) => apiClient.post(WITNESS_API_URL, data);
export const updateWitness = (id, data) => apiClient.put(`${WITNESS_API_URL}${id}/`, data);
export const deleteWitness = (id) => apiClient.delete(`${WITNESS_API_URL}${id}/`);

// Criminal Record endpoints
const CRIMINAL_RECORD_API_URL = '/criminal-records/';
export const fetchCriminalRecords = (caseId) => apiClient.get(`${CRIMINAL_RECORD_API_URL}?case=${caseId}`);
export const createCriminalRecord = (data) => apiClient.post(CRIMINAL_RECORD_API_URL, data);
export const updateCriminalRecord = (id, data) => apiClient.put(`${CRIMINAL_RECORD_API_URL}${id}/`, data);
export const deleteCriminalRecord = (id) => apiClient.delete(`${CRIMINAL_RECORD_API_URL}${id}/`);

// ✅ Alternative helper functions using direct axios calls (for backward compatibility)
export const fetchCasesAlt = async () => {
  return axios.get(process.env.REACT_APP_API_URL + CASE_API_URL || 'http://localhost:8000/api' + CASE_API_URL, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
};

export const fetchCaseAlt = async (id) => {
  return axios.get(`${process.env.REACT_APP_API_URL + CASE_API_URL || 'http://localhost:8000/api' + CASE_API_URL}${id}/`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
};

export const createCaseAlt = async (data) => {
  return axios.post(process.env.REACT_APP_API_URL + CASE_API_URL || 'http://localhost:8000/api' + CASE_API_URL, data, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
};

export const updateCaseAlt = async (id, data) => {
  return axios.put(`${process.env.REACT_APP_API_URL + CASE_API_URL || 'http://localhost:8000/api' + CASE_API_URL}${id}/`, data, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
};

export const deleteCaseAlt = async (id) => {
  return axios.delete(`${process.env.REACT_APP_API_URL + CASE_API_URL || 'http://localhost:8000/api' + CASE_API_URL}${id}/`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
};