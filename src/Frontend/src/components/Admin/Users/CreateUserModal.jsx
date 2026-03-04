import React from 'react';
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input, Select, SelectItem
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usersApiServices } from "../../../services/Admin/UsersApi";
import { addToast } from "@heroui/toast";

const userSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    userType: z.string().min(1, "User type is required"),
    roles: z.array(z.string()).min(1, "At least one role is required")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function CreateUserModal({ isOpen, onOpenChange, onClose, onCreated }) {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: { roles: ["FamilyMember"] }
    });

    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await usersApiServices.createUser(data);
            addToast({ title: "Success", description: "User created successfully", color: "success" });
            onClose();
            reset();
            onCreated?.();
        } catch (error) {
            console.log("Full error response:", JSON.stringify(error.response?.data, null, 2));

            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create user",
                color: "danger"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ModalHeader className="flex flex-col gap-1">Create New User</ModalHeader>
                        <ModalBody>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="First Name" placeholder="Enter first name" variant="bordered"
                                    {...register("firstName")} isInvalid={!!errors.firstName}
                                    errorMessage={errors.firstName?.message}
                                />
                                <Input
                                    label="Last Name" placeholder="Enter last name" variant="bordered"
                                    {...register("lastName")} isInvalid={!!errors.lastName}
                                    errorMessage={errors.lastName?.message}
                                />
                                <Input
                                    label="Email" placeholder="Enter email" variant="bordered"
                                    {...register("email")} isInvalid={!!errors.email}
                                    errorMessage={errors.email?.message}
                                />
                                <Input
                                    label="Phone Number" placeholder="Enter phone number" variant="bordered"
                                    {...register("phoneNumber")} isInvalid={!!errors.phoneNumber}
                                    errorMessage={errors.phoneNumber?.message}
                                />
                                <Input
                                    label="Password" placeholder="Enter password" type="password" variant="bordered"
                                    {...register("password")} isInvalid={!!errors.password}
                                    errorMessage={errors.password?.message}
                                />
                                <Input
                                    label="Confirm Password" placeholder="Confirm password" type="password" variant="bordered"
                                    {...register("confirmPassword")} isInvalid={!!errors.confirmPassword}
                                    errorMessage={errors.confirmPassword?.message}
                                />

                                {/* User Type */}
                                <Controller
                                    name="userType"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            label="User Type"
                                            placeholder="Select type"
                                            variant="bordered"
                                            selectedKeys={field.value ? new Set([field.value]) : new Set()}
                                            onSelectionChange={(keys) => field.onChange([...keys][0])}
                                            isInvalid={!!errors.userType}
                                            errorMessage={errors.userType?.message}
                                        >
                                            <SelectItem key="Admin">Admin</SelectItem>
                                            <SelectItem key="Employee">Employee</SelectItem>
                                            <SelectItem key="FamilyMember">Family Member</SelectItem>
                                            <SelectItem key="TeamLeader">Team Leader</SelectItem>
                                        </Select>
                                    )}
                                />

                                {/* Roles - Multi Select */}
                                <Controller
                                    name="roles"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            label="Roles"
                                            placeholder="Select roles"
                                            variant="bordered"
                                            selectionMode="multiple"
                                            selectedKeys={new Set(field.value)}
                                            onSelectionChange={(keys) => field.onChange([...keys])}
                                            isInvalid={!!errors.roles}
                                            errorMessage={errors.roles?.message}
                                        >
                                            <SelectItem key="Admin">Admin</SelectItem>
                                            <SelectItem key="FamilyMember">Family Member</SelectItem>
                                            <SelectItem key="Employee">Employee</SelectItem>
                                            <SelectItem key="TeamLeader">Team Leader</SelectItem>
                                        </Select>
                                    )}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="flat" onPress={onClose}>Cancel</Button>
                            <Button color="primary" type="submit" isLoading={isSubmitting}>Create User</Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    );
}