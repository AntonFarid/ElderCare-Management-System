import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    Spinner,
    Chip,
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
    Pagination,
    Tooltip,
    useDisclosure,
    Tabs,
    Tab,
    Avatar,
} from "@heroui/react";
import RejectionModal from "../../components/TeamLeader/RejectionModal";
import ReportsApprovalHistory from "../../components/TeamLeader/ReportsApprovalHistory";
import EmployeeReportsTable from "../../components/TeamLeader/EmployeeReportsTable";
import {
    FileText,
    Search as SearchIcon,
    FilterX,
    Calendar,
    User,
    CheckCircle,
    XCircle,
    Eye,
    RefreshCw,
    Clock,
    AlertCircle,
    CheckCircle2,
    Users,
    Activity,
    Sparkles,
} from "lucide-react";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";

const ROWS_PER_PAGE = 10;

export default function TeamLeaderReports() {
    const navigate = useNavigate();
    const location = useLocation();
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [summary, setSummary] = useState(null);

    // Rejection modal state
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    // Filter Lists
    const [allResidents, setAllResidents] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);

    // Selected Filters
    const [selectedElderlyId, setSelectedElderlyId] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get("elderlyId") || "";
    });
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch summary data
    const fetchSummary = async () => {
        try {
            const response = await teamLeaderApiServices.getReportsSummary();
            if (response.data && response.data.data) {
                setSummary(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
    };

    const fetchFilterLists = async () => {
        setIsLoadingFilters(true);
        try {
            const [residentsRes, employeesRes] = await Promise.all([
                teamLeaderApiServices.getElderly(),
                teamLeaderApiServices.getEmployees({ PageSize: 1000 })
            ]);

            if (residentsRes.data.succeeded) {
                setAllResidents(residentsRes.data.data || []);
            }

            if (employeesRes.data.succeeded) {
                const empData = employeesRes.data.data;
                setAllEmployees(empData.data || empData || []);
            }
        } catch (error) {
            console.error("Error fetching filter lists:", error);
        } finally {
            setIsLoadingFilters(false);
        }
    };

    // Fetch pending reports with Real-Time Health Scan
    const fetchPendingReports = async () => {
        setIsLoading(true);
        try {
            const params = {
                PageNumber: page,
                PageSize: ROWS_PER_PAGE,
            };

            if (selectedElderlyId) params.ElderlyId = parseInt(selectedElderlyId);
            if (selectedEmployeeId) params.EmployeeId = parseInt(selectedEmployeeId);
            if (fromDate) params.FromDate = fromDate;
            if (toDate) params.ToDate = toDate;

            const response = await teamLeaderApiServices.getPendingReports(params);
            const data = response.data;

            if (data.succeeded && data.data) {
                const items = data.data.data || (Array.isArray(data.data) ? data.data : []);
                
                // Run Real-Time Health Scan Engine
                items.forEach(report => {
                    let maxSeverity = "stable"; // "stable" | "warning" | "critical"
                    let severityDetails = [];
                    let anomaliesList = [];

                    if (report.healthMetrics) {
                        report.healthMetrics.forEach(m => {
                            const name = m.metricName?.toLowerCase() || "";
                            const type = m.metricType?.toLowerCase() || "";
                            const value = m.metricValue;

                            // 1. Blood Pressure Check
                            if (type.includes("blood pressure") || name.includes("blood pressure") || name === "bp") {
                                const bp = value.split('/');
                                if (bp.length === 2) {
                                    const systolic = parseInt(bp[0]);
                                    const diastolic = parseInt(bp[1]);
                                    if (!isNaN(systolic) && !isNaN(diastolic)) {
                                        if (systolic >= 160 || diastolic >= 100) {
                                            maxSeverity = "critical";
                                            severityDetails.push(`BP Crisis (${value})`);
                                            anomaliesList.push({ text: `BP Crisis (${value})`, type: "critical", icon: "⚠️" });
                                        } else if (systolic <= 85 || diastolic <= 50) {
                                            maxSeverity = "critical";
                                            severityDetails.push(`Hypotension (${value})`);
                                            anomaliesList.push({ text: `Hypotension (${value})`, type: "critical", icon: "🔻" });
                                        } else if ((systolic >= 140 || diastolic >= 90) && maxSeverity !== "critical") {
                                            maxSeverity = "warning";
                                            severityDetails.push(`Elevated BP (${value})`);
                                            anomaliesList.push({ text: `Elevated BP (${value})`, type: "warning", icon: "⚠️" });
                                        }
                                    }
                                }
                            }

                            // 2. Temperature Check
                            if (type.includes("temperature") || name.includes("temp")) {
                                const temp = parseFloat(value);
                                if (!isNaN(temp)) {
                                    const isFahrenheit = temp > 50;
                                    const isCriticalFever = isFahrenheit ? (temp >= 101.3) : (temp >= 38.5);
                                    const isElevatedTemp = isFahrenheit ? (temp >= 100.0 && temp < 101.3) : (temp >= 37.8 && temp < 38.5);
                                    const isHypothermia = isFahrenheit ? (temp <= 95.0) : (temp <= 35.0);

                                    if (isCriticalFever) {
                                        maxSeverity = "critical";
                                        severityDetails.push(`High Fever (${value})`);
                                        anomaliesList.push({ text: `High Fever (${value}°F)`, type: "critical", icon: "🔥" });
                                    } else if (isHypothermia) {
                                        maxSeverity = "critical";
                                        severityDetails.push(`Hypothermia (${value})`);
                                        anomaliesList.push({ text: `Hypothermia (${value}°F)`, type: "critical", icon: "❄️" });
                                    } else if (isElevatedTemp && maxSeverity !== "critical") {
                                        maxSeverity = "warning";
                                        severityDetails.push(`Elevated Temp (${value})`);
                                        anomaliesList.push({ text: `Elevated Temp (${value}°F)`, type: "warning", icon: "🌡️" });
                                    }
                                }
                            }

                            // 3. Heart Rate Check
                            if (type.includes("heart rate") || name.includes("heart rate") || name.includes("pulse") || name === "hr") {
                                const hr = parseInt(value);
                                if (!isNaN(hr)) {
                                    if (hr >= 120 || hr <= 50) {
                                        maxSeverity = "critical";
                                        severityDetails.push(`Abnormal HR (${value} bpm)`);
                                        anomaliesList.push({ text: `Abnormal HR (${value} bpm)`, type: "critical", icon: "❤️" });
                                    } else if ((hr >= 100 || hr <= 59) && maxSeverity !== "critical") {
                                        maxSeverity = "warning";
                                        severityDetails.push(`Elevated HR (${value} bpm)`);
                                        anomaliesList.push({ text: `Elevated HR (${value} bpm)`, type: "warning", icon: "❤️" });
                                    }
                                }
                            }

                            // 4. Blood Sugar Check
                            if (type.includes("blood sugar") || name.includes("sugar") || name.includes("glucose")) {
                                const bs = parseInt(value);
                                if (!isNaN(bs)) {
                                    if (bs >= 200) {
                                        maxSeverity = "critical";
                                        severityDetails.push(`Hyperglycemia (${value})`);
                                        anomaliesList.push({ text: `Hyperglycemia (${value} mg/dL)`, type: "critical", icon: "🩸" });
                                    } else if (bs <= 60) {
                                        maxSeverity = "critical";
                                        severityDetails.push(`Hypoglycemia (${value})`);
                                        anomaliesList.push({ text: `Hypoglycemia (${value} mg/dL)`, type: "critical", icon: "🩸" });
                                    }
                                }
                            }

                            // 5. Missed Medications Check
                            if (type.includes("medication") || name.includes("medication") || name.includes("dose") || name.includes("taken")) {
                                const missedVal = parseInt(value);
                                if (!isNaN(missedVal) && (name.includes("missed") || type.includes("missed"))) {
                                    if (missedVal >= 2) {
                                        maxSeverity = "critical";
                                        severityDetails.push(`Missed Meds (${missedVal})`);
                                        anomaliesList.push({ text: `Missed Meds (${missedVal})`, type: "critical", icon: "💊" });
                                    }
                                } else if (value === "0" && (name.includes("taken") || name.includes("adherence") || type.includes("taken"))) {
                                    maxSeverity = "critical";
                                    severityDetails.push(`Missed All Meds`);
                                    anomaliesList.push({ text: `Missed All Meds`, type: "critical", icon: "💊" });
                                }
                            }
                        });
                    }

                    report.clinicalSeverity = maxSeverity;
                    report.clinicalDetails = severityDetails.join(", ");
                    report.clinicalAnomalies = anomaliesList;
                });

                setReports(items);
                setTotalCount(data.data.totalCount || items.length);
                setTotalPages(data.data.totalPages || 1);
            } else {
                setReports([]);
                setTotalCount(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Error fetching pending reports:", error);
            addToast({
                title: "Error",
                description: "Failed to load pending reviews.",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFilterLists();
        fetchSummary();
    }, []);

    useEffect(() => {
        fetchPendingReports();
    }, [page]);

    const handleApplyFilters = () => {
        setPage(1);
        fetchPendingReports();
    };

    const handleClearFilters = () => {
        setSelectedElderlyId("");
        setSelectedEmployeeId("");
        setFromDate("");
        setToDate("");
        setPage(1);
        setTimeout(() => fetchPendingReports(), 0);
    };

    const handleApprove = async (reportId) => {
        try {
            await teamLeaderApiServices.approveReport({ reportId });
            addToast({
                title: "Success",
                description: "Report approved successfully",
                color: "success",
            });
            fetchPendingReports();
            fetchSummary();
        } catch (error) {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to approve report",
                color: "danger",
            });
        }
    };

    const handleOpenRejectModal = (reportId) => {
        setSelectedReportId(reportId);
        setRejectionReason("");
        onOpen();
    };

    const handleConfirmReject = async (onClose) => {
        if (!rejectionReason.trim()) {
            addToast({
                title: "Error",
                description: "Please provide a rejection reason.",
                color: "danger",
                duration: 3000,
            });
            return;
        }

        setIsRejecting(true);
        try {
            await teamLeaderApiServices.rejectReport({
                reportId: selectedReportId,
                rejectionReason: rejectionReason.trim(),
            });
            addToast({
                title: "Success",
                description: "Report rejected successfully",
                color: "success",
            });
            onClose();
            fetchPendingReports();
            fetchSummary();
        } catch (error) {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to reject report",
                color: "danger",
            });
        } finally {
            setIsRejecting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-4 lg:p-6 bg-slate-50/50 min-h-screen">
            {/* Header section with rich aesthetics */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 mt-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
                            <FileText className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Reporting Center
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">
                        Professional oversight for team submissions and care records.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 px-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Scan Active</span>
                    </div>
                    <Button
                        color="primary"
                        variant="light"
                        size="sm"
                        onPress={() => { fetchPendingReports(); fetchSummary(); }}
                        startContent={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                        className="font-bold h-9 bg-blue-50/50 hover:bg-blue-100 transition-colors"
                    >
                        Sync Data
                    </Button>
                </div>
            </div>

            {/* Premium Stat Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-slate-800 overflow-hidden group">
                        <CardBody className="p-0 relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-warning" />
                            <div className="p-6 flex flex-row items-center gap-4">
                                <div className="p-3.5 bg-warning-50 dark:bg-warning-900/20 text-warning-600 rounded-2xl transition-transform duration-300 group-hover:scale-110">
                                    <Clock className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Awaiting Review</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{summary.pendingReports}</p>
                                        <span className="text-xs font-medium text-warning-600 bg-warning-50 px-2 py-0.5 rounded-full">Urgent</span>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-slate-800 overflow-hidden group">
                        <CardBody className="p-0 relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-success" />
                            <div className="p-6 flex flex-row items-center gap-4">
                                <div className="p-3.5 bg-success-50 dark:bg-success-900/20 text-success-600 rounded-2xl transition-transform duration-300 group-hover:scale-110">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Approved</p>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{summary.approvedReports}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-slate-800 overflow-hidden group">
                        <CardBody className="p-0 relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-danger" />
                            <div className="p-6 flex flex-row items-center gap-4">
                                <div className="p-3.5 bg-danger-50 dark:bg-danger-900/20 text-danger-600 rounded-2xl transition-transform duration-300 group-hover:scale-110">
                                    <AlertCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Rejected</p>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{summary.rejectedReports}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden group">
                        <CardBody className="p-6 flex flex-row items-center justify-between relative">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Activity className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-[0.2em] mb-2 drop-shadow-sm">System Quality Score</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-4xl font-black">{summary.approvalRate}</p>
                                    <span className="text-lg font-bold text-indigo-100">%</span>
                                </div>
                                <p className="text-[10px] text-indigo-100 mt-2 font-medium">Compliance threshold met</p>
                            </div>
                            <div className="h-12 w-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Central Tabs Navigation */}
            <div className="bg-white dark:bg-slate-800 rounded-[28px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-500">
                <Tabs
                    aria-label="Reports Perspective"
                    variant="light"
                    color="primary"
                    size="lg"
                    classNames={{
                        tabList: "gap-6 p-1 bg-transparent",
                        cursor: "w-full bg-blue-500/10 rounded-2xl border-b-2 border-blue-500",
                        tab: "h-12 px-6",
                        tabContent: "group-data-[selected=true]:text-blue-600 group-data-[selected=true]:font-bold text-slate-500 font-semibold"
                    }}
                >
                    <Tab
                        key="pending"
                        title={
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Action Queue</span>
                                <Chip size="sm" color="warning" variant="solid" className="h-5 min-w-5 text-[10px] px-1 font-black">
                                    {totalCount}
                                </Chip>
                            </div>
                        }
                    >
                        <div className="p-4 pt-6 space-y-6">
                            {/* Filter Engine */}
                            <Card className="border-none shadow-sm bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-2">
                                <CardBody className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                                        <Select
                                            label="Care Resident"
                                            labelPlacement="outside"
                                            placeholder="All Records"
                                            variant="faded"
                                            selectedKeys={selectedElderlyId ? [selectedElderlyId] : []}
                                            onSelectionChange={(keys) => setSelectedElderlyId([...keys][0] || "")}
                                            size="md"
                                            isLoading={isLoadingFilters}
                                            className="font-medium"
                                        >
                                            {allResidents.map((res) => (
                                                <SelectItem key={String(res.id)} textValue={`${res.firstName} ${res.lastName}`}>
                                                    {res.firstName} {res.lastName}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Assigned Caregiver"
                                            labelPlacement="outside"
                                            placeholder="All Staff"
                                            variant="faded"
                                            selectedKeys={selectedEmployeeId ? [selectedEmployeeId] : []}
                                            onSelectionChange={(keys) => setSelectedEmployeeId([...keys][0] || "")}
                                            size="md"
                                            isLoading={isLoadingFilters}
                                            className="font-medium"
                                        >
                                            {allEmployees.map((emp) => (
                                                <SelectItem key={String(emp.id)} textValue={`${emp.firstName} ${emp.lastName}`}>
                                                    {emp.firstName} {emp.lastName}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            type="date"
                                            label="Timeline From"
                                            labelPlacement="outside"
                                            variant="faded"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            size="md"
                                            className="font-medium"
                                        />
                                        <Input
                                            type="date"
                                            label="Timeline To"
                                            labelPlacement="outside"
                                            variant="faded"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            size="md"
                                            className="font-medium"
                                        />

                                        <div className="flex gap-2">
                                            <Button
                                                color="primary"
                                                size="md"
                                                onPress={handleApplyFilters}
                                                startContent={<SearchIcon className="w-4 h-4" />}
                                                className="flex-1 font-bold rounded-xl shadow-lg shadow-blue-500/20"
                                            >
                                                Filter
                                            </Button>
                                            <Button
                                                variant="light"
                                                size="md"
                                                onPress={handleClearFilters}
                                                startContent={<FilterX className="w-4 h-4" />}
                                                className="flex-1 font-bold rounded-xl text-slate-500"
                                            >
                                                Reset
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Main Data View */}
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
                                    <Spinner size="lg" color="primary" />
                                    <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-[0.2em]">Retrieving secure records...</p>
                                </div>
                            ) : reports.length > 0 ? (
                                <div className="space-y-4">
                                    <Table
                                        aria-label="Action queue table"
                                        removeWrapper
                                        classNames={{
                                            th: "bg-slate-50/80 dark:bg-slate-900 text-slate-400 font-bold text-[10px] uppercase tracking-widest py-4 border-b border-slate-100 dark:border-slate-800",
                                            td: "py-4 px-2 border-b border-slate-50 dark:border-slate-800/50",
                                            tr: "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                                        }}
                                    >
                                        <TableHeader>
                                            <TableColumn>SCHEDULED DATE</TableColumn>
                                            <TableColumn>RESIDENT PROFILE</TableColumn>
                                            <TableColumn>SUBMITTED BY</TableColumn>
                                            <TableColumn>CARE INSIGHT</TableColumn>
                                            <TableColumn align="center">MGMT ACTIONS</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {reports.map((report) => (
                                                <TableRow key={report.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">{formatDate(report.reportDate)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                size="sm"
                                                                name={report.elderlyName}
                                                                className="bg-purple-100 text-purple-600 font-bold text-[10px] shadow-sm"
                                                            />
                                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{report.elderlyName || `Elderly #${report.elderlyId}`}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                size="sm"
                                                                name={report.employeeName}
                                                                className="bg-indigo-100 text-indigo-600 font-bold text-[10px] shadow-sm"
                                                            />
                                                            <span className="font-semibold text-slate-600 dark:text-slate-300">{report.employeeName || `Employee #${report.employeeId}`}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-[280px]">
                                                            {(() => {
                                                                const hasAiWarning = report.aiGeneratedReport && report.aiGeneratedReport.includes("🔴 URGENT AI WARNING");
                                                                const severity = report.clinicalSeverity || "stable";
                                                                const anomalies = report.clinicalAnomalies || [];
                                                                const hasCriticalVitals = anomalies.some(anom => anom.type === "critical" && !anom.text.toLowerCase().includes("med"));

                                                                let mainBadge = null;
                                                                let anomalyPillStyle = "";

                                                                if (hasCriticalVitals) {
                                                                    mainBadge = (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30 animate-pulse shadow-sm">
                                                                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping"></span>
                                                                            🚨 Critical Risk
                                                                        </span>
                                                                    );
                                                                    anomalyPillStyle = "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/10 shadow-sm";
                                                                } else if (anomalies.length > 0) {
                                                                    mainBadge = (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 shadow-sm">
                                                                            ⚠️ Warning
                                                                        </span>
                                                                    );
                                                                    anomalyPillStyle = "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/10 shadow-sm";
                                                                } else {
                                                                    mainBadge = (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 shadow-sm">
                                                                            ✓ Stable
                                                                        </span>
                                                                    );
                                                                }

                                                                return (
                                                                    <div className="flex flex-wrap gap-1 items-center max-w-[280px] py-1">
                                                                        {mainBadge}
                                                                        {anomalies.map((anom, aIdx) => (
                                                                            <span key={aIdx} className={anomalyPillStyle}>
                                                                                {anom.icon} {anom.text}
                                                                            </span>
                                                                        ))}
                                                                        {!hasAiWarning && severity === "stable" && anomalies.length === 0 && (
                                                                            <span className="text-[9px] font-medium text-emerald-600/80 dark:text-emerald-500/80">
                                                                                AI Scan Cleared
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Tooltip content="Review Details" offset={10} color="default">
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    variant="flat"
                                                                    onPress={() => navigate(`/teamleader/reports/${report.id}`)}
                                                                    className="bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-all rounded-xl"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            </Tooltip>
                                                            <Tooltip content="Quick Approve" offset={10} color="success">
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    variant="flat"
                                                                    color="success"
                                                                    onPress={() => handleApprove(report.id)}
                                                                    className="rounded-xl shadow-sm hover:shadow-success/20 transition-all"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </Button>
                                                            </Tooltip>
                                                            <Tooltip content="Reject & Return" offset={10} color="danger">
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    variant="flat"
                                                                    color="danger"
                                                                    onPress={() => handleOpenRejectModal(report.id)}
                                                                    className="rounded-xl shadow-sm hover:shadow-danger/20 transition-all"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </Button>
                                                            </Tooltip>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {totalPages > 1 && (
                                        <div className="flex justify-center py-8 border-t border-slate-50 dark:border-slate-800">
                                            <Pagination
                                                total={totalPages}
                                                page={page}
                                                onChange={setPage}
                                                showControls
                                                color="primary"
                                                variant="bordered"
                                                size="md"
                                                radius="full"
                                                classNames={{
                                                    cursor: "bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30"
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-24 text-center flex flex-col items-center gap-4 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
                                    <div className="bg-white p-6 rounded-full shadow-inner">
                                        <FileText className="w-16 h-16 text-slate-200" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-slate-900">Queue is empty</p>
                                        <p className="text-sm text-slate-400 font-medium italic">No pending reports match your current filters.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Tab>

                    <Tab
                        key="employees"
                        title={
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>Team Oversight</span>
                            </div>
                        }
                    >
                        <div className="p-4 pt-6">
                            <EmployeeReportsTable />
                        </div>
                    </Tab>

                    <Tab
                        key="history"
                        title={
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                <span>Audit Archive</span>
                            </div>
                        }
                    >
                        <div className="p-4 pt-6">
                            <ReportsApprovalHistory elderlyId={selectedElderlyId} />
                        </div>
                    </Tab>
                </Tabs>
            </div>

            {/* Rejection Modal */}
            <RejectionModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                reportId={selectedReportId}
                rejectionReason={rejectionReason}
                onReasonChange={setRejectionReason}
                onConfirm={handleConfirmReject}
                isLoading={isRejecting}
            />
        </div>
    );
}
