import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Spinner,
    Input,
    Select,
    SelectItem,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Pagination,
    Tooltip,
} from "@heroui/react";
import {
    Search as SearchIcon,
    Users,
    Activity,
    UserCircle,
    Eye,
    Briefcase,
} from "lucide-react";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";
import { useNavigate } from 'react-router-dom';


export default function Employees() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [userType, setUserType] = useState("");
    const [isActive, setIsActive] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Employees safely
    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const params = {
                PageNumber: page,
                PageSize: pageSize,
                SortBy: "FirstName",
                SortDescending: false
            };

            if (debouncedSearch) params.SearchTerm = debouncedSearch;
            if (userType) params.UserType = userType;
            if (isActive !== "") params.IsActive = isActive === "true";

            const response = await teamLeaderApiServices.getEmployees(params);

            if (response.data.succeeded) {
                // The API pagination wrapper typically has the list inside `data.data`
                const responseData = response.data.data;
                setEmployees(responseData.data || []);
                setTotalCount(responseData.totalCount || 0);
                setTotalPages(responseData.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            addToast({
                title: "Error",
                description: "Failed to load team members directory.",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Re-trigger fetch when filters/page changes
    useEffect(() => {
        fetchEmployees();
    }, [page, debouncedSearch, userType, isActive]);

    // Clear filters helper
    const handleClearFilters = () => {
        setSearchTerm("");
        setDebouncedSearch("");
        setUserType("");
        setIsActive("");
        setPage(1);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" />
                        Team Directory
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Manage and oversee your assigned caregiving staff.
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="shadow-sm">
                <CardBody className="p-4 flex flex-col sm:flex-row items-end gap-4">
                    <div className="w-full sm:w-1/3">
                        <Input
                            placeholder="Search by name, email, or username..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
                            isClearable
                            onClear={() => setSearchTerm("")}
                            size="md"
                        />
                    </div>


                    <div className="w-full sm:w-1/4">
                        <Select
                            placeholder="Status"
                            size="md"
                            selectedKeys={isActive !== "" ? [isActive] : []}
                            onChange={(e) => {
                                setIsActive(e.target.value);
                                setPage(1);
                            }}
                            startContent={<Activity className="w-4 h-4 text-gray-400" />}
                        >
                            <SelectItem key="true" value="true">Active Employees</SelectItem>
                            <SelectItem key="false" value="false">Inactive Employees</SelectItem>
                        </Select>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                        <Button
                            color="default"
                            variant="flat"
                            onPress={handleClearFilters}
                            className="w-full sm:w-auto"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Content Table */}
            <Card className="shadow-md">
                <CardBody className="p-0">
                    {isLoading && employees.length === 0 ? (
                        <div className="flex justify-center items-center h-[40vh]">
                            <Spinner size="lg" label="Loading team directory..." />
                        </div>
                    ) : employees.length > 0 ? (
                        <Table aria-label="Employees Directory Table" removeWrapper>
                            <TableHeader>
                                <TableColumn>EMPLOYEE</TableColumn>
                                <TableColumn>ROLE</TableColumn>
                                <TableColumn>HIRE DATE</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn align="center">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-default-100 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-100 p-2 rounded-full hidden sm:block">
                                                    <UserCircle className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</span>
                                                    <span className="text-sm text-gray-500">{emp.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={emp.userType === "Caregiver" ? "primary" : "secondary"}
                                            >
                                                {emp.userType}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-600">
                                                {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="sm" color={emp.isActive ? "success" : "default"} variant="dot">
                                                {emp.isActive ? "Active" : "Inactive"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip content="View Performance">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="primary"
                                                    onPress={() => navigate(`/teamleader/employees/${emp.id}/performance`)}
                                                >
                                                    <Eye className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                                                </Button>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center">
                            <Users className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-medium text-gray-600 mb-1">No employees found</h3>
                            <p className="text-gray-400">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={page}
                        total={totalPages}
                        onChange={(newPage) => setPage(newPage)}
                    />
                </div>
            )}
        </div>
    );
}