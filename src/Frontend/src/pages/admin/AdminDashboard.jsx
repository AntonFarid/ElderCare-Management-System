import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Divider, Skeleton } from "@heroui/react";
import { UsersIcon, FileTextIcon, SettingsIcon, LayoutDashboardIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApiServices } from "../../services/AdminApi";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [totalUsers, setTotalUsers] = useState(null);

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const response = await adminApiServices.getAllUsers();
                // users array lives at response.data.data.data
                const users = response.data.data.data || [];
                setTotalUsers(users.length);
            } catch (error) {
                console.error("Error fetching user count:", error);
                setTotalUsers("—");
            }
        };
        fetchUserCount();
    }, []);

    const stats = [
        {
            title: "Total Users",
            value: totalUsers,
            icon: <UsersIcon className="w-6 h-6 text-blue-500" />,
        },
        { title: "Active Reports", value: "12", icon: <FileTextIcon className="w-6 h-6 text-green-500" /> },
        { title: "System Alerts", value: "2", icon: <LayoutDashboardIcon className="w-6 h-6 text-red-500" /> },
    ];

    const quickActions = [
        { label: "Manage Users", description: "Create and edit user accounts", path: "/admin/users", icon: <UsersIcon /> },
        { label: "View Reports", description: "Monitor daily care activities", path: "/admin/reports", icon: <FileTextIcon /> },
        { label: "Profile Settings", description: "Update your administrative profile", path: "/admin/profile", icon: <SettingsIcon /> },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-500 mt-2">Welcome back! Here's what's happening in your facility today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-none shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
                        <CardBody className="flex flex-row items-center gap-4 p-6">
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                {stat.value === null ? (
                                    <Skeleton className="h-8 w-12 rounded-lg mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <Divider className="my-8" />

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickActions.map((action, index) => (
                        <Card
                            key={index}
                            isPressable
                            onPress={() => navigate(action.path)}
                            className="hover:scale-[1.02] transition-transform duration-200"
                        >
                            <CardHeader className="flex gap-3 p-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                    {action.icon}
                                </div>
                                <div className="flex flex-col text-left">
                                    <p className="text-md font-bold">{action.label}</p>
                                    <p className="text-small text-default-500">{action.description}</p>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
