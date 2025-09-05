// src/services/AuthService.js
import axios from 'axios';

const API_URL = '/api/auth/';

// Login function that now returns user role
export const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL + 'token/', { username, password });
    const { access, refresh } = response.data;
    
    // Store tokens
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Get user profile to determine role (assuming your API has this endpoint)
    try {
      const profileResponse = await axios.get(API_URL + 'profile/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      
      const { role } = profileResponse.data;
      localStorage.setItem('user_role', role);
      
      return { success: true, role };
    } catch (profileError) {
      console.error('Profile fetch error:', profileError);
      // If profile endpoint doesn't exist, set a default role
      localStorage.setItem('user_role', 'detective');
      return { success: true, role: 'detective' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Invalid credentials' 
    };
  }
};

// Get current user role
export const getCurrentUserRole = () => {
  return localStorage.getItem('user_role');
};

// Check if user has required permissions
export const hasPermission = (requiredRole) => {
  const userRole = getCurrentUserRole();
  
  const roleHierarchy = {
    'chief': ['chief', 'detective', 'clerk'],
    'detective': ['detective', 'clerk'],
    'clerk': ['clerk']
  };
  
  return roleHierarchy[requiredRole]?.includes(userRole) || false;
};

// Logout function
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};