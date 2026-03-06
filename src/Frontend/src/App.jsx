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
import { Navigate } from 'react-router-dom';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import UserDetails from './pages/admin/UserDetails';
import AdminProfile from './pages/admin/AdminProfile';
import AdminReports from './pages/admin/Reports';
import EldersManagement from './pages/admin/EldersManagement';
import ElderDetails from './pages/admin/ElderDetails';
import AdminStatistics from './pages/admin/AdminStatistics';
import AuditLogs from './pages/admin/AuditLogs';
// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeResidents from './pages/employee/Residents';
import EmployeeSchedule from './pages/employee/Schedule';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import ResidentDetails from './pages/employee/ResidentDetails';
import DailyReports from './pages/employee/DailyReports';
import CreateReport from './pages/employee/CreateReport';
import ViewReport from './pages/employee/ViewReport';

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
      { index: true, element: <Navigate to="/signin" replace /> },
      { path: 'signin', element: <ProtectedAuthRoutes><SignIn /></ProtectedAuthRoutes> },
      { path: 'signup', element: <ProtectedAuthRoutes><SignUp /></ProtectedAuthRoutes> },
    ]
  },
  // Family Routes
  {
    path: '/',
    element: <ProtectedRoutes allowedRoles={['FamilyMember']}><FamilyLayout /></ProtectedRoutes>,
    children: [
      { path: '', element: <Home /> },
      { path: 'family/home', element: <Home /> },
      { path: 'family/profile', element: <Profile /> },
      { path: 'family/messages', element: <Messages /> },
      { path: 'family/dailyupdates', element: <DailyUpdates /> },
    ]
  },
  // Admin Routes
  {
    path: 'admin',
    element: <ProtectedRoutes allowedRoles={['Admin']}><AdminLayout /></ProtectedRoutes>,
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <UsersManagement /> },
      { path: 'users/:id', element: <UserDetails /> },
      { path: 'elders', element: <EldersManagement /> },
      { path: 'elders/:id', element: <ElderDetails /> },
      { path: 'profile', element: <AdminProfile /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'statistics', element: <AdminStatistics /> },
      { path: 'audit-logs', element: <AuditLogs /> },
    ]
  },
  // Employee Routes
  {
    path: 'employee',
    element: <ProtectedRoutes allowedRoles={['Employee', 'TeamLeader']}><EmployeeLayout /></ProtectedRoutes>,
    children: [
      { path: 'dashboard', element: <EmployeeDashboard /> },
      { path: 'residents', element: <EmployeeResidents /> },
      { path: 'residents/:id', element: <ResidentDetails /> },
      { path: 'schedule', element: <EmployeeSchedule /> },
      { path: 'dailyreports', element: <DailyReports /> },
      { path: 'dailyreports/create', element: <CreateReport /> },
      { path: 'dailyreports/edit/:id', element: <CreateReport /> },
      { path: 'dailyreports/:id', element: <ViewReport /> },
      { path: 'profile', element: <EmployeeProfile /> },
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