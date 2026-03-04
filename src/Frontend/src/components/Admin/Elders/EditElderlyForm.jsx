import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Button, Input, Switch, Select, SelectItem, Textarea, Divider, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { SaveIcon, XIcon, UserCircle2, Users, Heart, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { usersApiServices } from "../../../services/Admin/UsersApi";
import { eldersApiServices } from "../../../services/Admin/EldersApi";
import { addToast } from "@heroui/toast";


export default function EditElderlyForm({ elderly, onCancel, onUpdated }) {

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

    // Dropdown data
    const [employees, setEmployees] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);

    // Assignment form states
    const [empAssignForm, setEmpAssignForm] = useState({ employeeId: "", isPrimary: true });
    const [famAssignForm, setFamAssignForm] = useState({ familyMemberId: "", relationship: "", isPrimary: true });

    // Confirmation modal state
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    // Pre-fill form
    useEffect(() => {
        if (elderly) {
            reset({
                firstName: elderly.firstName ?? "",
                lastName: elderly.lastName ?? "",
                dateOfBirth: elderly.dateOfBirth ? elderly.dateOfBirth.split("T")[0] : "",
                roomNumber: elderly.roomNumber ?? "",
                emergencyContact: elderly.emergencyContact ?? "",
                medicalConditions: elderly.medicalConditions ?? "",
                allergies: elderly.allergies ?? "",
                dietaryRestrictions: elderly.dietaryRestrictions ?? "",
                isActive: elderly.isActive ?? true,
            });
            fetchDropdownData();
        }
    }, [elderly, reset]);

    const fetchDropdownData = async () => {
        try {
            const [empRes, famRes] = await Promise.all([
                usersApiServices.getAllUsers({ UserType: "Employee" }),
                usersApiServices.getAllUsers({ UserType: "FamilyMember" }),
            ]);
            const empData = empRes.data.data?.data || empRes.data.data || [];
            const famData = famRes.data.data?.data || famRes.data.data || [];
            setEmployees(Array.isArray(empData) ? empData : []);
            setFamilyMembers(Array.isArray(famData) ? famData : []);
        } catch (err) {
            console.error("Failed to load dropdown data:", err);
        }
    };

    // --- Mutations ---
    const { mutate: updateElderly, isPending: isUpdating } = useMutation({
        mutationFn: (data) => eldersApiServices.updateElderly(elderly.id, data),
        onSuccess: () => {
            addToast({ title: "Success", description: "Elderly details updated successfully", color: "success" });
            onUpdated?.();
        },
        onError: (error) => {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update elderly",
                color: "danger",
            });
        },
    });

    const { mutate: assignEmployee, isPending: isAssigningEmployee } = useMutation({
        mutationFn: (params) => eldersApiServices.assignEmployeeToElderly(params),
        onSuccess: () => {
            addToast({ title: "Success", description: "Employee assignment updated", color: "success" });
            onUpdated?.();
        },
        onError: (error) => {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update employee assignment",
                color: "danger",
            });
        },
    });

    const { mutate: assignFamily, isPending: isAssigningFamily } = useMutation({
        mutationFn: (params) => eldersApiServices.assignFamilyToElderly(params),
        onSuccess: () => {
            addToast({ title: "Success", description: "Family assignment updated", color: "success" });
            onUpdated?.();
        },
        onError: (error) => {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update family assignment",
                color: "danger",
            });
        },
    });

    const { mutate: removeEmployee, isPending: isRemovingEmployee } = useMutation({
        mutationFn: (params) => eldersApiServices.removeEmployeeAssignment(params),
        onSuccess: () => {
            addToast({ title: "Success", description: "Employee assignment removed", color: "success" });
            onUpdated?.();
        },
        onError: (error) => {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to remove employee assignment",
                color: "danger",
            });
        },
    });

    const { mutate: removeFamily, isPending: isRemovingFamily } = useMutation({
        mutationFn: (params) => eldersApiServices.removeFamilyAssignment(params),
        onSuccess: () => {
            addToast({ title: "Success", description: "Family assignment removed", color: "success" });
            onUpdated?.();
        },
        onError: (error) => {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to remove family assignment",
                color: "danger",
            });
        },
    });

    // --- Handlers ---
    const onSubmitDetails = (data) => {
        updateElderly({
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
            roomNumber: data.roomNumber,
            emergencyContact: data.emergencyContact,
            medicalConditions: data.medicalConditions || null,
            allergies: data.allergies || null,
            dietaryRestrictions: data.dietaryRestrictions || null,
            isActive: data.isActive,
        });
    };

    const handleSaveEmployeeAssignment = () => {
        if (!empAssignForm.employeeId) {
            addToast({ title: "Warning", description: "Please select an employee", color: "warning" });
            return;
        }
        assignEmployee({
            employeeId: parseInt(empAssignForm.employeeId),
            elderlyId: elderly.id,
            isPrimary: empAssignForm.isPrimary,
        });
    };

    const handleSaveFamilyAssignment = () => {
        if (!famAssignForm.familyMemberId) {
            addToast({ title: "Warning", description: "Please select a family member", color: "warning" });
            return;
        }
        assignFamily({
            elderlyId: elderly.id,
            familyMemberId: parseInt(famAssignForm.familyMemberId),
            relationship: famAssignForm.relationship,
            isPrimary: famAssignForm.isPrimary,
        });
    };

    return (
        <div className="space-y-6">
            {/* Section 1: Personal Information */}
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserCircle2 size={20} className="text-primary" />
                        Personal Information
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
                        <Input label="Date of Birth" type="date" variant="bordered"
                            {...register("dateOfBirth", { required: "Date of birth is required" })}
                            isInvalid={!!errors.dateOfBirth} errorMessage={errors.dateOfBirth?.message} />
                        <Input label="Room Number" variant="bordered"
                            {...register("roomNumber", { required: "Room number is required" })}
                            isInvalid={!!errors.roomNumber} errorMessage={errors.roomNumber?.message} />
                        <Input label="Emergency Contact" variant="bordered"
                            {...register("emergencyContact", { required: "Emergency contact is required" })}
                            isInvalid={!!errors.emergencyContact} errorMessage={errors.emergencyContact?.message} />
                        <div /> {/* spacer */}
                        <Textarea label="Medical Conditions" variant="bordered"
                            className="md:col-span-2" {...register("medicalConditions")} />
                        <Textarea label="Allergies" variant="bordered"
                            {...register("allergies")} />
                        <Textarea label="Dietary Restrictions" variant="bordered"
                            {...register("dietaryRestrictions")} />
                        <div className="md:col-span-2 flex items-center gap-3 pt-2">
                            <Controller name="isActive" control={control}
                                render={({ field }) => (
                                    <Switch isSelected={field.value} onValueChange={field.onChange} color="success">
                                        <span className="text-sm font-medium">
                                            {field.value ? "Active" : "Inactive"}
                                        </span>
                                    </Switch>
                                )} />
                        </div>
                    </form>
                </CardBody>
            </Card>

            {/* Section 2: Assignments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Employee Assignment */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users size={20} className="text-primary" />
                            Employee Assignment
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-4">
                        {/* Current assignments */}
                        {elderly.assignedEmployees && elderly.assignedEmployees.length > 0 && (
                            <div className="space-y-3">
                                {elderly.assignedEmployees.map((emp) => (
                                    <div key={emp.employeeId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-default-50 border border-default-200">
                                        <div>
                                            <p className="font-medium text-sm">{emp.employeeName}</p>
                                            <p className="text-xs text-default-400">{emp.employeeEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {emp.isPrimary && <span className="text-xs text-warning font-medium">Primary</span>}
                                            <Button isIconOnly size="sm" color="danger" variant="light"
                                                onPress={() => setDeleteConfirm({
                                                    type: 'employee',
                                                    params: { employeeId: emp.employeeId, elderlyId: elderly.id },
                                                    name: emp.employeeName
                                                })}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Divider />
                        <p className="text-sm font-medium text-default-600">Update Assignment</p>
                        <div className="flex flex-col gap-3">
                            <Select label="Employee" placeholder="Select an employee" variant="bordered" size="sm"
                                selectedKeys={empAssignForm.employeeId ? new Set([empAssignForm.employeeId]) : new Set()}
                                onSelectionChange={(keys) =>
                                    setEmpAssignForm((prev) => ({ ...prev, employeeId: [...keys][0] || "" }))}>
                                {employees.map((emp) => (
                                    <SelectItem key={String(emp.id)} value={String(emp.id)}>
                                        {emp.firstName} {emp.lastName} ({emp.email})
                                    </SelectItem>
                                ))}
                            </Select>
                            <Switch size="sm" isSelected={empAssignForm.isPrimary}
                                onValueChange={(v) => setEmpAssignForm((prev) => ({ ...prev, isPrimary: v }))}
                                color="warning">
                                <span className="text-sm">Primary Caregiver</span>
                            </Switch>
                            <Button size="sm" color="primary" variant="flat"
                                isLoading={isAssigningEmployee}
                                onPress={handleSaveEmployeeAssignment}>
                                Save Assignment
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* Family Assignment */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Heart size={20} className="text-danger" />
                            Family Assignment
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-4">
                        {/* Current family members */}
                        {elderly.familyMembers && elderly.familyMembers.length > 0 && (
                            <div className="space-y-3">
                                {elderly.familyMembers.map((fam) => (
                                    <div key={fam.familyMemberId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-default-50 border border-default-200">
                                        <div>
                                            <p className="font-medium text-sm">{fam.familyMemberName}</p>
                                            <p className="text-xs text-default-400">{fam.relationship}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {fam.isPrimaryContact && <span className="text-xs text-warning font-medium">Primary</span>}
                                            <Button isIconOnly size="sm" color="danger" variant="light"
                                                onPress={() => setDeleteConfirm({
                                                    type: 'family',
                                                    params: { elderlyId: elderly.id, familyMemberId: fam.familyMemberId },
                                                    name: fam.familyMemberName
                                                })}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Divider />
                        <p className="text-sm font-medium text-default-600">Update Assignment</p>
                        <div className="flex flex-col gap-3">
                            <Select label="Family Member" placeholder="Select a family member" variant="bordered" size="sm"
                                selectedKeys={famAssignForm.familyMemberId ? new Set([famAssignForm.familyMemberId]) : new Set()}
                                onSelectionChange={(keys) =>
                                    setFamAssignForm((prev) => ({ ...prev, familyMemberId: [...keys][0] || "" }))}>
                                {familyMembers.map((fam) => (
                                    <SelectItem key={String(fam.id)} value={String(fam.id)}>
                                        {fam.firstName} {fam.lastName} ({fam.email})
                                    </SelectItem>
                                ))}
                            </Select>
                            <Input label="Relationship" placeholder="e.g. Son, Daughter, Spouse" variant="bordered" size="sm"
                                value={famAssignForm.relationship}
                                onValueChange={(v) => setFamAssignForm((prev) => ({ ...prev, relationship: v }))} />
                            <Switch size="sm" isSelected={famAssignForm.isPrimary}
                                onValueChange={(v) => setFamAssignForm((prev) => ({ ...prev, isPrimary: v }))}
                                color="warning">
                                <span className="text-sm">Primary Contact</span>
                            </Switch>
                            <Button size="sm" color="primary" variant="flat"
                                isLoading={isAssigningFamily}
                                onPress={handleSaveFamilyAssignment}>
                                Save Assignment
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)} size="sm">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Confirm Removal</ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    Are you sure you want to remove <strong>{deleteConfirm?.name}</strong> from this elder's {deleteConfirm?.type === 'employee' ? 'employee' : 'family'} assignments?
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>Cancel</Button>
                                <Button color="danger"
                                    isLoading={deleteConfirm?.type === 'employee' ? isRemovingEmployee : isRemovingFamily}
                                    onPress={() => {
                                        if (deleteConfirm?.type === 'employee') {
                                            removeEmployee(deleteConfirm.params);
                                        } else {
                                            removeFamily(deleteConfirm.params);
                                        }
                                        setDeleteConfirm(null);
                                    }}>
                                    Delete
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
