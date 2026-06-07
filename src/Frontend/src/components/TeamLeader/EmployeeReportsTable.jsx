import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Spinner,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Button,
    Tooltip,
    Pagination,
    Input,
} from "@heroui/react";
import {
    FileText,
    User,
    Calendar,
    Eye,
    ChevronRight,
    Search as SearchIcon,
    ArrowLeft,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";

export default function EmployeeReportsTable() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeReports, setEmployeeReports] = useState([]);
    const [isReportsLoading, setIsReportsLoading] = useState(false);
    
    // Employee Pagination & Search
    const [empPage, setEmpPage] = useState(1);
    const [empTotalPages, setEmpTotalPages] = useState(1);
    const [empSearch, setEmpSearch] = useState("");

    // Reports Pagination
    const [repPage, setRepPage] = useState(1);
    const [repTotalPages, setRepTotalPages] = useState(1);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const params = {
                PageNumber: empPage,
                PageSize: 8,
                SearchTerm: empSearch
            };
            const response = await teamLeaderApiServices.getEmployees(params);
            if (response.data.succeeded) {
                const data = response.data.data;
                setEmployees(data.data || []);
                setEmpTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            addToast({ title: "Error", description: "Failed to load employees", color: "danger" });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployeeReports = async (employeeId) => {
        setIsReportsLoading(true);
        try {
            // Fetch both pending and historical reports for the employee
            const params = {
                employeeId: employeeId,
                PageNumber: repPage,
                PageSize: 15
            };
            
            const [pendingRes, historyRes] = await Promise.all([
                teamLeaderApiServices.getPendingReports(params),
                teamLeaderApiServices.getApprovalHistory(params)
            ]);

            let combinedRecords = [];
            
            if (pendingRes.data.succeeded && pendingRes.data.data) {
                const pendingData = pendingRes.data.data.data || pendingRes.data.data || [];
                combinedRecords = [...combinedRecords, ...(Array.isArray(pendingData) ? pendingData : [])];
            }

            if (historyRes.data.succeeded && historyRes.data.data) {
                const historyData = historyRes.data.data.data || historyRes.data.data || [];
                // Map history fields if they differ slightly from pending
                const mappedHistory = (Array.isArray(historyData) ? historyData : []).map(h => ({
                    ...h,
                    id: h.reportId || h.id // Ensure we have id
                }));
                combinedRecords = [...combinedRecords, ...mappedHistory];
            }

            // Remove duplicates by ID and sort by date descending
            const uniqueRecords = Array.from(new Map(combinedRecords.map(item => [item.id, item])).values())
                .sort((a, b) => new Date(b.reportDate || b.submissionDate) - new Date(a.reportDate || a.submissionDate));

            setEmployeeReports(uniqueRecords);
            // Since we're merging, total pages logic might be complex with individual endpoints, 
            // set to 1 for now if merged manually or use max of both.
            setRepTotalPages(Math.max(pendingRes.data.totalPages || 0, historyRes.data.totalPages || 0, 1));

        } catch (error) {
            console.error("Error fetching employee reports:", error);
            addToast({ title: "Error", description: "Failed to load comprehensive employee history", color: "danger" });
        } finally {
            setIsReportsLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedEmployee) {
            fetchEmployees();
        }
    }, [empPage, empSearch, selectedEmployee]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchEmployeeReports(selectedEmployee.id);
        }
    }, [repPage, selectedEmployee]);

    const statusColorMap = {
        Pending: "warning",
        Approved: "success",
        Rejected: "danger",
    };

    const handleViewReports = (employee) => {
        setSelectedEmployee(employee);
        setRepPage(1);
    };

    const handleBack = () => {
        setSelectedEmployee(null);
        setEmployeeReports([]);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (selectedEmployee) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right duration-400">
                <div className="flex items-center justify-between">
                    <Button 
                        variant="light" 
                        onPress={handleBack}
                        startContent={<ArrowLeft className="w-4 h-4" />}
                        className="font-medium"
                    >
                        Back to Employees
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                            {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                            <p className="text-xs text-gray-400">{selectedEmployee.email}</p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-sm border-none bg-white dark:bg-slate-900 overflow-hidden">
                    <CardBody className="p-0">
                        {isReportsLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <Spinner label="Aggregating records..." />
                            </div>
                        ) : employeeReports.length > 0 ? (
                            <Table 
                                aria-label="Employee reports list" 
                                removeWrapper
                                classNames={{
                                    th: "bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold",
                                    td: "py-4 px-2"
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>SUBMISSION DATE</TableColumn>
                                    <TableColumn>RESIDENT</TableColumn>
                                    <TableColumn>APPROVAL STATE</TableColumn>
                                    <TableColumn align="center">MGMT ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {employeeReports.map((report) => (
                                        <TableRow key={report.id || report.reportId} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-lg">
                                                        <Calendar className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{formatDate(report.reportDate)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-slate-600">{report.elderlyName}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    size="sm" 
                                                    variant="flat" 
                                                    color={statusColorMap[report.approvalStatus || report.status || "Pending"]}
                                                    className="font-black text-[10px] uppercase px-2"
                                                >
                                                    {report.approvalStatus || report.status || "Pending"}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <Tooltip content="Explore Report Details" offset={10}>
                                                        <Button 
                                                            isIconOnly 
                                                            size="sm" 
                                                            variant="flat" 
                                                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl"
                                                            onPress={() => navigate(`/teamleader/reports/${report.id || report.reportId}`)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-24 text-center flex flex-col items-center gap-4 bg-slate-50/20">
                                <div className="bg-white p-6 rounded-full shadow-inner">
                                    <FileText className="w-16 h-16 text-slate-100" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-black text-slate-800">Clear Records</p>
                                    <p className="text-sm text-slate-400 font-medium italic">This member has no historical submissions.</p>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {repTotalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination 
                            total={repTotalPages} 
                            page={repPage} 
                            onChange={setRepPage} 
                            color="primary" 
                            size="sm"
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center gap-4">
                <Input
                    placeholder="Search employees..."
                    value={empSearch}
                    onChange={(e) => {
                        setEmpSearch(e.target.value);
                        setEmpPage(1);
                    }}
                    startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
                    className="max-w-xs"
                    size="sm"
                />
            </div>

            <Card className="shadow-md border-none">
                <CardBody className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner label="Loading employee directory..." />
                        </div>
                    ) : employees.length > 0 ? (
                        <Table aria-label="Employees Table" removeWrapper>
                            <TableHeader>
                                <TableColumn>EMPLOYEE</TableColumn>
                                <TableColumn>ROLE</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn align="right">REPORTS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-default-50 transition-colors cursor-pointer" onClick={() => handleViewReports(emp)}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                    {emp.firstName[0]}{emp.lastName[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{emp.firstName} {emp.lastName}</span>
                                                    <span className="text-[10px] text-gray-400">{emp.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="sm" variant="flat" color="secondary" className="text-[10px]">
                                                {emp.userType}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="sm" color={emp.isActive ? "success" : "default"} variant="dot" className="text-[10px]">
                                                {emp.isActive ? "Active" : "Away"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button 
                                                size="sm" 
                                                variant="flat" 
                                                color="primary"
                                                endContent={<ChevronRight className="w-3 h-3" />}
                                                onPress={() => handleViewReports(emp)}
                                                className="text-[10px] h-7"
                                            >
                                                View All
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="py-20 text-center text-gray-400">No employees found.</div>
                    )}
                </CardBody>
            </Card>

            {empTotalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination 
                        total={empTotalPages} 
                        page={empPage} 
                        onChange={setEmpPage} 
                        color="primary" 
                        size="sm"
                    />
                </div>
            )}
        </div>
    );
}
