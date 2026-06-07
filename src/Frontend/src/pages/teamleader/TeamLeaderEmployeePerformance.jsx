import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
    Card,
    CardBody,
    Spinner,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Divider,
} from "@heroui/react";
import {
    UserCircle,
    ArrowLeft,
    Activity,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Briefcase,
    Users,
    Download,
    Phone,
    Shield,
    CalendarPlus
} from "lucide-react";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";

export default function EmployeePerformance() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [performanceData, setPerformanceData] = useState(null);
    const [employeeDetails, setEmployeeDetails] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch profile details, performance data, and attendance logs in parallel
            const [perfResponse, detailsResponse, attendanceResponse] = await Promise.all([
                teamLeaderApiServices.getEmployeePerformance(id),
                teamLeaderApiServices.getEmployeeById(id),
                teamLeaderApiServices.getAttendance({ employeeId: id, PageSize: 10, SortDescending: true })
            ]);

            if (perfResponse.data.succeeded) {
                setPerformanceData(perfResponse.data.data);
            }
            if (detailsResponse.data.succeeded) {
                setEmployeeDetails(detailsResponse.data.data);
            }
            if (attendanceResponse.data?.succeeded && attendanceResponse.data?.data) {
                setAttendanceData(attendanceResponse.data.data.data || []);
            }

        } catch (error) {
            console.error("Error fetching employee performance:", error);
            addToast({
                title: "Error",
                description: "Failed to load employee metrics and details.",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" label="Loading employee dashboard..." />
            </div>
        );
    }

    if (!performanceData && !employeeDetails) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <UserCircle className="w-16 h-16 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-600">Employee Not Found</h3>
                <Button color="primary" variant="flat" onPress={() => navigate('/teamleader/employees')} startContent={<ArrowLeft className="w-4 h-4" />}>
                    Back to Directory
                </Button>
            </div>
        );
    }

    // Helper functions
    const formatPercent = (rate) => `${(rate * 100).toFixed(1)}%`;
    const formatTimeHours = (hours) => hours > 0 ? `${hours.toFixed(1)} hrs` : 'N/A';

    const handleExportExcel = () => {
        if (!performanceData || !employeeDetails) return;

        const wb = XLSX.utils.book_new();

        const overviewData = [
            { Metric: "Employee Name", Value: `${employeeDetails.firstName} ${employeeDetails.lastName}` },
            { Metric: "Email", Value: employeeDetails.email },
            { Metric: "Status", Value: employeeDetails.isActive ? "Active" : "Inactive" },
            { Metric: "Total Reports", Value: performanceData.totalReports || 0 },
            { Metric: "Approved Reports", Value: performanceData.approvedReports || 0 },
            { Metric: "Rejected Reports", Value: performanceData.rejectedReports || 0 },
            { Metric: "Approval Rate", Value: `${((performanceData.approvalRate || 0) * 100).toFixed(1)}%` },
            { Metric: "Days Present", Value: performanceData.daysPresent || 0 },
            { Metric: "Absences", Value: performanceData.daysAbsent || 0 },
            { Metric: "Late Days", Value: performanceData.lateDays || 0 },
            { Metric: "Avg Work Hours", Value: performanceData.averageWorkHours ? performanceData.averageWorkHours.toFixed(1) : 0 }
        ];
        const wsOverview = XLSX.utils.json_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

        if (employeeDetails.assignedElderly && employeeDetails.assignedElderly.length > 0) {
            const residentsData = employeeDetails.assignedElderly.map(r => ({
                "Resident Name": r.elderlyName,
                "Room Number": r.roomNumber,
                "Role": r.isPrimary ? "Primary" : "Secondary",
                "Last Report Status": r.lastReportStatus || "No reports"
            }));
            const wsResidents = XLSX.utils.json_to_sheet(residentsData);
            XLSX.utils.book_append_sheet(wb, wsResidents, "Assigned Residents");
        }

        if (attendanceData && attendanceData.length > 0) {
            const attData = attendanceData.map(a => ({
                "Date": new Date(a.logDate).toLocaleDateString(),
                "Clock In": new Date(a.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                "Clock Out": a.logoutTime ? new Date(a.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active",
            }));
            const wsAtt = XLSX.utils.json_to_sheet(attData);
            XLSX.utils.book_append_sheet(wb, wsAtt, "Recent Attendance Logs");
        }

        XLSX.writeFile(wb, `${employeeDetails.firstName}_${employeeDetails.lastName}_Performance.xlsx`);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header / Back Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        isIconOnly
                        variant="light"
                        color="default"
                        onPress={() => navigate('/teamleader/employees')}
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            {employeeDetails?.firstName || performanceData?.employeeName || 'Employee'} Dashboard
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {employeeDetails?.email || performanceData?.email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {employeeDetails && (
                        <Chip color={employeeDetails.isActive ? "success" : "default"} variant="dot">
                            {employeeDetails.isActive ? "Active Account" : "Inactive Account"}
                        </Chip>
                    )}
                    <Button
                        color="success"
                        variant="flat"
                        size="sm"
                        onPress={handleExportExcel}
                        startContent={<Download className="w-4 h-4" />}
                    >
                        Export Excel
                    </Button>
                </div>
            </div>

            <div className="space-y-6 bg-transparent">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* General Profile Overview */}
                    <Card className="shadow-md lg:col-span-1">
                        <CardBody className="p-6 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                <UserCircle className="w-12 h-12 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {employeeDetails?.firstName} {employeeDetails?.lastName}
                            </h2>
                            <Chip size="sm" color="primary" variant="flat" className="mt-2">
                                {employeeDetails?.userType || 'Caregiver'}
                            </Chip>

                            <Divider className="my-6 w-full" />

                            <div className="w-full space-y-4 text-left">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> Phone
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {employeeDetails?.phoneNumber || "Not provided"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Shield className="w-4 h-4" /> Roles
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {employeeDetails?.roles?.join(', ') || employeeDetails?.userType || "Caregiver"}
                                    </span>
                                </div>

                                <Divider className="my-2 opacity-50" />

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" /> Shift Assigned
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {employeeDetails?.todaySchedule ? `${employeeDetails.todaySchedule.startTime} - ${employeeDetails.todaySchedule.endTime}` : "None Today"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Avg Work Hours
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {formatTimeHours(performanceData?.averageWorkHours || 0)}
                                    </span>
                                </div>

                                <Divider className="my-2 opacity-50" />

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Last Login
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {performanceData?.lastLoginAt ? new Date(performanceData.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <CalendarPlus className="w-4 h-4" /> Joined
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {employeeDetails?.createdAt ? new Date(employeeDetails.createdAt).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Performance Highlights grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Reporting Stats */}
                        <Card className="shadow-sm border-l-4 border-l-blue-500">
                            <CardBody className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Report Submissions</p>
                                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{performanceData?.totalReports || 0}</h3>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <FileText className="w-6 h-6 text-blue-500" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-success" /> {performanceData?.approvedReports || 0} Approved</span>
                                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-danger" /> {performanceData?.rejectedReports || 0} Rejected</span>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Reliability Stats */}
                        <Card className="shadow-sm border-l-4 border-l-indigo-500">
                            <CardBody className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Report Verification Rate</p>
                                        <h3 className="text-3xl font-bold text-gray-900 mt-2">
                                            {formatPercent(performanceData?.approvalRate || 0)}
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-indigo-50 rounded-lg">
                                        <Activity className="w-6 h-6 text-indigo-500" />
                                    </div>
                                </div>
                                <div className="mt-4 text-sm text-gray-600">
                                    Based on team leader quality checks.
                                </div>
                            </CardBody>
                        </Card>

                        {/* Attendance Score */}
                        <Card className="shadow-sm border-l-4 border-l-emerald-500">
                            <CardBody className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Days Present / Active</p>
                                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{performanceData?.daysPresent || 0}</h3>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-lg">
                                        <Calendar className="w-6 h-6 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                                    <span className="text-danger flex items-center gap-1"><XCircle className="w-3 h-3" /> {performanceData?.daysAbsent || 0} Absences</span>
                                    <span className="text-warning flex items-center gap-1"><Clock className="w-3 h-3" /> {performanceData?.lateDays || 0} Lates</span>
                                </div>
                            </CardBody>
                        </Card>

                    </div>
                </div>

                {/* Bottom Section: Twin Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                    {/* Assigned Elderly */}
                    <Card className="shadow-sm">
                        <CardBody className="p-0">
                            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-500" />
                                <h3 className="font-semibold text-gray-800">Assigned Residents</h3>
                            </div>
                            {employeeDetails?.assignedElderly && employeeDetails.assignedElderly.length > 0 ? (
                                <Table aria-label="Assigned residents table" removeWrapper className="w-full">
                                    <TableHeader>
                                        <TableColumn>RESIDENT</TableColumn>
                                        <TableColumn>ROOM</TableColumn>
                                        <TableColumn>LAST REPORT STATUS</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {employeeDetails.assignedElderly.map((assignment, i) => (
                                            <TableRow key={i} className="hover:bg-default-100">
                                                <TableCell className="font-medium text-gray-800">
                                                    {assignment.elderlyName}
                                                    {assignment.isPrimary && <Chip size="sm" color="primary" variant="flat" className="ml-2 py-0.5 text-[10px]">Primary</Chip>}
                                                </TableCell>
                                                <TableCell>{assignment.roomNumber}</TableCell>
                                                <TableCell>
                                                    {assignment.lastReportStatus ? (
                                                        <span className={`text-xs px-2 py-1 rounded-full ${assignment.lastReportStatus === 'Approved' ? 'bg-success-100 text-success-700' : assignment.lastReportStatus === 'Rejected' ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700'}`}>
                                                            {assignment.lastReportStatus}
                                                        </span>
                                                    ) : <span className="text-gray-400 text-xs">No reports</span>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No residents currently assigned to this employee.
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Recent Reports History */}
                    <Card className="shadow-sm">
                        <CardBody className="p-0">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                    <h3 className="font-semibold text-gray-800">Recent Reports Submitted</h3>
                                </div>
                            </div>
                            {performanceData?.recentReports && performanceData.recentReports.length > 0 ? (
                                <Table aria-label="Recent reports block" removeWrapper className="w-full">
                                    <TableHeader>
                                        <TableColumn>DATE</TableColumn>
                                        <TableColumn>ELDERLY</TableColumn>
                                        <TableColumn>STATUS</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {performanceData.recentReports.slice(0, 5).map((report, i) => (
                                            <TableRow key={i} className="hover:bg-default-100">
                                                <TableCell className="text-sm font-medium">
                                                    {new Date(report.reportDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-gray-600">{report.elderlyName}</TableCell>
                                                <TableCell>
                                                    <Chip size="sm" variant="flat" color={report.status === 'Approved' ? 'success' : report.status === 'Rejected' ? 'danger' : 'warning'}>
                                                        {report.status}
                                                    </Chip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No recent reports submitted by this employee.
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Attendance Logs Table */}
                <div className="grid grid-cols-1 mt-6">
                    <Card className="shadow-sm">
                        <CardBody className="p-0">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                    <h3 className="font-semibold text-gray-800">Recent Attendance Logs</h3>
                                </div>
                            </div>
                            {attendanceData && attendanceData.length > 0 ? (
                                <Table aria-label="Attendance logs table" removeWrapper className="w-full">
                                    <TableHeader>
                                        <TableColumn>DATE</TableColumn>
                                        <TableColumn>CLOCK IN</TableColumn>
                                        <TableColumn>CLOCK OUT</TableColumn>
                                        <TableColumn>DURATION</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceData.map((log, i) => (
                                            <TableRow key={i} className="hover:bg-default-100">
                                                <TableCell className="text-sm font-medium">
                                                    {new Date(log.logDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(log.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell>
                                                    {log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                                                        <Chip size="sm" color="success" variant="flat">Clocked In</Chip>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {log.logoutTime ? (
                                                        <span className="text-gray-600">
                                                            {Math.floor((new Date(log.logoutTime) - new Date(log.loginTime)) / 3600000)}h {Math.floor(((new Date(log.logoutTime) - new Date(log.loginTime)) % 3600000) / 60000)}m
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No recent attendance logs found for this employee.
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
