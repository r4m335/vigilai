import React from 'react';
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import AppRoutes from './routes/AppRoutes';
import './Auth.css';



function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="*" element={<AppRoutes />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </>
  );
}

<Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />



export default App;
