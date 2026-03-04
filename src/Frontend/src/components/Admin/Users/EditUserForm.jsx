import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, Button, Input, Select, SelectItem, Switch, Divider } from "@heroui/react";
import { SaveIcon, XIcon, UserCircle2, Mail, Shield } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { usersApiServices } from "../../../services/Admin/UsersApi";
import { addToast } from "@heroui/toast";

const USER_TYPES = ["Admin", "Employee", "FamilyMember", "TeamLeader"];


export default function EditUserForm({ user, onCancel, onUpdated }) {

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

    // Pre-fill form
    useEffect(() => {
        if (user) {
            reset({
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
                phoneNumber: user.phoneNumber ?? "",
                userType: user.userType ?? "",
                isActive: user.isActive ?? true,
                roles: user.roles?.[0] ?? "",
            });
        }
    }, [user, reset]);

    // --- Mutation ---
    const { mutate: updateUser, isPending: isUpdating } = useMutation({
        mutationFn: (data) => usersApiServices.updateUser(user.id, data),
        onSuccess: () => {
            addToast({ title: "Success", description: "User details updated successfully", color: "success" });
            onUpdated?.();
        },
        onError: (error) => {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update user",
                color: "danger",
            });
        },
    });

    // --- Handler ---
    const onSubmitDetails = (data) => {
        updateUser({
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            isActive: data.isActive,
            roles: data.roles ? [data.roles] : [],
        });
    };

    return (
        <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserCircle2 size={20} className="text-primary" />
                        Basic Information
                    </h3>
                    <div className="flex gap-2">
                        <Button size="sm" variant="flat" startContent={<XIcon size={14} />} onPress={onCancel}>
                            Cancel
                        </Button>
                        <Button size="sm" color="primary" startContent={<SaveIcon size={14} />}
                            isLoading={isUpdating} onPress={handleSubmit(onSubmitDetails)}>
                            Save Changes
                        </Button>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="First Name" variant="bordered"
                            {...register("firstName", { required: "First name is required" })}
                            isInvalid={!!errors.firstName} errorMessage={errors.firstName?.message} />
                        <Input label="Last Name" variant="bordered"
                            {...register("lastName", { required: "Last name is required" })}
                            isInvalid={!!errors.lastName} errorMessage={errors.lastName?.message} />
                        <Input label="Phone Number" variant="bordered" className="md:col-span-2"
                            {...register("phoneNumber", { required: "Phone number is required" })}
                            isInvalid={!!errors.phoneNumber} errorMessage={errors.phoneNumber?.message} />
                    </form>
                </CardBody>
            </Card>

            {/* Section 2: Roles & Permissions */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield size={20} className="text-primary" />
                        Roles & Permissions
                    </h3>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                    <Controller
                        name="roles"
                        control={control}
                        rules={{ required: "Role is required" }}
                        render={({ field }) => (
                            <Select
                                label="Role"
                                placeholder="Select a role"
                                variant="bordered"
                                selectedKeys={field.value ? new Set([field.value]) : new Set()}
                                onSelectionChange={(keys) => field.onChange([...keys][0])}
                                isInvalid={!!errors.roles}
                                errorMessage={errors.roles?.message}
                            >
                                {USER_TYPES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </Select>
                        )}
                    />

                    <div className="flex items-center gap-3 pt-2">
                        <Controller name="isActive" control={control}
                            render={({ field }) => (
                                <Switch isSelected={field.value} onValueChange={field.onChange} color="success">
                                    <span className="text-sm font-medium">
                                        {field.value ? "Active" : "Inactive"}
                                    </span>
                                </Switch>
                            )} />
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
