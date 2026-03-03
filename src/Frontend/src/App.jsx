import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HeroUIProvider } from "@heroui/react";
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import AuthLayout from './layouts/AuthLayout';
import FamilyLayout from './layouts/FamilyLayout';
import { ToastProvider } from "@heroui/toast";
import ProtectedRoutes from './ProtectedRoutes/ProtectedRoutes';
import ProtectedAuthRoutes from './ProtectedRoutes/ProtectedAuthRoutes';
import AuthContextProvider from './contexts/AuthContext';
import EmployeeLayout from './layouts/EmployeeLayout';
import AdminLayout from './layouts/AdminLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import UserDetails from './pages/admin/UserDetails';
import AdminProfile from './pages/admin/AdminProfile';
import AdminReports from './pages/admin/Reports';
import EldersManagement from './pages/admin/EldersManagement';
// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeResidents from './pages/employee/Residents';
import EmployeeReports from './pages/employee/EmployeeReports';
import EmployeeSchedule from './pages/employee/Schedule';

// Family Pages
import Messages from './pages/family/Messages';
import DailyUpdates from './pages/family/DailyUpdates';
import Profile from './pages/family/Profile';
import Home from './pages/family/Home';

const queryClient = new QueryClient()

const router = createBrowserRouter([
  // Auth Routes
  {
    path: '',
    element: <AuthLayout />,
    children: [
      { path: 'signin', element: <SignIn /> },
      { path: 'signup', element: <SignUp /> },
    ]
  },
  // Family Routes
  {
    path: '/',
    element: <FamilyLayout />,
    children: [
      { path: '', element: <Home /> },
      {
        path: 'family/home', element:
          //  <ProtectedRoutes>
          <Home />
        //    </ProtectedRoutes> 
      },
      { path: 'family/profile', element: <ProtectedRoutes><Profile /></ProtectedRoutes> },
      { path: 'family/messages', element: <ProtectedRoutes><Messages /></ProtectedRoutes> },
      { path: 'family/dailyupdates', element: <ProtectedRoutes><DailyUpdates /></ProtectedRoutes> },
    ]
  },
  // Admin Routes
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      {
        path: 'dashboard', element:
          //    <ProtectedRoutes>
          <AdminDashboard />
        //      </ProtectedRoutes> 
      },
      { path: 'users', element: <ProtectedRoutes><UsersManagement /></ProtectedRoutes> },
      { path: 'users/:id', element: <ProtectedRoutes><UserDetails /></ProtectedRoutes> },
      { path: 'elders', element: <ProtectedRoutes><EldersManagement /></ProtectedRoutes> },
      { path: 'profile', element: <ProtectedRoutes><AdminProfile /></ProtectedRoutes> },
      { path: 'reports', element: <ProtectedRoutes><AdminReports /></ProtectedRoutes> },
    ]
  },
  // Employee Routes
  {
    path: 'employee',
    element: <EmployeeLayout />,
    children: [
      {
        path: 'dashboard', element:
          // <ProtectedRoutes>
          <EmployeeDashboard />
        //   </ProtectedRoutes>
      },
      { path: 'residents', element: <ProtectedRoutes><EmployeeResidents /></ProtectedRoutes> },
      { path: 'reports', element: <ProtectedRoutes><EmployeeReports /></ProtectedRoutes> },
      { path: 'schedule', element: <ProtectedRoutes><EmployeeSchedule /></ProtectedRoutes> },
    ]
  },
  // 404 Not Found
  { path: '*', element: <NotFound /> },
])

function App() {
  return (
    <>
      <AuthContextProvider>
        <QueryClientProvider client={queryClient}>
          <HeroUIProvider>
            <ToastProvider />
            <RouterProvider router={router} />
          </HeroUIProvider>
        </QueryClientProvider>
      </AuthContextProvider>
    </>
  )
}

export default App