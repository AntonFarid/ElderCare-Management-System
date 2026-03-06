import React from 'react'
import { Link } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

export default function NotFound() {
  const token = localStorage.getItem('token')
  let isLoggedIn = false
  let dashboardPath = '/signin'
  let userRole = ''

  if (token) {
    try {
      const decoded = jwtDecode(token)
      const userType = decoded.userType || ''
      isLoggedIn = true

      if (userType === 'Admin') {
        dashboardPath = '/admin/dashboard'
        userRole = 'Admin'
      } else if (userType === 'Employee' || userType === 'TeamLeader') {
        dashboardPath = '/employee/dashboard'
        userRole = userType
      } else if (userType === 'FamilyMember') {
        dashboardPath = '/family/home'
        userRole = 'Family Member'
      }
    } catch {
      isLoggedIn = false
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      {/* 404 Heading */}
      <h1 className="text-[8rem] sm:text-[10rem] font-extrabold leading-none bg-gradient-to-r from-sky-400 to-cyan-500 bg-clip-text text-transparent select-none">
        404
      </h1>

      {/* Message */}
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-800">
        Page Not Found
      </h2>
      <p className="mt-3 max-w-md text-center text-slate-500 text-base sm:text-lg">
        {isLoggedIn
          ? "You don't have permission to access this page, or it doesn't exist."
          : "Sorry, the page you're looking for doesn't exist. Please sign in to continue."}
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {isLoggedIn ? (
          <Link
            to={dashboardPath}
            className="px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-sky-400 to-cyan-500 shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:scale-105 transition-all duration-200 text-center"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/signin"
              className="px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-sky-400 to-cyan-500 shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:scale-105 transition-all duration-200 text-center"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3 rounded-xl font-medium border-2 border-sky-400 text-sky-500 hover:bg-sky-50 hover:scale-105 transition-all duration-200 text-center"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Decorative Dots */}
      <div className="mt-12 flex gap-2">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
