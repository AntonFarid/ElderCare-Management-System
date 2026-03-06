import React from 'react'
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedAuthRoutes({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return children;
  }

  try {
    const decoded = jwtDecode(token);
    const userType = decoded.userType || '';

    if (userType === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (userType === 'Employee' || userType === 'TeamLeader') return <Navigate to="/employee/dashboard" replace />;
    if (userType === 'FamilyMember') return <Navigate to="/family/home" replace />;
  } catch (error) {
    console.error('Token decode error:', error);
  }

  return children;
}
