import React, { useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Switch,
} from "@heroui/react";
import { PencilIcon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { usersApiServices } from "../../../services/Admin/UsersApi";
import { addToast } from "@heroui/toast";

const USER_TYPES = ["Admin", "Employee", "FamilyMember", "TeamLeader"];

/**
 * EditUserModal
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – () => void
 *   user      – user object to edit { id, firstName, lastName, phoneNumber, isActive, roles, userType }
 *   onUpdated – () => void  called after a successful update so the parent can refresh
 */
export default function EditUserModal({ isOpen, onClose, user, onUpdated }) {

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm();

    // Pre-fill form whenever the selected user changes
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

    const { mutate: updateUser, isPending } = useMutation({
        mutationFn: (data) => usersApiServices.updateUser(user.id, data),
        onSuccess: () => {
            addToast({
                title: "User updated",
                description: `${user.firstName} ${user.lastName} has been updated.`,
                color: "success",
            });
            onClose();
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

    const onSubmit = (data) => {
        updateUser({
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            isActive: data.isActive,
            roles: data.roles ? [data.roles] : [],
        });
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onClose} size="lg" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ModalHeader className="flex items-center gap-2">
                            <PencilIcon className="w-5 h-5 text-blue-500" />
                            Edit User
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
                            {/* Roles Select */}
                            <Controller
                                name="roles"
                                control={control}
                                rules={{ required: "Role is required" }}
                                render={({ field }) => (
                                    <Select
                                        label="Role"
                                        placeholder="Select a role"
                                        variant="bordered"
                                        className="sm:col-span-2"
                                        selectedKeys={field.value ? new Set([field.value]) : new Set()}
                                        onSelectionChange={(keys) => field.onChange([...keys][0])}
                                        isInvalid={!!errors.roles}
                                        errorMessage={errors.roles?.message}
                                    >
                                        {["Admin", "Employee", "FamilyMember", "TeamLeader"].map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {role}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                )}
                            />

                            {/* Active toggle */}
                            <div className="sm:col-span-2 flex items-center gap-3">
                                <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            isSelected={field.value}
                                            onValueChange={field.onChange}
                                            color="success"
                                        >
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {field.value ? "Active" : "Inactive"}
                                            </span>
                                        </Switch>
                                    )}
                                />
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant="flat" onPress={onClose} isDisabled={isPending}>
                                Cancel
                            </Button>
                            <Button color="primary" type="submit" isLoading={isPending}>
                                Save Changes
                            </Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    );
}
