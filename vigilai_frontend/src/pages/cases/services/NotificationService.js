// cases/services/NotificationService.js

const API_BASE_URL = '/api';

class NotificationService {
  static async makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem("access");

    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        console.log('Token expired, redirecting to login...');
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async getNotifications() {
    return await this.makeAuthenticatedRequest(`${API_BASE_URL}/notifications/`);
  }

  static async markAsRead(notificationId) {
    return await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/notifications/${notificationId}/mark_read/`,
      { method: 'POST' }
    );
  }

  static async markAllAsRead() {
    return await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/notifications/mark_all_read/`,
      { method: 'POST' }
    );
  }

  static async getUnreadCount() {
    return await this.makeAuthenticatedRequest(`${API_BASE_URL}/notifications/unread_count/`);
  }

  static async createMentionNotification(notificationData) {
    return await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/notifications/create-mention/`,
      {
        method: 'POST',
        body: JSON.stringify(notificationData),
      }
    );
  }
}

export default NotificationService;
