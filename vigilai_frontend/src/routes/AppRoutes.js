// src/routes/AppRoutes.js
import React from 'react';
import { BrowserRouter as Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Dashboard from '../pages/cases/Dashboard';
import CaseForm from '../pages/cases/CaseForm';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cases" element={<Dashboard />} />
      <Route path="/cases/new" element={<CaseForm />} />
      <Route path="/cases/edit/:id" element={<CaseForm />} />
    </Routes>
  );
}
