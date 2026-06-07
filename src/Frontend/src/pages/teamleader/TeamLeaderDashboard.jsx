import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
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
    Select,
    SelectItem
} from "@heroui/react";
import {
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Calendar,
    BarChart3,
    Eye,
    Users,
    Download
} from "lucide-react";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";

const statusColorMap = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger",
};

export default function TeamLeaderDashboard() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [performanceSummary, setPerformanceSummary] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPerformanceLoading, setIsPerformanceLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("daily");

    const fetchSummary = async () => {
        setIsLoading(true);
        try {
            const response = await teamLeaderApiServices.getReportsSummary();
            if (response.data && response.data.data) {
                setSummary(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching summary:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPerformanceSummary = async (selectedTimeframe = timeframe) => {
        setIsPerformanceLoading(true);
        try {
            const today = new Date();
            let startDateStr = today.toISOString();
            let endDateStr = today.toISOString();

            if (selectedTimeframe === "monthly") {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                startDateStr = thirtyDaysAgo.toISOString();
            }

            const response = await teamLeaderApiServices.getPerformanceSummary(startDateStr, endDateStr);
            if (response.data && response.data.succeeded) {
                setPerformanceSummary(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching performance summary:", error);
        } finally {
            setIsPerformanceLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchPerformanceSummary();
    }, []);

    const handleTimeframeChange = (e) => {
        const value = e.target.value;
        if (!value) return;
        setTimeframe(value);
        fetchPerformanceSummary(value);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleExportExcel = () => {
        if (!performanceSummary || performanceSummary.length === 0) return;
        
        const exportData = performanceSummary.map(emp => {
            const row = {
                "Employee Name": emp.employeeName,
                "Status": emp.status || (emp.clockedIn ? "Clocked In" : "Away"),
                "Total Reports": emp.reportsSubmitted,
                "Approved": emp.reportsApproved,
                "Rejected": emp.reportsRejected
            };
            if (emp.clockInTime) {
                row["Clock In Time"] = new Date(emp.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Data");
        XLSX.writeFile(workbook, `team_performance_${timeframe}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                    Management Dashboard
                </h1>
                <p className="text-gray-500 text-sm">
                    Overview of all submitted employee daily reports and your approval statistics.
                </p>
            </div>

            {/* Summary Cards */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Spinner size="lg" label="Loading dashboard data..." />
                </div>
            ) : summary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    <Card className="shadow-md border-none bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <CardBody className="p-5 flex flex-row items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Approval Rate</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-4xl font-extrabold">{summary.approvalRate}</p>
                                    <span className="text-lg font-medium text-blue-200">%</span>
                                </div>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <CheckCircle2 className="w-6 h-6 text-white" />
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

            {/* Performance Overview Chart */}
            {!isPerformanceLoading && performanceSummary?.length > 0 && (
                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                            {timeframe === "daily" ? "Today's" : "Last 30 Days"} Overall Performance
                        </h2>
                        <div className="flex items-center gap-2">
                            <Select 
                                size="sm" 
                                className="w-40" 
                                selectedKeys={[timeframe]} 
                                onChange={handleTimeframeChange}
                                aria-label="Timeframe"
                            >
                                <SelectItem key="daily" value="daily">Daily View</SelectItem>
                                <SelectItem key="monthly" value="monthly">Monthly View (30d)</SelectItem>
                            </Select>
                            <Button 
                                size="sm" 
                                color="success" 
                                variant="flat" 
                                onPress={handleExportExcel}
                                startContent={<Download className="w-4 h-4" />}
                            >
                                Export Excel
                            </Button>
                        </div>
                    </div>
                    <Card className="shadow-md border-none p-4">
                        <CardBody className="h-80 w-full p-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={performanceSummary}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="employeeName" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="reportsSubmitted" name="Total Reports" fill="#818CF8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="reportsApproved" name="Approved" fill="#34D399" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="reportsRejected" name="Rejected" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Employee Daily Performance Table */}
            {!isPerformanceLoading && performanceSummary?.length > 0 && timeframe === "daily" && (
                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            Today's Network Overview
                        </h2>
                        <Button
                            color="secondary"
                            variant="flat"
                            size="sm"
                            onPress={() => navigate("/teamleader/employees")}
                        >
                            Manage Team
                        </Button>
                    </div>
                    <Card className="shadow-md border-none">
                        <CardBody className="p-0">
                            <Table aria-label="Employee daily performance table" removeWrapper>
                                <TableHeader>
                                    <TableColumn>EMPLOYEE</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                    <TableColumn>SHIFT TIME</TableColumn>
                                    <TableColumn>REPORTS SUBMITTED</TableColumn>
                                    <TableColumn>APPROVED / REJECTED</TableColumn>
                                    <TableColumn align="center">ACTION</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {performanceSummary.map((employee, index) => (
                                        <TableRow key={employee.employeeId || index} className="hover:bg-default-50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-semibold">{employee.employeeName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {employee.clockedIn ? (
                                                    <Chip size="sm" color="success" variant="flat">
                                                        {employee.status || "Clocked In"}
                                                    </Chip>
                                                ) : (
                                                    <Chip size="sm" color="default" variant="flat">
                                                        {employee.status || "Away"}
                                                    </Chip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {employee.clockInTime ? (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {new Date(employee.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                                    {employee.reportsSubmitted}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-success-600 font-medium">
                                                        {employee.reportsApproved} ✓
                                                    </span>
                                                    <span className="text-sm text-danger-600 font-medium">
                                                        {employee.reportsRejected} ✕
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="primary"
                                                    onPress={() => navigate(`/teamleader/employees/${employee.employeeId}/performance`)}
                                                >
                                                    <Eye className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                                                </Button>
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
