// components/AdminRoute.js
import React from 'react';
import PrivateRoute from './PrivateRoute';

const AdminRoute = ({ children }) => {
  return (
    <PrivateRoute adminOnly={true}>
      {children}
    </PrivateRoute>
  );
};

export default AdminRoute;