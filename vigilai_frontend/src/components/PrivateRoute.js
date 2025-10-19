// components/PrivateRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { validateAuth } from '../pages/cases/services/Authservice';
import Loading from './Loading';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
    isAdmin: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAuthenticated, isAdmin } = await validateAuth();
        setAuthState({
          loading: false,
          isAuthenticated,
          isAdmin
        });
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState({
          loading: false,
          isAuthenticated: false,
          isAdmin: false
        });
      }
    };

    checkAuth();
  }, []);

  if (authState.loading) {
    return <Loading message="Checking authentication..." />;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !authState.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;