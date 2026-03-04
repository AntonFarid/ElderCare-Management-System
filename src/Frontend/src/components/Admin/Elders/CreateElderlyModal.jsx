import React, { useState, useEffect } from 'react';
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input, Textarea, Select, SelectItem,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { usersApiServices } from "../../../services/Admin/UsersApi";
import { eldersApiServices } from "../../../services/Admin/EldersApi";
import { addToast } from "@heroui/toast";

/**
 * CreateElderlyModal
 *
 * Props:
 *   isOpen     – boolean
 *   onClose    – () => void
 *   onCreated  – () => void  called after successful creation so parent can refresh
 */
export default function CreateElderlyModal({ isOpen, onClose, onCreated }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

    useEffect(() => {
        if (isOpen) {
            usersApiServices.getAllUsers({ UserType: "Employee" })
                .then((res) => {
                    const data = res.data.data?.data || res.data.data || [];
                    setEmployees(Array.isArray(data) ? data : []);
                })
                .catch((err) => console.error("Failed to load employees:", err));
        }
    }, [isOpen]);

    const { mutate: createElderly, isPending } = useMutation({
        mutationFn: (data) => eldersApiServices.createElderly(data),
        onSuccess: () => {
            addToast({ title: "Success", description: "Elder created successfully", color: "success" });
            reset();
            setSelectedEmployeeId("");
            onClose();
            onCreated?.();
        },
        onError: (error) => {
            console.error("Create elderly error:", error.response?.data);
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create elder",
                color: "danger",
            });
        },
    });

    const onSubmit = (data) => {
        createElderly({
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
            roomNumber: data.roomNumber,
            emergencyContact: data.emergencyContact,
            medicalConditions: data.medicalConditions || null,
            allergies: data.allergies || null,
            dietaryRestrictions: data.dietaryRestrictions || null,
            assignedEmployeeIds: selectedEmployeeId ? [parseInt(selectedEmployeeId)] : [],
        });
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ModalHeader className="flex flex-col gap-1">Add New Elder</ModalHeader>
                        <ModalBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="First Name" placeholder="Enter first name" variant="bordered"
                                    {...register("firstName", { required: "First name is required" })}
                                    isInvalid={!!errors.firstName} errorMessage={errors.firstName?.message}
                                />
                                <Input
                                    label="Last Name" placeholder="Enter last name" variant="bordered"
                                    {...register("lastName", { required: "Last name is required" })}
                                    isInvalid={!!errors.lastName} errorMessage={errors.lastName?.message}
                                />
                                <Input
                                    label="Date of Birth" type="date" variant="bordered"
                                    {...register("dateOfBirth", { required: "Date of birth is required" })}
                                    isInvalid={!!errors.dateOfBirth} errorMessage={errors.dateOfBirth?.message}
                                />
                                <Input
                                    label="Room Number" placeholder="Enter room number" variant="bordered"
                                    {...register("roomNumber", { required: "Room number is required" })}
                                    isInvalid={!!errors.roomNumber} errorMessage={errors.roomNumber?.message}
                                />
                                <Input
                                    label="Emergency Contact" placeholder="Enter phone number" variant="bordered"
                                    className="md:col-span-2"
                                    {...register("emergencyContact", { required: "Emergency contact is required" })}
                                    isInvalid={!!errors.emergencyContact} errorMessage={errors.emergencyContact?.message}
                                />
                                <Textarea
                                    label="Medical Conditions" placeholder="Enter any medical conditions"
                                    variant="bordered" className="md:col-span-2"
                                    {...register("medicalConditions")}
                                />
                                <Textarea
                                    label="Allergies" placeholder="Enter any allergies"
                                    variant="bordered"
                                    {...register("allergies")}
                                />
                                <Textarea
                                    label="Dietary Restrictions" placeholder="Enter dietary restrictions"
                                    variant="bordered"
                                    {...register("dietaryRestrictions")}
                                />
                                <Select
                                    label="Assigned Employee" placeholder="Select an employee"
                                    variant="bordered" className="md:col-span-2"
                                    selectedKeys={selectedEmployeeId ? new Set([selectedEmployeeId]) : new Set()}
                                    onSelectionChange={(keys) => setSelectedEmployeeId([...keys][0] || "")}
                                >
                                    {employees.map((emp) => (
                                        <SelectItem key={String(emp.id)} value={String(emp.id)}>
                                            {emp.firstName} {emp.lastName} ({emp.email})
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="flat" onPress={onClose}>Cancel</Button>
                            <Button color="primary" type="submit" isLoading={isPending}>Create Elder</Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    );
}
