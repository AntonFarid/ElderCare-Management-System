import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Divider, Chip, Spinner, Avatar } from "@heroui/react";
import {
    UsersIcon, FileTextIcon, SettingsIcon, HeartIcon, ActivityIcon,
    TrendingUpIcon, ClipboardListIcon, ArrowUpRightIcon, CalendarIcon,
    BarChart3Icon, UserCheckIcon, BellIcon, LayoutDashboardIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usersApiServices } from "../../services/Admin/UsersApi";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await usersApiServices.getDashboardData();
                const data = response.data.data || response.data;
                setDashboard(data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="p-4 text-center text-default-500">
                Failed to load dashboard data.
            </div>
        );
    }

    const stats = dashboard.statistics || {};

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const quickActions = [
        { label: "Manage Users", description: "Create and edit user accounts", path: "/admin/users", icon: <UsersIcon className="w-5 h-5" />, color: "bg-blue-500" },
        { label: "Manage Elders", description: "View and manage elderly residents", path: "/admin/elders", icon: <HeartIcon className="w-5 h-5" />, color: "bg-pink-500" },
        { label: "View Reports", description: "Monitor daily care activities", path: "/admin/reports", icon: <FileTextIcon className="w-5 h-5" />, color: "bg-green-500" },
        { label: "Audit Logs", description: "Track all system actions", path: "/admin/audit-logs", icon: <ClipboardListIcon className="w-5 h-5" />, color: "bg-slate-600" },
        { label: "Statistics", description: "View detailed system metrics", path: "/admin/statistics", icon: <BarChart3Icon className="w-5 h-5" />, color: "bg-violet-500" },
        { label: "Profile Settings", description: "Update your admin profile", path: "/admin/profile", icon: <SettingsIcon className="w-5 h-5" />, color: "bg-amber-500" },
    ];

    const actionColor = (action) =>
        action === "Create" ? "success" :
            action === "Update" ? "warning" :
                action === "Delete" ? "danger" : "default";

    // Custom tooltip for charts
    const ChartTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <LayoutDashboardIcon className="w-8 h-8 text-blue-500" />
                        Welcome!
                    </h1>
                    <p className="text-gray-500 mt-1">Here's what's happening in your facility today.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{today}</span>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        title: "Total Users",
                        value: stats.totalUsers ?? 0,
                        sub: `${stats.activeUsers ?? 0} active`,
                        icon: <UsersIcon className="w-5 h-5 text-blue-500" />,
                        bg: "bg-blue-50 dark:bg-blue-900/20",
                        trend: stats.activeUsers && stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) + "% active" : null,
                    },
                    {
                        title: "Total Elderly",
                        value: stats.totalElderly ?? 0,
                        sub: `${stats.activeElderly ?? 0} active`,
                        icon: <HeartIcon className="w-5 h-5 text-pink-500" />,
                        bg: "bg-pink-50 dark:bg-pink-900/20",
                        trend: stats.averageAge ? `Avg age: ${Math.round(stats.averageAge)}` : null,
                    },
                    {
                        title: "Total Reports",
                        value: stats.totalReports ?? 0,
                        sub: `${stats.reportsToday ?? 0} today`,
                        icon: <FileTextIcon className="w-5 h-5 text-green-500" />,
                        bg: "bg-green-50 dark:bg-green-900/20",
                        trend: stats.reportsThisWeek ? `${stats.reportsThisWeek} this week` : null,
                    },
                    {
                        title: "Notifications",
                        value: stats.pendingNotifications ?? 0,
                        sub: "pending",
                        icon: <BellIcon className="w-5 h-5 text-amber-500" />,
                        bg: "bg-amber-50 dark:bg-amber-900/20",
                        trend: `${stats.loginsToday ?? 0} logins today`,
                    },
                ].map((metric, i) => (
                    <Card key={i} className="border-none shadow-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                        <CardBody className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-2.5 rounded-xl ${metric.bg}`}>
                                    {metric.icon}
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metric.value}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{metric.title}</p>
                            {metric.trend && (
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingUpIcon className="w-3 h-3 text-emerald-500" />
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{metric.trend}</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card className="shadow-md">
                    <CardHeader className="px-6 pt-5 pb-0">
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <p className="text-base font-semibold text-gray-800 dark:text-white">User Growth</p>
                                <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
                            </div>
                            <Chip size="sm" variant="flat" color="primary" startContent={<TrendingUpIcon className="w-3 h-3" />}>
                                {dashboard.userGrowthData?.length ? dashboard.userGrowthData[dashboard.userGrowthData.length - 1].value : 0} total
                            </Chip>
                        </div>
                    </CardHeader>
                    <CardBody className="px-2 pb-4 pt-2">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={dashboard.userGrowthData || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#userGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>

                {/* Report Activity Chart */}
                <Card className="shadow-md">
                    <CardHeader className="px-6 pt-5 pb-0">
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <p className="text-base font-semibold text-gray-800 dark:text-white">Report Activity</p>
                                <p className="text-xs text-gray-400 mt-0.5">Daily submissions</p>
                            </div>
                            <Chip size="sm" variant="flat" color="success" startContent={<BarChart3Icon className="w-3 h-3" />}>
                                {stats.reportsToday ?? 0} today
                            </Chip>
                        </div>
                    </CardHeader>
                    <CardBody className="px-2 pb-4 pt-2">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dashboard.reportActivityData || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>
            </div>

            {/* Recent Activity + Recent Users/Elderly */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Activity Feed */}
                <Card className="shadow-md lg:col-span-1 h-full flex flex-col">
                    <CardHeader className="px-5 pt-5 pb-0">
                        <div className="flex justify-between items-center w-full">
                            <p className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                <ActivityIcon className="w-4 h-4 text-violet-500" />
                                Recent Activity
                            </p>
                            <button
                                onClick={() => navigate('/admin/audit-logs')}
                                className="text-xs text-primary hover:underline flex items-center gap-0.5"
                            >
                                View all <ArrowUpRightIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardBody className="px-5 py-4 flex-1 overflow-hidden">
                        <div className="space-y-2.5 h-full overflow-y-auto pr-1">
                            {(dashboard.recentActivities || []).length > 0 ? (
                                dashboard.recentActivities.slice(0, 10).map((act, i) => (
                                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-default-50 border border-default-100 hover:bg-default-100 transition-colors">
                                        <Chip size="sm" variant="flat" color={actionColor(act.action)} className="mt-0.5 min-w-[60px] text-center">
                                            {act.action}
                                        </Chip>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-700 dark:text-gray-200">
                                                <span className="font-semibold text-primary">{act.userName}</span>
                                                {" "}{act.description || `${act.action}d ${act.entityType}`}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(act.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-default-400 italic text-center py-6">No recent activity.</p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Recent Users & Elderly */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Users */}
                    <Card className="shadow-md">
                        <CardHeader className="px-5 pt-5 pb-0">
                            <div className="flex justify-between items-center w-full">
                                <p className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <UserCheckIcon className="w-4 h-4 text-blue-500" />
                                    Recent Users
                                </p>
                                <button
                                    onClick={() => navigate('/admin/users')}
                                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                >
                                    View all <ArrowUpRightIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardBody className="px-5 py-4">
                            {(dashboard.recentUsers || []).length > 0 ? (
                                <div className="space-y-3">
                                    {dashboard.recentUsers.map((user, i) => (
                                        <div
                                            key={user.id || i}
                                            className="flex items-center justify-between p-3 rounded-xl bg-default-50 border border-default-100 hover:bg-default-100 cursor-pointer transition-colors"
                                            onClick={() => navigate(`/admin/users/${user.id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'U'}
                                                    size="sm"
                                                    className="bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Chip size="sm" variant="flat" color={user.isActive ? "success" : "default"}>
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </Chip>
                                                <span className="text-xs text-gray-400 hidden sm:block">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-default-400 italic text-center py-4">No recent users.</p>
                            )}
                        </CardBody>
                    </Card>

                    {/* Recent Elderly */}
                    <Card className="shadow-md">
                        <CardHeader className="px-5 pt-5 pb-0">
                            <div className="flex justify-between items-center w-full">
                                <p className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <HeartIcon className="w-4 h-4 text-pink-500" />
                                    Recent Elderly
                                </p>
                                <button
                                    onClick={() => navigate('/admin/elders')}
                                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                >
                                    View all <ArrowUpRightIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardBody className="px-5 py-4">
                            {(dashboard.recentElderly || []).length > 0 ? (
                                <div className="space-y-3">
                                    {dashboard.recentElderly.map((elder, i) => (
                                        <div
                                            key={elder.id || i}
                                            className="flex items-center justify-between p-3 rounded-xl bg-default-50 border border-default-100 hover:bg-default-100 cursor-pointer transition-colors"
                                            onClick={() => navigate(`/admin/elders/${elder.id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={`${elder.firstName || ''} ${elder.lastName || ''}`.trim() || 'E'}
                                                    size="sm"
                                                    className="bg-gradient-to-br from-pink-400 to-pink-600 text-white"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                        {elder.firstName} {elder.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {elder.dateOfBirth ? `Born ${new Date(elder.dateOfBirth).toLocaleDateString()}` : 'No DOB'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Chip size="sm" variant="flat" color={elder.isActive ? "success" : "default"}>
                                                    {elder.isActive ? "Active" : "Inactive"}
                                                </Chip>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-default-400 italic text-center py-4">No recent elderly.</p>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            <Divider />

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {quickActions.map((action, index) => (
                        <Card
                            key={index}
                            isPressable
                            onPress={() => navigate(action.path)}
                            className="hover:scale-[1.03] transition-transform duration-200 border-none shadow-sm"
                        >
                            <CardBody className="flex flex-col items-center text-center gap-2.5 p-4">
                                <div className={`p-2.5 rounded-xl ${action.color} text-white shadow-sm`}>
                                    {action.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">{action.label}</p>
                                    <p className="text-[10px] text-default-400 mt-0.5 leading-tight">{action.description}</p>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
