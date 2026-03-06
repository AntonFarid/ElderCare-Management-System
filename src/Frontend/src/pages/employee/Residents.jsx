import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Spinner,
    Input,
    Divider,
    Button,
} from "@heroui/react";
import {
    Users,
    Search,
    MapPin,
    Calendar,
    Stethoscope,
    Phone,
    ChevronRight,
    FileText,
} from "lucide-react";
import { employeeApiServices } from "../../services/Employee/EmployeeApi";
import { addToast } from "@heroui/toast";

export default function Residents() {
    const [residents, setResidents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchResidents();
    }, []);

    const fetchResidents = async () => {
        setIsLoading(true);
        try {
            const response = await employeeApiServices.getAssignedElderly();
            setResidents(response.data.data || []);
        } catch (error) {
            console.error("Error fetching assigned elderly:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to load residents",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredResidents = residents.filter((resident) => {
        const query = searchQuery.toLowerCase();
        return (
            resident.firstName?.toLowerCase().includes(query) ||
            resident.lastName?.toLowerCase().includes(query) ||
            resident.fullName?.toLowerCase().includes(query) ||
            resident.roomNumber?.toLowerCase().includes(query)
        );
    });

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return "—";
        const today = new Date();
        const birth = new Date(dateOfBirth);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        My Residents
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {residents.length} elderly resident{residents.length !== 1 ? "s" : ""} assigned to you.
                    </p>
                </div>
                <div className="w-full sm:w-72">
                    <Input
                        placeholder="Search by name or room..."
                        variant="bordered"
                        startContent={<Search className="w-4 h-4 text-gray-400" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        isClearable
                        onClear={() => setSearchQuery("")}
                    />
                </div>
            </div>

            {/* Residents Grid */}
            {filteredResidents.length === 0 ? (
                <Card className="border-none shadow-md">
                    <CardBody className="py-12 flex flex-col items-center justify-center text-center">
                        <Users className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">
                            {searchQuery ? "No residents match your search." : "No residents assigned to you yet."}
                        </p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResidents.map((resident) => (
                        <div
                            key={resident.id}
                            onClick={() => navigate(`/employee/residents/${resident.id}`)}
                            className="cursor-pointer group"
                        >
                            <Card
                                className="border-none shadow-md hover:shadow-lg transition-shadow"
                            >
                                <CardHeader className="px-5 pt-5 pb-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                {(resident.firstName?.[0] ?? "")}{(resident.lastName?.[0] ?? "")}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                                                    {resident.fullName || `${resident.firstName} ${resident.lastName}`}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Chip
                                                        color={resident.isActive ? "success" : "danger"}
                                                        variant="flat"
                                                        size="sm"
                                                    >
                                                        {resident.isActive ? "Active" : "Inactive"}
                                                    </Chip>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </CardHeader>
                                <Divider />
                                <CardBody className="px-5 py-4 space-y-2.5">
                                    {resident.roomNumber && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>Room {resident.roomNumber}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>Age: {resident.age ?? calculateAge(resident.dateOfBirth)}</span>
                                    </div>
                                    {resident.emergencyContact && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{resident.emergencyContact}</span>
                                        </div>
                                    )}
                                    {resident.medicalConditions && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Stethoscope className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">{resident.medicalConditions}</span>
                                        </div>
                                    )}
                                </CardBody>
                                <Divider />
                                <div className="px-5 py-2.5 flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        startContent={<FileText className="w-3.5 h-3.5" />}
                                        onPress={(e) => {
                                            e.stopPropagation && e.stopPropagation();
                                            navigate(`/employee/dailyreports/create?elderlyId=${resident.id}`);
                                        }}
                                    >
                                        Quick Report
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
