import axios from 'axios';
import { getToken } from './Authservice';

const API_BASE_URL = '/api';

export const chatService = {
  // Get all chat rooms
  getRooms: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/rooms/`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Get messages for a room
  getMessages: async (roomId) => {
    const response = await axios.get(`${API_BASE_URL}/chat/messages/?room=${roomId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Send a message
  sendMessage: async (roomId, text) => {
    const response = await axios.post(`${API_BASE_URL}/chat/messages/`, {
      room: roomId,
      text: text
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Create a new room
  createRoom: async (name, caseId = null) => {
    const response = await axios.post(`${API_BASE_URL}/chat/rooms/`, {
      name: name,
      case: caseId
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  }
};