import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from './pages/cases/Dashboard';
import CaseForm from './pages/cases/CaseForm';
import "./Auth.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Profile from './pages/Profile';
import NotFound from './components/NotFound'; 
import PredictionResults from './components/PredictionResults';



function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="*" element={<NotFound />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cases/new" element={<CaseForm />} />
        <Route path="/cases/edit/:id" element={<CaseForm />} />
        <Route path="/profile" element={
                <PrivateRoute>
                    <Profile />
                </PrivateRoute>
              } />
        // In App.js - Remove ProtectedRoute wrapper
        <Route path="/prediction-results" element={<PredictionResults />} />
        {/* Protected routes */}
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>
          }
        />

        {/* Catch-all for unknown routes */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
