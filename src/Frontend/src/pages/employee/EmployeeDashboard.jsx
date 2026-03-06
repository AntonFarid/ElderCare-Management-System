import React, { useState, useEffect } from "react";
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
} from "@heroui/react";
import {
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Calendar,
    Home,
} from "lucide-react";
import { employeeApiServices } from "../../services/Employee/EmployeeApi";
import TodayShiftCard from "../../components/employee/TodayShiftCard";

const statusColorMap = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger",
    Draft: "default",
};

export default function EmployeeDashboard() {
    const [summary, setSummary] = useState(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [schedule, setSchedule] = useState(null);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

    const fetchSummary = async () => {
        setIsLoadingSummary(true);
        try {
            const response = await employeeApiServices.getReportsSummary();
            if (response.data && response.data.data) {
                setSummary(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching summary:", error);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const fetchSchedule = async () => {
        setIsLoadingSchedule(true);
        try {
            const response = await employeeApiServices.getTodaySchedule();
            const scheduleData = response.data?.data;
            if (Array.isArray(scheduleData) && scheduleData.length > 0) {
                setSchedule(scheduleData[0]);
            } else if (scheduleData && !Array.isArray(scheduleData)) {
                setSchedule(scheduleData);
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setIsLoadingSchedule(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchSchedule();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                    <Home className="w-8 h-8 text-blue-500" />
                    Employee Dashboard
                </h1>
                <p className="text-gray-500 text-sm">Welcome back. Here's an overview of your schedule and daily reports.</p>
            </div>

            {/* Today's Schedule Highlight */}
            <TodayShiftCard schedule={schedule} isLoading={isLoadingSchedule} />

            {/* Summary Cards */}
            {isLoadingSummary ? (
                <div className="flex justify-center items-center py-12">
                    <Spinner size="lg" label="Loading dashboard data..." />
                </div>
            ) : summary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-md border-none">
                        <CardBody className="p-5 flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Reports</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{summary.totalReports}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="shadow-md border-none">
                        <CardBody className="p-5 flex flex-row items-center gap-4">
                            <div className="p-3 bg-warning-100 dark:bg-warning-900/30 text-warning-600 rounded-xl">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{summary.pendingReports}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="shadow-md border-none">
                        <CardBody className="p-5 flex flex-row items-center gap-4">
                            <div className="p-3 bg-success-100 dark:bg-success-900/30 text-success-600 rounded-xl">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{summary.approvedReports}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="shadow-md border-none">
                        <CardBody className="p-5 flex flex-row items-center gap-4">
                            <div className="p-3 bg-danger-100 dark:bg-danger-900/30 text-danger-600 rounded-xl">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rejected</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{summary.rejectedReports}</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            ) : (
                <Card className="shadow-md">
                    <CardBody className="py-12 text-center text-gray-400">
                        Failed to load summary data.
                    </CardBody>
                </Card>
            )}

            {/* Recent Reports Table */}
            {!isLoadingSummary && summary && summary.recentReports && summary.recentReports.length > 0 && (
                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recent Reports</h2>
                    </div>
                    <Card className="shadow-md border-none">
                        <CardBody className="p-0">
                            <Table aria-label="Recent reports table" removeWrapper>
                                <TableHeader>
                                    <TableColumn>REPORT DATE</TableColumn>
                                    <TableColumn>RESIDENT</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                    <TableColumn>DETAILS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {summary.recentReports.map((report, index) => (
                                        <TableRow key={report.reportId || `recent-report-${index}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-400" />
                                                    <span className="font-medium">
                                                        {formatDate(report.reportDate)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span>{report.elderlyName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={statusColorMap[report.status] || "default"}
                                                >
                                                    {report.status || "N/A"}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                {report.status === "Approved" ? (
                                                    <div className="text-xs text-gray-500">
                                                        <span className="font-semibold text-success-600">Approved by:</span> {report.approvedBy || "System"}
                                                        {report.approvedDate && <span> on {formatDate(report.approvedDate)}</span>}
                                                    </div>
                                                ) : report.status === "Rejected" ? (
                                                    <div className="text-xs text-gray-500">
                                                        <span className="font-semibold text-danger-600">Rejection Reason:</span> <br />
                                                        <span className="italic truncate max-w-[200px] inline-block">{report.rejectionReason}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Waiting for approval</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
}
