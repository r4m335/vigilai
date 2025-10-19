// src/cases/services/Authservice.js
import axios from "axios";

const API_URL = '/api/auth/';

// Login function that stores tokens and user data
export const login = async (email, password) => {
  try {
    const response = await axios.post('/api/login/', { email, password });
    const { access, refresh, user } = response.data;
    
    // Store tokens
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    
    // Store user data
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user_email', user.email);
    localStorage.setItem('is_verified', user.is_verified);
    localStorage.setItem('is_superuser', user.is_superuser);
    
    return { 
      success: true, 
      user,
      isAdmin: user.is_superuser 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.response?.data?.detail || 'Invalid credentials' 
    };
  }
};

// ✅ Retrieve access token safely
export const getToken = () => {
  return localStorage.getItem("access");
};

// ✅ Retrieve email
export const getCurrentUserEmail = () => {
  return localStorage.getItem("user_email");
};

// Get current user with parsing
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

// Get current user role
export const getCurrentUserRole = () => {
  const user = getCurrentUser();
  return user?.role || 'user';
};

// Check if current user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.is_superuser === true;
};

// Check if user has required permissions
export const hasPermission = (requiredRole) => {
  const userRole = getCurrentUserRole();
  const userIsAdmin = isAdmin();
  
  // Admin has all permissions
  if (userIsAdmin) return true;
  
  const roleHierarchy = {
    'chief': ['chief', 'detective', 'clerk'],
    'detective': ['detective', 'clerk'],
    'clerk': ['clerk']
  };
  
  return roleHierarchy[requiredRole]?.includes(userRole) || false;
};

// ✅ Logout
export const logout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
  localStorage.removeItem('user_email');
  localStorage.removeItem('is_verified');
  localStorage.removeItem('is_superuser');
  localStorage.removeItem('user_role');
  localStorage.removeItem('profile_photo');
  window.location.href = "/login";
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Async authentication validation with loading state support
export const validateAuth = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const isAuthenticated = !!getToken();
      const isAdminUser = isAdmin();
      
      resolve({
        isAuthenticated,
        isAdmin: isAdminUser
      });
    }, 100);
  });
};

// Validate token with server (optional - for more robust validation)
export const validateTokenWithServer = async () => {
  try {
    const token = getToken();
    if (!token) {
      return { isValid: false, isAdmin: false };
    }

    const response = await axios.get('/api/auth/validate-token/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return {
      isValid: true,
      isAdmin: response.data.is_superuser || false,
      user: response.data
    };
  } catch (error) {
    console.error('Token validation failed:', error);
    if (error.response?.status === 401) {
      logout();
    }
    return { isValid: false, isAdmin: false };
  }
};

// ✅ Auto-refresh access token
export const refreshAccessToken = async () => {
  try {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post('/api/token/refresh/', { refresh });
    const newAccessToken = response.data.access;
    localStorage.setItem('access', newAccessToken);
    
    return { success: true, access: newAccessToken };
  } catch (error) {
    console.error('Token refresh failed:', error);
    logout();
    return { success: false, error: 'Session expired. Please login again.' };
  }
};

// Helper function to get user display name
export const getUserDisplayName = () => {
  const user = getCurrentUser();
  if (user) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  }
  return 'User';
};

// Helper function to check if user is verified
export const isUserVerified = () => {
  const user = getCurrentUser();
  return user?.is_verified === true;
};

// Helper function to update user data in localStorage
export const updateUserData = (newUserData) => {
  const currentUser = getCurrentUser();
  const updatedUser = { ...currentUser, ...newUserData };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  
  if (newUserData.email) {
    localStorage.setItem('user_email', newUserData.email);
  }
  if (newUserData.is_verified !== undefined) {
    localStorage.setItem('is_verified', newUserData.is_verified);
  }
  if (newUserData.is_superuser !== undefined) {
    localStorage.setItem('is_superuser', newUserData.is_superuser);
  }
};

// Set up axios interceptor for authentication
axios.interceptors.request.use(
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

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResult = await refreshAccessToken();
        if (refreshResult.success) {
          originalRequest.headers.Authorization = `Bearer ${refreshResult.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        logout();
      }
    }

    return Promise.reject(error);
  }
);