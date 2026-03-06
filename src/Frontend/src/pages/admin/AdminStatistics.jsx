import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Divider, Spinner, Chip } from "@heroui/react";
import {
    UsersIcon, HeartIcon, FileTextIcon, BarChart3Icon,
    UserCheckIcon, UserXIcon, ShieldIcon, ActivityIcon
} from "lucide-react";
import { usersApiServices } from "../../services/Admin/UsersApi";

export default function AdminStatistics() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await usersApiServices.getStatistics();
                const data = response.data.data || response.data;
                setStats(data);
            } catch (error) {
                console.error("Error fetching statistics:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-4 text-center text-default-500">
                Failed to load statistics.
            </div>
        );
    }

    // --- Stat card helper ---
    const StatCard = ({ title, value, icon, color = "blue" }) => (
        <Card className="border-none shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
            <CardBody className="flex flex-row items-center gap-4 p-6">
                <div className={`p-3 bg-${color}-50 dark:bg-${color}-900/30 rounded-xl`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value ?? 0}</p>
                </div>
            </CardBody>
        </Card>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <BarChart3Icon className="w-8 h-8 text-blue-500" />
                    System Statistics
                </h1>
                <p className="text-gray-500 mt-2">Complete overview of your facility's data and metrics.</p>
            </div>

            {/* User Statistics */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-blue-500" />
                    User Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={<UsersIcon className="w-6 h-6 text-blue-500" />}
                    />
                    <StatCard
                        title="Active Users"
                        value={stats.activeUsers}
                        icon={<UserCheckIcon className="w-6 h-6 text-green-500" />}
                        color="green"
                    />
                    <StatCard
                        title="Inactive Users"
                        value={stats.inactiveUsers}
                        icon={<UserXIcon className="w-6 h-6 text-red-500" />}
                        color="red"
                    />
                </div>
            </div>

            {/* Users by Type */}
            {stats.usersByType && Object.keys(stats.usersByType).length > 0 && (
                <Card className="shadow-md">
                    <CardHeader className="px-6 pt-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-indigo-500" />
                            Users by Type
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody className="px-6 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(stats.usersByType).map(([type, count]) => (
                                <div key={type} className="flex flex-col items-center p-4 bg-default-50 rounded-xl border border-default-200">
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{count}</p>
                                    <p className="text-sm text-default-500 capitalize mt-1">{type}</p>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

            <Divider />

            {/* Elderly Statistics */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <HeartIcon className="w-5 h-5 text-pink-500" />
                    Elderly Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Elderly"
                        value={stats.totalElderly}
                        icon={<HeartIcon className="w-6 h-6 text-pink-500" />}
                        color="pink"
                    />
                    <StatCard
                        title="Active Elderly"
                        value={stats.activeElderly}
                        icon={<UserCheckIcon className="w-6 h-6 text-emerald-500" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Average Age"
                        value={stats.averageAge != null ? Math.round(stats.averageAge) : "—"}
                        icon={<ActivityIcon className="w-6 h-6 text-orange-500" />}
                        color="orange"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <StatCard
                        title="Elderly with Family"
                        value={stats.elderlyWithFamily}
                        icon={<UsersIcon className="w-6 h-6 text-cyan-500" />}
                        color="cyan"
                    />
                    <StatCard
                        title="Elderly without Family"
                        value={stats.elderlyWithoutFamily}
                        icon={<UserXIcon className="w-6 h-6 text-amber-500" />}
                        color="amber"
                    />
                </div>
            </div>

            <Divider />

            {/* Report Statistics */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileTextIcon className="w-5 h-5 text-green-500" />
                    Report Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Reports"
                        value={stats.totalReports}
                        icon={<FileTextIcon className="w-6 h-6 text-blue-500" />}
                    />
                    <StatCard
                        title="Reports Today"
                        value={stats.reportsToday}
                        icon={<BarChart3Icon className="w-6 h-6 text-green-500" />}
                        color="green"
                    />
                    <StatCard
                        title="Reports This Week"
                        value={stats.reportsThisWeek}
                        icon={<BarChart3Icon className="w-6 h-6 text-violet-500" />}
                        color="violet"
                    />
                    <StatCard
                        title="Reports This Month"
                        value={stats.reportsThisMonth}
                        icon={<BarChart3Icon className="w-6 h-6 text-orange-500" />}
                        color="orange"
                    />
                </div>
            </div>

            {/* Reports by Status */}
            {stats.reportsByStatus && Object.keys(stats.reportsByStatus).length > 0 && (
                <Card className="shadow-md">
                    <CardHeader className="px-6 pt-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileTextIcon className="w-5 h-5 text-teal-500" />
                            Reports by Status
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody className="px-6 py-6">
                        <div className="flex flex-wrap gap-4">
                            {Object.entries(stats.reportsByStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-3 p-4 bg-default-50 rounded-xl border border-default-200 min-w-[160px]">
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={
                                            status === "Approved" ? "success" :
                                                status === "Pending" ? "warning" :
                                                    status === "Rejected" ? "danger" : "default"
                                        }
                                    >
                                        {status}
                                    </Chip>
                                    <p className="text-xl font-bold text-gray-800 dark:text-white">{count}</p>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

        </div>
    );
}
