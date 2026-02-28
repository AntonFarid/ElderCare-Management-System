import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoutes({ children }) {
  const isLoggedIn = !!localStorage.getItem('token');
  
  if (!isLoggedIn) {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
}