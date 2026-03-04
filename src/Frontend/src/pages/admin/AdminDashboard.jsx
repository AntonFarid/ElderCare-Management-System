import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Divider, Chip } from "@heroui/react";
import { UsersIcon, FileTextIcon, SettingsIcon, HeartIcon, ActivityIcon, LogInIcon, CheckCircleIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usersApiServices } from "../../services/Admin/UsersApi";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activity, setActivity] = useState(null);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await usersApiServices.getActivitySummary();
                const data = response.data.data || response.data;
                setActivity(data);
            } catch (error) {
                console.error("Error fetching activity summary:", error);
            }
        };
        fetchActivity();
    }, []);

    const quickActions = [
        { label: "Manage Users", description: "Create and edit user accounts", path: "/admin/users", icon: <UsersIcon /> },
        { label: "Manage Elders", description: "View and manage elderly residents", path: "/admin/elders", icon: <HeartIcon /> },
        { label: "View Reports", description: "Monitor daily care activities", path: "/admin/reports", icon: <FileTextIcon /> },
        { label: "Profile Settings", description: "Update your administrative profile", path: "/admin/profile", icon: <SettingsIcon /> },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-500 mt-2">Welcome back! Here's what's happening in your facility today.</p>
            </div>

            {/* Today's Activity */}
            {activity && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <ActivityIcon className="w-5 h-5 text-violet-500" />
                        Today's Activity
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        {[
                            { label: "New Users", value: activity.newUsers, icon: <UsersIcon className="w-4 h-4 text-blue-500" /> },
                            { label: "New Elderly", value: activity.newElderly, icon: <HeartIcon className="w-4 h-4 text-pink-500" /> },
                            { label: "Reports Submitted", value: activity.reportsSubmitted, icon: <FileTextIcon className="w-4 h-4 text-green-500" /> },
                            { label: "Reports Approved", value: activity.reportsApproved, icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> },
                            { label: "Logins", value: activity.logins, icon: <LogInIcon className="w-4 h-4 text-indigo-500" /> },
                        ].map((item, i) => (
                            <Card key={i} className="border-none shadow-sm">
                                <CardBody className="flex flex-row items-center gap-3 p-4">
                                    {item.icon}
                                    <div>
                                        <p className="text-xs text-gray-500">{item.label}</p>
                                        <p className="text-lg font-bold text-gray-800 dark:text-white">{item.value ?? 0}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    {/* Recent Activities Feed */}
                    {activity.recentActivities && activity.recentActivities.length > 0 && (
                        <Card className="shadow-md">
                            <CardHeader className="px-6 pt-4 pb-0">
                                <p className="text-sm font-semibold text-gray-600">Recent Activity</p>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-3">
                                    {activity.recentActivities.slice(0, 8).map((act, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-default-50 border border-default-100">
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={
                                                    act.action === "Create" ? "success" :
                                                        act.action === "Update" ? "warning" :
                                                            act.action === "Delete" ? "danger" : "default"
                                                }
                                            >
                                                {act.action}
                                            </Chip>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                    <span className="text-primary">{act.userName}</span>
                                                    {" "}{act.description || `${act.action}d a ${act.entityType}`}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(act.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>
            )}

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
