import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Bell, AlertTriangle, Calendar, Clock, ArrowRight, Activity, CalendarDays, CheckCircle2, HeartPulse, ClipboardCheck, User } from "lucide-react";
import { Card, CardBody, Button, Chip, Spinner, useDisclosure } from '@heroui/react';
import { familyApiServices } from "../../services/Family/FamilyApi";
import { apiServices } from "../../services/AuthApi";
import ContactStaffModal from './ContactStaffModal';
import HealthTrendsGraph from '../../components/Family/HealthTrendsGraph';

const formatTimeAgo = (dateStr) => {
   if (!dateStr) return '';
   const date = new Date(dateStr);
   const now = new Date();
   const diffInSeconds = Math.floor((now - date) / 1000);
   if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
   if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
   if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
   return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const formatDate = (dateStr) => {
   if (!dateStr) return '';
   return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
   });
};

const formatTimeFromTicks = (visitTimeObj) => {
   if (!visitTimeObj) return '--:--';
   const hours = visitTimeObj.hours || 0;
   const minutes = visitTimeObj.minutes || 0;
   const ampm = hours >= 12 ? 'PM' : 'AM';
   const formattedHours = hours % 12 || 12;
   const formattedMinutes = minutes.toString().padStart(2, '0');
   return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

export default function FamilyDashboard() {
   const [user, setUser] = useState(null);
   const [dashboardData, setDashboardData] = useState(null);
   const [isLoading, setIsLoading] = useState(true);
   const { isOpen, onOpen, onOpenChange } = useDisclosure();

   useEffect(() => {
      const init = async () => {
         try {
            const [profileRes, dashRes] = await Promise.all([
               apiServices.getProfile('FamilyMember'),
               familyApiServices.getDashboardData()
            ]);

            if (profileRes.data?.succeeded) {
               setUser(profileRes.data.data);
            }
            if (dashRes.data?.succeeded) {
               setDashboardData(dashRes.data.data);
            }
         } catch (e) {
            console.error(e);
         } finally {
            setIsLoading(false);
         }
      };
      init();
   }, []);

   if (isLoading) {
      return (
         <div className="flex justify-center items-center h-[80vh]">
            <Spinner size="lg" color="primary" />
         </div>
      );
   }

   const elderlySummaries = dashboardData?.elderlySummaries || dashboardData?.ElderlySummaries || [];

   return (
      <div className="bg-slate-50 min-h-screen w-full pb-24">
         <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-700">
            {/* Dashboard Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-8 rounded-[2rem] shadow-xl shadow-indigo-900/10 relative overflow-hidden text-white">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
               <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3"></div>

               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                     <Activity className="w-4 h-4 text-blue-300" />
                     <span className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.3em]">Family Overview</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none mb-4 text-white">
                     Welcome back, <span className="text-blue-300">{user?.firstName || 'Family Member'}</span>
                  </h1>
                  <p className="text-blue-100/80 font-medium text-sm md:text-base max-w-xl leading-relaxed">
                     Stay closely connected with your loved ones. Monitor their health trends, daily activities, and upcoming visits in real-time.
                  </p>
               </div>

               {dashboardData?.unreadNotificationsCount > 0 && (
                  <div className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-lg flex items-center gap-5 animate-in slide-in-from-right duration-500">
                     <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                        <Bell className="w-6 h-6 text-red-300" />
                     </div>
                     <div>
                        <p className="text-3xl font-black text-white leading-none mb-1">{dashboardData.unreadNotificationsCount}</p>
                        <p className="text-[10px] font-bold text-red-200 uppercase tracking-[0.2em]">Unread Alerts</p>
                     </div>
                     <Button as={Link} to="/family/notifications" className="ml-2 font-bold h-10 bg-white text-indigo-900 hover:bg-blue-50" size="sm">
                        View
                     </Button>
                  </div>
               )}
            </div>

            {/* Loved Ones At A Glance */}
            {elderlySummaries.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {elderlySummaries.map((elderly, idx) => (
                     <Card key={idx} className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white relative overflow-hidden rounded-2xl group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left scale-x-100 group-hover:scale-x-110 transition-transform"></div>
                        {(elderly.hasNewReport || elderly.HasNewReport) && (
                           <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full m-4 animate-pulse ring-4 ring-red-50"></div>
                        )}
                        <CardBody className="p-6">
                           <div className="flex items-start gap-4 mb-6">
                              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-100">
                                 <User className="w-7 h-7 text-indigo-400" />
                              </div>
                              <div>
                                 <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{elderly.elderlyName || elderly.ElderlyName}</h3>
                                 <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                    Room {elderly.roomNumber || elderly.RoomNumber || 'N/A'}
                                 </p>
                              </div>
                           </div>

                           <div className="flex gap-2 mb-6">
                              <Chip
                                 size="sm"
                                 variant="flat"
                                 color={(elderly.healthStatus || elderly.HealthStatus) === 'Good' ? 'success' : (elderly.healthStatus || elderly.HealthStatus) === 'Fair' ? 'warning' : 'danger'}
                                 startContent={<HeartPulse className="w-3.5 h-3.5" />}
                                 className="font-bold uppercase tracking-wider text-[9px]"
                              >
                                 Health: {elderly.healthStatus || elderly.HealthStatus || 'Unknown'}
                              </Chip>
                              <Chip
                                 size="sm"
                                 variant="flat"
                                 color="default"
                                 startContent={<ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />}
                                 className="font-bold uppercase tracking-wider text-[9px] bg-slate-100 text-slate-600 border border-slate-200/50"
                              >
                                 {elderly.lastReportStatus || elderly.LastReportStatus || 'No Report'}
                              </Chip>
                           </div>

                           {(elderly.recentActivities || elderly.RecentActivities) && (elderly.recentActivities || elderly.RecentActivities).length > 0 && (
                              <div>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Activities</p>
                                 <div className="flex flex-wrap gap-2">
                                    {(elderly.recentActivities || elderly.RecentActivities).slice(0, 3).map((act, i) => (
                                       <span key={i} className="text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                          {act}
                                       </span>
                                    ))}
                                    {(elderly.recentActivities || elderly.RecentActivities).length > 3 && (
                                       <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                          +{(elderly.recentActivities || elderly.RecentActivities).length - 3}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           )}

                           <Button as={Link} to={`/family/loved-ones`} variant="light" color="primary" className="w-full mt-4 font-bold text-sm" endContent={<ArrowRight className="w-4 h-4" />}>
                              View Full Profile
                           </Button>
                        </CardBody>
                     </Card>
                  ))}
               </div>
            )}

            {/* Health Trends Graph */}
         <HealthTrendsGraph elderlySummaries={elderlySummaries} />

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Main Content Column */}
               <div className="lg:col-span-2 space-y-6">

                  {/* Urgent Alert Banner */}
                  {dashboardData?.recentAlert && !dashboardData.recentAlert.isRead && (
                     <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 delay-100">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <CardBody className="p-6">
                           <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                                 <AlertTriangle className="w-6 h-6 text-red-600" />
                              </div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start">
                                    <div>
                                       <Chip color="danger" variant="dot" size="sm" className="mb-2 border-none">
                                          {dashboardData.recentAlert.severity || 'Urgent'} Alert
                                       </Chip>
                                       <h3 className="text-lg font-bold text-gray-900">{dashboardData.recentAlert.message || 'New health alert detected.'}</h3>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                       {formatTimeAgo(dashboardData.recentAlert.detectedAt || dashboardData.recentAlert.DetectedAt)}
                                    </span>
                                 </div>
                                 <p className="text-sm text-gray-600 mt-2 font-medium">
                                    Detected for <span className="font-bold text-gray-900">{dashboardData.recentAlert.elderlyName}</span>
                                 </p>
                              </div>
                           </div>
                        </CardBody>
                     </Card>
                  )}

                  {/* Upcoming Visits */}
                  <div>
                     <div className="flex justify-between items-end mb-6 px-1">
                        <div>
                           <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              <CalendarDays className="w-5 h-5 text-indigo-500" />
                              Upcoming Visits
                           </h2>
                           <p className="text-xs text-gray-500 font-medium mt-1">Your scheduled visits with your loved ones</p>
                        </div>
                        <Button as={Link} to="/family/visits" size="sm" variant="light" color="primary" className="font-bold text-xs" endContent={<ArrowRight className="w-3.5 h-3.5" />}>
                           Manage Visits
                        </Button>
                     </div>

                     <div className="grid gap-4 sm:grid-cols-2">
                        {dashboardData?.upcomingVisits && dashboardData.upcomingVisits.length > 0 ? (
                           dashboardData.upcomingVisits.slice(0, 4).map((visit, idx) => (
                              <Card key={idx} className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group rounded-2xl bg-white">
                                 <CardBody className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                       <div className="w-10 h-10 bg-indigo-50/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50">
                                          <Calendar className="w-5 h-5 text-indigo-500" />
                                       </div>
                                       <Chip size="sm" color={visit.status === 'Approved' ? 'success' : 'warning'} variant="flat" className="font-bold text-[9px] uppercase tracking-wider">
                                          {visit.status || 'Scheduled'}
                                       </Chip>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-base mb-2">{visit.elderlyName}</h3>
                                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                       <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                                          {formatDate(visit.visitDate)} • {formatTimeFromTicks(visit.visitTime)}
                                       </span>
                                    </div>
                                 </CardBody>
                              </Card>
                           ))
                        ) : (
                           <div className="sm:col-span-2 py-12 flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl">
                              <Calendar className="w-10 h-10 text-gray-300 mb-3" />
                              <p className="text-gray-500 font-bold text-sm">No upcoming visits</p>
                              <Button as={Link} to="/family/visits" color="primary" variant="flat" size="sm" className="mt-4 font-bold">
                                 Schedule a Visit
                              </Button>
                           </div>
                        )}
                     </div>
                  </div>

               </div>

               {/* Sidebar Column */}
               <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white">
                     <CardBody className="p-6 space-y-4">
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <Zap className="w-4 h-4 text-yellow-500 fill-current" /> Quick Actions
                        </h3>
                        <Button as={Link} to="/family/dailyupdates" className="w-full justify-start h-14 font-bold text-sm bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 shadow-sm rounded-xl transition-all" variant="flat">
                           <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-2 border border-blue-100">
                              <ClipboardCheck className="w-4 h-4 text-blue-600" />
                           </div>
                           View Daily Reports
                        </Button>
                        <Button as={Link} to="/family/loved-ones" className="w-full justify-start h-14 font-bold text-sm bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 shadow-sm rounded-xl transition-all" variant="flat">
                           <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-2 border border-emerald-100">
                              <Activity className="w-4 h-4 text-emerald-600" />
                           </div>
                           Health Trends
                        </Button>
                        <Button onPress={onOpen} className="w-full justify-start h-14 font-bold text-sm bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 hover:text-purple-700 shadow-sm rounded-xl transition-all" variant="flat">
                           <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-2 border border-purple-100">
                              <User className="w-4 h-4 text-purple-600" />
                           </div>
                           Contact Staff
                        </Button>
                     </CardBody>
                  </Card>

                  {/* Recent Notifications */}
                  <div>
                     <div className="flex justify-between items-end mb-4 px-1">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                           <Bell className="w-4 h-4 text-gray-400" />
                           Recent Activity
                        </h2>
                     </div>
                     <div className="space-y-3">
                        {dashboardData?.recentNotifications && dashboardData.recentNotifications.length > 0 ? (
                           dashboardData.recentNotifications.slice(0, 4).map((notif, idx) => (
                              <Link key={idx} to="/family/notifications" className="block">
                                 <Card className={`border ${!notif.isRead ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100 bg-white'} shadow-sm hover:shadow-md transition-all duration-300 rounded-xl`}>
                                    <CardBody className="p-4 flex flex-row gap-3">
                                       <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                       <div>
                                          <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                                             {formatTimeAgo(notif.createdAt || notif.CreatedAt)}
                                          </p>
                                       </div>
                                    </CardBody>
                                 </Card>
                              </Link>
                           ))
                        ) : (
                           <div className="py-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">All caught up</p>
                           </div>
                        )}

                        {dashboardData?.recentNotifications && dashboardData.recentNotifications.length > 4 && (
                           <Button as={Link} to="/family/notifications" variant="light" color="primary" className="w-full text-xs font-bold mt-2">
                              View All Notifications
                           </Button>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <ContactStaffModal isOpen={isOpen} onOpenChange={onOpenChange} />
         </div>
      </div>
   );
}
