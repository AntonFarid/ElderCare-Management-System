import React, { useEffect, useState } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Avatar,
    Chip,
    Divider,
    Skeleton,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Input,
} from "@heroui/react";
import {
    UserIcon,
    MailIcon,
    PhoneIcon,
    ShieldCheckIcon,
    CalendarIcon,
    ClockIcon,
    BadgeCheckIcon,
    PencilIcon,
} from "lucide-react";
import { adminApiServices } from "../../services/AdminApi";
import { addToast } from "@heroui/toast";
import { useForm } from "react-hook-form";

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {label}
                </span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-0.5 break-words">
                    {value || "—"}
                </span>
            </div>
        </div>
    );
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminProfile() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const response = await adminApiServices.getAdminProfile();
            setProfile(response.data.data);
        } catch (error) {
            console.error("Error fetching admin profile:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to load profile",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditOpen = () => {
        // Pre-fill form with current profile values
        reset({
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            phoneNumber: profile?.phoneNumber || "",
        });
        onOpen();
    };

    const onSubmit = async (data) => {
        setIsSaving(true);
        try {
            const payload = {
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                isActive: profile?.isActive ?? true,
                roles: profile?.roles ?? [],
            };
            await adminApiServices.updateAdminProfile(payload);
            addToast({
                title: "Success",
                description: "Profile updated successfully",
                color: "success",
            });
            onClose();
            fetchProfile(); // refresh data
        } catch (error) {
            console.error("Error updating profile:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update profile",
                color: "danger",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const initials = profile
        ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
        : "?";

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        View and manage your administrator account details.
                    </p>
                </div>
                {!isLoading && (
                    <Button
                        color="primary"
                        variant="flat"
                        startContent={<PencilIcon className="w-4 h-4" />}
                        onPress={handleEditOpen}
                    >
                        Edit Profile
                    </Button>
                )}
            </div>

            {/* Hero Card */}
            <Card className="border-none shadow-lg overflow-visible">
                <CardBody className="px-6 py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                        {isLoading ? (
                            <Skeleton className="rounded-full w-24 h-24 border-4 border-white dark:border-gray-900 shadow-md" />
                        ) : (
                            <Avatar
                                name={initials}
                                src={profile?.profileImageUrl}
                                className="w-24 h-24 text-2xl font-bold border-4 border-white dark:border-gray-900 shadow-md bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                                showFallback
                            />
                        )}

                        <div className="flex-1 min-w-0">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-48 rounded-lg" />
                                    <Skeleton className="h-4 w-64 rounded-lg" />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white truncate">
                                        {profile?.fullName || `${profile?.firstName} ${profile?.lastName}`}
                                    </h2>
                                    <p className="text-gray-500 text-sm truncate">{profile?.email}</p>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {isLoading ? (
                                <Skeleton className="h-7 w-20 rounded-full" />
                            ) : (
                                <>
                                    <Chip
                                        color={profile?.isActive ? "success" : "danger"}
                                        variant="flat"
                                        size="sm"
                                        startContent={<BadgeCheckIcon className="w-3.5 h-3.5" />}
                                    >
                                        {profile?.isActive ? "Active" : "Inactive"}
                                    </Chip>
                                    {profile?.roles?.map((role) => (
                                        <Chip key={role} color="primary" variant="flat" size="sm">
                                            {role}
                                        </Chip>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <Card className="border-none shadow-md">
                    <CardHeader className="px-5 pt-5 pb-2">
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-blue-500" />
                            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                                Personal Information
                            </h3>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="px-5 py-1 divide-y divide-gray-100 dark:divide-gray-800">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-3">
                                    <Skeleton className="w-8 h-8 rounded-lg" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-20 rounded" />
                                        <Skeleton className="h-4 w-36 rounded" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                <InfoRow icon={UserIcon} label="First Name" value={profile?.firstName} />
                                <InfoRow icon={UserIcon} label="Last Name" value={profile?.lastName} />
                                <InfoRow icon={MailIcon} label="Email Address" value={profile?.email} />
                                <InfoRow icon={PhoneIcon} label="Phone Number" value={profile?.phoneNumber} />
                            </>
                        )}
                    </CardBody>
                </Card>

                {/* Account Info */}
                <Card className="border-none shadow-md">
                    <CardHeader className="px-5 pt-5 pb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-purple-500" />
                            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                                Account Details
                            </h3>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="px-5 py-1 divide-y divide-gray-100 dark:divide-gray-800">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-3">
                                    <Skeleton className="w-8 h-8 rounded-lg" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-20 rounded" />
                                        <Skeleton className="h-4 w-36 rounded" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                <InfoRow icon={ShieldCheckIcon} label="User Type" value={profile?.userType} />
                                <InfoRow
                                    icon={BadgeCheckIcon}
                                    label="Account Status"
                                    value={profile?.isActive ? "Active" : "Inactive"}
                                />
                                <InfoRow
                                    icon={CalendarIcon}
                                    label="Member Since"
                                    value={formatDate(profile?.createdAt)}
                                />
                                <InfoRow
                                    icon={ClockIcon}
                                    label="Last Login"
                                    value={formatDateTime(profile?.lastLoginAt)}
                                />
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Edit Profile Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
                <ModalContent>
                    {(onClose) => (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <ModalHeader className="flex items-center gap-2">
                                <PencilIcon className="w-5 h-5 text-blue-500" />
                                Edit Profile
                            </ModalHeader>
                            <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                                <Input
                                    label="First Name"
                                    placeholder="Enter first name"
                                    variant="bordered"
                                    {...register("firstName", { required: "First name is required" })}
                                    isInvalid={!!errors.firstName}
                                    errorMessage={errors.firstName?.message}
                                />
                                <Input
                                    label="Last Name"
                                    placeholder="Enter last name"
                                    variant="bordered"
                                    {...register("lastName", { required: "Last name is required" })}
                                    isInvalid={!!errors.lastName}
                                    errorMessage={errors.lastName?.message}
                                />
                                <Input
                                    label="Phone Number"
                                    placeholder="Enter phone number"
                                    variant="bordered"
                                    className="sm:col-span-2"
                                    {...register("phoneNumber", { required: "Phone number is required" })}
                                    isInvalid={!!errors.phoneNumber}
                                    errorMessage={errors.phoneNumber?.message}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" type="submit" isLoading={isSaving}>
                                    Save Changes
                                </Button>
                            </ModalFooter>
                        </form>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
