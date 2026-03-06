import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card, CardHeader, CardBody, Button, Chip, Divider, Spinner,
} from "@heroui/react";
import {
    ArrowLeft, UserCircle2, Heart, Users,
    Stethoscope, Calendar, MapPin, Phone, AlertTriangle, UtensilsCrossed,
} from "lucide-react";
import { employeeApiServices } from "../../services/Employee/EmployeeApi";
import { addToast } from "@heroui/toast";

export default function ResidentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [elderly, setElderly] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchElderly = async () => {
        setIsLoading(true);
        try {
            const response = await employeeApiServices.getAssignedElderlyById(id);
            const data = response.data.data || response.data;
            setElderly(data);
        } catch (error) {
            console.error("Error fetching elderly details:", error);
            addToast({ title: "Error", description: "Failed to load resident details", color: "danger" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchElderly();
    }, [id]);

    const InfoRow = ({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-3">
            {Icon && <Icon size={16} className="text-default-400 mt-0.5 shrink-0" />}
            <div>
                <p className="text-xs text-default-400">{label}</p>
                <p className="text-sm font-medium">{value || "—"}</p>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!elderly) {
        return (
            <div className="p-4 flex flex-col items-center justify-center space-y-4 h-[50vh]">
                <h2 className="text-2xl font-bold">Resident Not Found</h2>
                <Button color="primary" onPress={() => navigate('/employee/residents')}>
                    Back to Residents
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button isIconOnly variant="light" onPress={() => navigate('/employee/residents')}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{elderly.firstName} {elderly.lastName}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Chip color={elderly.isActive ? "success" : "danger"} size="sm" variant="flat">
                            {elderly.isActive ? "Active" : "Inactive"}
                        </Chip>
                        {elderly.roomNumber && (
                            <Chip size="sm" variant="flat" startContent={<MapPin size={12} />}>
                                Room {elderly.roomNumber}
                            </Chip>
                        )}
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserCircle2 size={20} className="text-primary" />
                        Personal Information
                    </h3>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoRow icon={UserCircle2} label="First Name" value={elderly.firstName} />
                        <InfoRow icon={UserCircle2} label="Last Name" value={elderly.lastName} />
                        <InfoRow icon={Calendar} label="Date of Birth"
                            value={elderly.dateOfBirth
                                ? `${new Date(elderly.dateOfBirth).toLocaleDateString()} (Age: ${elderly.age ?? "—"})`
                                : "—"} />
                        <InfoRow icon={MapPin} label="Room Number" value={elderly.roomNumber} />
                        <InfoRow icon={Phone} label="Emergency Contact" value={elderly.emergencyContact} />
                    </div>
                </CardBody>
            </Card>

            {/* Medical Information */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Stethoscope size={20} className="text-danger" />
                        Medical Information
                    </h3>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoRow icon={Stethoscope} label="Medical Conditions" value={elderly.medicalConditions} />
                        <InfoRow icon={AlertTriangle} label="Allergies" value={elderly.allergies} />
                        <InfoRow icon={UtensilsCrossed} label="Dietary Restrictions" value={elderly.dietaryRestrictions} />
                    </div>
                </CardBody>
            </Card>

            {/* Assignments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assigned Employees */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users size={20} className="text-primary" />
                            Assigned Employees
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {elderly.assignedEmployees && elderly.assignedEmployees.length > 0 ? (
                            <div className="space-y-3">
                                {elderly.assignedEmployees.map((emp) => (
                                    <div key={emp.employeeId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-default-50 border border-default-200">
                                        <div>
                                            <p className="font-medium text-sm">{emp.employeeName}</p>
                                            <p className="text-xs text-default-400">{emp.employeeEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {emp.isPrimary && (
                                                <Chip size="sm" color="warning" variant="flat">Primary</Chip>
                                            )}
                                            <Chip size="sm" variant="flat">
                                                {new Date(emp.assignedDate).toLocaleDateString()}
                                            </Chip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-default-400 text-sm italic">No employees assigned</p>
                        )}
                    </CardBody>
                </Card>

                {/* Family Members */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Heart size={20} className="text-danger" />
                            Family Members
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {elderly.familyMembers && elderly.familyMembers.length > 0 ? (
                            <div className="space-y-3">
                                {elderly.familyMembers.map((fam) => (
                                    <div key={fam.familyMemberId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-default-50 border border-default-200">
                                        <div>
                                            <p className="font-medium text-sm">{fam.familyMemberName}</p>
                                            <p className="text-xs text-default-400">{fam.relationship}</p>
                                        </div>
                                        {fam.isPrimaryContact && (
                                            <Chip size="sm" color="warning" variant="flat">Primary Contact</Chip>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-default-400 text-sm italic">No family members linked</p>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
