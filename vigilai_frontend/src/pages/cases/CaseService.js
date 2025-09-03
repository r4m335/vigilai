import axios from 'axios';

const API_URL = '/api/cases/';

export const fetchCases = () => axios.get(API_URL);
export const createCase = (data) => axios.post(API_URL, data);
export const updateCase = (id, data) => axios.put(`${API_URL}${id}/`, data);
export const deleteCase = (id) => axios.delete(`${API_URL}${id}/`);
