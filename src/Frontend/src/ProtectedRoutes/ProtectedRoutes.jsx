import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedRoutes({ children, allowedRoles }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/404" replace />;
  }

  // If no specific roles required, just check authentication
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  try {
    const decoded = jwtDecode(token);
    const userType = decoded.userType || '';
    const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const userRoles = Array.isArray(roles) ? roles : roles ? [roles] : [];

    // Check if userType or any role matches the allowed roles
    const hasAccess = allowedRoles.includes(userType) ||
      userRoles.some(role => allowedRoles.includes(role));

    if (!hasAccess) {
      return <Navigate to="/404" replace />;
    }
  } catch (error) {
    console.error('Token decode error:', error);
    return <Navigate to="/404" replace />;
  }

  return children;
}
