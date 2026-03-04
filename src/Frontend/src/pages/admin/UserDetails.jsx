import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, User, Button, Chip, Divider, Spinner } from "@heroui/react";
import { ArrowLeft, Mail, Phone, Shield, UserCircle2, PencilIcon, Users } from "lucide-react";
import { usersApiServices } from "../../services/Admin/UsersApi";
import { addToast } from "@heroui/toast";
import EditUserForm from "../../components/Admin/Users/EditUserForm";
import { eldersApiServices } from "../../services/Admin/EldersApi";

const statusColorMap = {
    Admin: "danger",
    Employee: "primary",
    FamilyMember: "success",
    TeamLeader: "warning",
};

export default function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [assignedElders, setAssignedElders] = useState([]);

    const fetchUser = async () => {
        setIsLoading(true);
        try {
            const response = await usersApiServices.getUserById(id);
            setUser(response.data.data || response.data);
        } catch (error) {
            console.error("Error fetching user details:", error);
            addToast({
                title: "Error",
                description: "Failed to load user details",
                color: "danger"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id]);

    // Fetch assigned elders when user is an Employee
    useEffect(() => {
        if (user && (user.userType === "Employee" || user.userType === "TeamLeader")) {
            eldersApiServices.getAllEmployeeElderlyAssignments({ employeeId: user.id })
                .then((res) => {
                    const data = res.data.data?.data || res.data.data || res.data || [];
                    const list = Array.isArray(data) ? data : [];
                    console.log("Assigned elders data:", list);
                    setAssignedElders(list);
                })
                .catch((err) => console.error("Failed to load assigned elders:", err));
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-4 flex flex-col items-center justify-center space-y-4 h-[50vh]">
                <h2 className="text-2xl font-bold">User Not Found</h2>
                <Button color="primary" onPress={() => navigate('/admin/users')}>
                    Back to Users
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button isIconOnly variant="light" onPress={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="text-2xl font-bold">User Details</h1>
                {!isEditing && user && (
                    <Button size="sm" color="primary" variant="flat"
                        startContent={<PencilIcon size={14} />}
                        onPress={() => setIsEditing(true)}>
                        Edit
                    </Button>
                )}
            </div>

            {isEditing ? (
                <EditUserForm
                    user={user}
                    onCancel={() => setIsEditing(false)}
                    onUpdated={() => {
                        setIsEditing(false);
                        fetchUser();
                    }}
                />
            ) : (
                <Card className="w-full">
                    <CardHeader className="flex gap-3 px-6 pt-6">
                        <User
                            avatarProps={{
                                radius: "lg",
                                src: user.profileImageUrl,
                                size: "lg",
                                className: "w-20 h-20 text-large"
                            }}
                            description={
                                <Chip
                                    className="capitalize mt-2"
                                    color={statusColorMap[user.userType] || "default"}
                                    size="sm"
                                    variant="flat"
                                >
                                    {user.userType || "Unknown"}
                                </Chip>
                            }
                            name={<span className="text-2xl font-bold">{`${user.firstName} ${user.lastName}`}</span>}
                        />
                    </CardHeader>
                    <Divider />
                    <CardBody className="px-6 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <UserCircle2 size={20} className="text-default-500" />
                                    Basic Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-default-500">First Name</p>
                                        <p className="font-medium">{user.firstName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">Last Name</p>
                                        <p className="font-medium">{user.lastName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Mail size={20} className="text-default-500" />
                                    Contact Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-default-500">Email Address</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500 flex items-center gap-1">
                                            <Phone size={14} /> Phone Number
                                        </p>
                                        <p className="font-medium capitalize">{user.phoneNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 md:col-span-2">
                                <Divider />

                                <h3 className="text-lg font-semibold flex items-center gap-2 mt-4">
                                    <Shield size={20} className="text-default-500" />
                                    Roles & Permissions
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.roles && user.roles.length > 0 ? (
                                        user.roles.map((role, index) => (
                                            <Chip key={index} variant="flat" color="secondary">
                                                {role}
                                            </Chip>
                                        ))
                                    ) : (
                                        <p className="text-default-500 italic">No specific roles assigned</p>
                                    )}
                                    <Chip
                                        color={user.isActive ? "success" : "danger"}
                                        variant="flat"
                                    >
                                        {user.isActive ? "Active" : "Inactive"}
                                    </Chip>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Assigned Elders section — only for Employees */}
            {!isEditing && user && (user.userType === "Employee" || user.userType === "TeamLeader") && (
                <Card className="w-full">
                    <CardHeader className="px-6 pt-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users size={20} className="text-primary" />
                            Assigned Elders
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody className="px-6 py-6">
                        {assignedElders.length > 0 ? (
                            <div className="space-y-3">
                                {assignedElders.map((assignment, index) => {
                                    const elderId = assignment.elderlyId ?? assignment.ElderlyId;
                                    const elderName = assignment.elderlyName ?? assignment.ElderlyName ?? "Unknown";
                                    const room = assignment.roomNumber ?? assignment.RoomNumber ?? "N/A";
                                    return (
                                        <div key={elderId || index}
                                            className="flex items-center justify-between p-4 rounded-lg bg-default-50 border border-default-200 cursor-pointer hover:bg-default-100 transition-colors"
                                            onClick={() => elderId && navigate(`/admin/elders/${elderId}`)}>
                                            <div>
                                                <p className="font-medium">{elderName}</p>
                                                <p className="text-sm text-default-400">Room: {room}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {assignment.isPrimary && (
                                                    <Chip size="sm" color="warning" variant="flat">Primary</Chip>
                                                )}
                                                <Chip size="sm" color="primary" variant="flat">
                                                    {new Date(assignment.assignedDate).toLocaleDateString()}
                                                </Chip>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-default-400 italic text-center py-4">No elders assigned to this employee</p>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
