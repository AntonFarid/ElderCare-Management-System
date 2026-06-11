import './index.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { HeroUIProvider } from "@heroui/react";
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import ElderDetails from './pages/admin/ElderDetails';
import AdminStatistics from './pages/admin/AdminStatistics';
import AuditLogs from './pages/admin/AuditLogs';
import AdminNotifications from './pages/admin/Notifications';
import AdminVisits from './pages/admin/Visits';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeResidents from './pages/employee/Residents';
import EmployeeSchedule from './pages/employee/Schedule';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import ResidentDetails from './pages/employee/ResidentDetails';
import DailyReports from './pages/employee/DailyReports';
import CreateReport from './pages/employee/CreateReport';
import ViewReport from './pages/employee/ViewReport';
import Tasks from './pages/employee/Tasks';
import EmployeeNotifications from './pages/employee/Notifications';

// TeamLeader Pages
import TeamLeaderLayout from './layouts/TeamLeaderLayout';
import TeamLeaderDashboard from './pages/teamleader/TeamLeaderDashboard';
import TeamLeaderProfile from './pages/teamleader/TeamLeaderProfile';
import TeamLeaderReports from './pages/teamleader/TeamLeaderReports';
import TeamLeaderResidents from './pages/teamleader/TeamLeaderResidents';
import TeamLeaderEmployees from './pages/teamleader/Employees';
import TeamLeaderAttendance from './pages/teamleader/Attendence';
import TeamLeaderSchedules from './pages/teamleader/Schedules';
import TeamLeaderVisits from './pages/teamleader/Visits';
import TeamLeaderViewReport from './pages/teamleader/ViewReport';
import TeamLeaderEmployeePerformance from './pages/teamleader/TeamLeaderEmployeePerformance';
import TeamLeaderCreateSchedule from './pages/teamleader/CreateSchedule';
import TeamLeaderNotifications from './pages/teamleader/Notifications';
import TeamLeaderRecipes from './pages/teamleader/Recipes';

// Family Pages
import Messages from './pages/family/Messages';
import DailyUpdates from './pages/family/DailyUpdates';
import Profile from './pages/family/Profile';
import Home from './pages/family/Home';
import LovedOnes from './pages/family/LovedOnes';
import ElderDetail from './pages/family/ElderDetail';
import Visits from './pages/family/Visits';
import Notifications from './pages/family/Notifications';

const queryClient = new QueryClient()

// Special Root Component to handle initial redirect
const RootRedirect = () => {
  return (
    <ProtectedAuthRoutes>
      <Navigate to="/signin" replace />
    </ProtectedAuthRoutes>
  );
};

const router = createBrowserRouter([
  // Root Redirect
  {
    path: '/',
    element: <RootRedirect />
  },
  
  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: 'signin', element: <ProtectedAuthRoutes><SignIn /></ProtectedAuthRoutes> },
      { path: 'signup', element: <ProtectedAuthRoutes><SignUp /></ProtectedAuthRoutes> },
      { path: 'forgot-password', element: <ProtectedAuthRoutes><ForgotPassword /></ProtectedAuthRoutes> },
      { path: 'reset-password', element: <ProtectedAuthRoutes><ResetPassword /></ProtectedAuthRoutes> },
    ]
  },

  // Family Routes
  {
    path: 'family',
    element: <ProtectedRoutes allowedRoles={['FamilyMember']}><FamilyLayout /></ProtectedRoutes>,
    children: [
      { index: true, element: <Navigate to="/family/home" replace /> },
      { path: 'home', element: <Home /> },
      { path: 'loved-ones', element: <LovedOnes /> },
      { path: 'loved-ones/:id', element: <ElderDetail /> },
      { path: 'profile', element: <Profile /> },
      { path: 'messages', element: <Messages /> },
      { path: 'dailyupdates', element: <DailyUpdates /> },
      { path: 'visits', element: <Visits /> },
      { path: 'notifications', element: <Notifications /> },
    ]
  },

  // Admin Routes
  {
    path: 'admin',
    element: <ProtectedRoutes allowedRoles={['Admin']}><AdminLayout /></ProtectedRoutes>,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <UsersManagement /> },
      { path: 'users/:id', element: <UserDetails /> },
      { path: 'elders', element: <EldersManagement /> },
      { path: 'elders/:id', element: <ElderDetails /> },
      { path: 'profile', element: <AdminProfile /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'statistics', element: <AdminStatistics /> },
      { path: 'audit-logs', element: <AuditLogs /> },
      { path: 'notifications', element: <AdminNotifications /> },
      { path: 'visits', element: <AdminVisits /> },
    ]
  },

  // Employee Routes
  {
    path: 'employee',
    element: <ProtectedRoutes allowedRoles={['Employee']}><EmployeeLayout /></ProtectedRoutes>,
    children: [
      { index: true, element: <Navigate to="/employee/dashboard" replace /> },
      { path: 'dashboard', element: <EmployeeDashboard /> },
      { path: 'residents', element: <EmployeeResidents /> },
      { path: 'residents/:id', element: <ResidentDetails /> },
      { path: 'schedule', element: <EmployeeSchedule /> },
      { path: 'dailyreports', element: <DailyReports /> },
      { path: 'dailyreports/create', element: <CreateReport /> },
      { path: 'dailyreports/edit/:id', element: <CreateReport /> },
      { path: 'dailyreports/:id', element: <ViewReport /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'profile', element: <EmployeeProfile /> },
      { path: 'notifications', element: <EmployeeNotifications /> },
    ]
  },

  // TeamLeader Routes
  {
    path: 'teamleader',
    element: <ProtectedRoutes allowedRoles={['TeamLeader']}><TeamLeaderLayout /></ProtectedRoutes>,
    children: [
      { index: true, element: <Navigate to="/teamleader/dashboard" replace /> },
      { path: 'dashboard', element: <TeamLeaderDashboard /> },
      { path: 'reports', element: <TeamLeaderReports /> },
      { path: 'reports/:id', element: <TeamLeaderViewReport /> },
      { path: 'residents', element: <TeamLeaderResidents /> },
      { path: 'residents/:id', element: <ResidentDetails /> },
      { path: 'employees', element: <TeamLeaderEmployees /> },
      { path: 'employees/:id/performance', element: <TeamLeaderEmployeePerformance /> },
      { path: 'attendance', element: <TeamLeaderAttendance /> },
      { path: 'schedules', element: <TeamLeaderSchedules /> },
      { path: 'schedules/create', element: <TeamLeaderCreateSchedule /> },
      { path: 'visits', element: <TeamLeaderVisits /> },
      { path: 'recipes', element: <TeamLeaderRecipes /> },
      { path: 'profile', element: <TeamLeaderProfile /> },
      { path: 'notifications', element: <TeamLeaderNotifications /> },
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