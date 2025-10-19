import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { validateAuth } from "./pages/cases/services/Authservice";
import Loading from "./components/Loading";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import Dashboard from './pages/cases/Dashboard';
import CaseForm from './pages/cases/CaseForm';
import AdminDashboard from './pages/AdminDashboard';
import "./Auth.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Profile from './pages/Profile';
import NotFound from './components/NotFound'; 
import PredictionResults from './components/PredictionResults';

function App() {
  const [appLoading, setAppLoading] = useState(true);
  const [initialAuth, setInitialAuth] = useState({
    isAuthenticated: false,
    isAdmin: false
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const auth = await validateAuth();
        setInitialAuth(auth);
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setAppLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while checking initial auth state
  if (appLoading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Loading message="Initializing application..." />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Home route - accessible to all */}
        <Route path="/" element={<Home />} />

        {/* Public routes - accessible to everyone, no redirects */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected user routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/cases/new" element={
          <PrivateRoute>
            <CaseForm />
          </PrivateRoute>
        } />
        
        <Route path="/cases/edit/:id" element={
          <PrivateRoute>
            <CaseForm />
          </PrivateRoute>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        
        <Route path="/prediction-results" element={
          <PrivateRoute>
            <PredictionResults />
          </PrivateRoute>
        } />

        {/* Admin only routes */}
        <Route path="/admin-dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />

        {/* Catch-all for unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;