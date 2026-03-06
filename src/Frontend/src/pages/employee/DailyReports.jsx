import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
} from "@heroui/react";
import {
    FileText,
    Search as SearchIcon,
    FilterX,
    ChevronDown,
    ChevronRight,
    Calendar,
    User,
    Heart,
    Clock,
    Activity, Plus,
    Eye, Edit, Download
} from "lucide-react";
import { employeeApiServices } from "../../services/Employee/EmployeeApi";
import { addToast } from "@heroui/toast";
import * as XLSX from 'xlsx';

const STATUS_OPTIONS = [
    { key: "", label: "All Statuses" },
    { key: "Pending", label: "Pending" },
    { key: "Approved", label: "Approved" },
    { key: "Rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
    { key: "reportDate", label: "Report Date" },
    { key: "status", label: "Status" },
    { key: "elderlyId", label: "Elderly" },
];

const statusColorMap = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger",
    Draft: "default",
};

const ROWS_PER_PAGE = 10;

export default function DailyReports() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [residents, setResidents] = useState([]);

    // Filters
    const [elderlyFilter, setElderlyFilter] = useState(searchParams.get("elderlyId") || "");
    const [statusFilter, setStatusFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [sortBy, setSortBy] = useState("reportDate");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    // Expanded rows for health metrics
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Fetch assigned elderly for filter dropdown
    useEffect(() => {
        const fetchResidents = async () => {
            try {
                const response = await employeeApiServices.getAssignedElderly();
                setResidents(response.data.data || []);
            } catch (error) {
                console.error("Error fetching residents:", error);
            }
        };
        fetchResidents();
    }, []);

    // Fetch reports
    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const params = {
                PageNumber: page,
                PageSize: ROWS_PER_PAGE,
                SortBy: sortBy,
            };
            if (elderlyFilter) params.ElderlyId = parseInt(elderlyFilter);
            if (statusFilter) params.Status = statusFilter;
            if (fromDate) params.FromDate = fromDate;
            if (toDate) params.ToDate = toDate;

            const response = await employeeApiServices.getReports(params);
            const data = response.data;

            // Handle paginated response: Response<PaginatedResponse<List<DailyReportDto>>>
            // Backend structure: { succeeded: true, data: { data: [...], totalCount: X, ... } }
            if (data.data) {
                if (Array.isArray(data.data)) {
                    // Direct array response
                    setReports(data.data);
                    setTotalPages(Math.ceil(data.data.length / ROWS_PER_PAGE));
                } else if (data.data.data && Array.isArray(data.data.data)) {
                    // Nested paginated response
                    setReports(data.data.data);
                    setTotalPages(data.data.totalPages || Math.ceil(data.data.totalCount / ROWS_PER_PAGE));
                } else {
                    setReports([]);
                    setTotalPages(1);
                }
            } else if (Array.isArray(data)) {
                setReports(data);
                setTotalPages(Math.ceil(data.length / ROWS_PER_PAGE));
            } else {
                setReports([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to load reports",
                color: "danger",
            });
            setReports([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page]);

    const handleApplyFilters = () => {
        setPage(1);
        fetchReports();
    };

    const handleClearFilters = () => {
        setElderlyFilter("");
        setStatusFilter("");
        setFromDate("");
        setToDate("");
        setSortBy("reportDate");
        setPage(1);
        setTimeout(() => fetchReports(), 0);
    };

    const handleExportToExcel = async () => {
        try {
            setIsExporting(true);
            const params = {
                PageNumber: 1,
                PageSize: 10000,
                SortBy: sortBy,
            };
            if (elderlyFilter) params.ElderlyId = parseInt(elderlyFilter);
            if (statusFilter) params.Status = statusFilter;
            if (fromDate) params.FromDate = fromDate;
            if (toDate) params.ToDate = toDate;

            const response = await employeeApiServices.getReports(params);
            const data = response.data;
            let exportData = [];

            if (data.data) {
                if (Array.isArray(data.data)) {
                    exportData = data.data;
                } else if (data.data.data && Array.isArray(data.data.data)) {
                    exportData = data.data.data;
                }
            } else if (Array.isArray(data)) {
                exportData = data;
            }

            if (exportData.length === 0) {
                addToast({
                    title: "Info",
                    description: "No data available to export.",
                    color: "primary",
                });
                return;
            }

            const excelData = exportData.map(report => ({
                "Report ID": report.id || "-",
                "Date": formatDate(report.reportDate),
                "Resident": getResidentName(report.elderlyId),
                "Status": report.approvalStatus || "N/A",
                "Metrics Count": report.healthMetrics?.length || 0,
                "Notes": report.additionalNotes || "-"
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Reports");

            XLSX.writeFile(workbook, `Daily_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);

            addToast({
                title: "Success",
                description: "Reports exported successfully",
                color: "success",
            });
        } catch (error) {
            console.error("Error exporting reports:", error);
            addToast({
                title: "Error",
                description: "Failed to export reports",
                color: "danger",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatDateTime = (val) => {
        if (!val) return "—";

        // Handle TimeSpan string "HH:mm:ss"
        if (typeof val === 'string' && val.includes(':') && !val.includes('-') && !val.includes('T')) {
            const [h, m] = val.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${m} ${ampm}`;
        }

        // Handle .NET Ticks object { ticks: ... }
        if (typeof val === 'object' && val.ticks) {
            try {
                // Use BigInt for precision
                const ticks = BigInt(val.ticks);
                const ms = Number((ticks - 621355968000000000n) / 10000n);
                return new Date(ms).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } catch (e) {
                console.error("Error decoding ticks:", e);
                return "—";
            }
        }

        return new Date(val).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Find resident name by ID
    const getResidentName = (elderlyId) => {
        const resident = residents.find(r => r.id === elderlyId);
        if (resident) return resident.fullName || `${resident.firstName} ${resident.lastName}`;
        return `Elderly #${elderlyId}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        Daily Reports
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        View and manage daily health reports for your assigned residents.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        color="success"
                        variant="flat"
                        onPress={handleExportToExcel}
                        isLoading={isExporting}
                        startContent={!isExporting && <Download className="w-4 h-4" />}
                    >
                        Export to Excel
                    </Button>
                    <Button
                        color="primary"
                        onPress={() => navigate('/employee/dailyreports/create')}
                        startContent={<Plus className="w-4 h-4" />}
                    >
                        New Report
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="shadow-md">
                <CardBody className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <Select
                            label="Resident"
                            labelPlacement="outside"
                            placeholder="All Residents"
                            selectedKeys={elderlyFilter ? [elderlyFilter] : []}
                            onSelectionChange={(keys) => setElderlyFilter([...keys][0] || "")}
                            size="sm"
                        >
                            {[
                                { key: "", label: "All Residents" },
                                ...residents.map(r => ({
                                    key: String(r.id),
                                    label: r.fullName || `${r.firstName} ${r.lastName}`
                                }))
                            ].map((opt) => (
                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="Status"
                            labelPlacement="outside"
                            placeholder="All Statuses"
                            selectedKeys={statusFilter ? [statusFilter] : []}
                            onSelectionChange={(keys) => setStatusFilter([...keys][0] || "")}
                            size="sm"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                            ))}
                        </Select>
                        <Input
                            type="date"
                            label="From Date"
                            labelPlacement="outside"
                            placeholder=" "
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            size="sm"
                        />
                        <Input
                            type="date"
                            label="To Date"
                            labelPlacement="outside"
                            placeholder=" "
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            size="sm"
                        />
                        <Select
                            label="Sort By"
                            labelPlacement="outside"
                            placeholder="Sort By"
                            selectedKeys={[sortBy]}
                            onSelectionChange={(keys) => setSortBy([...keys][0] || "reportDate")}
                            size="sm"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                            ))}
                        </Select>
                        <div className="flex gap-2">
                            <Button
                                color="primary"
                                size="sm"
                                onPress={handleApplyFilters}
                                startContent={<SearchIcon className="w-4 h-4" />}
                                className="flex-1"
                            >
                                Apply
                            </Button>
                            <Button
                                variant="flat"
                                size="sm"
                                onPress={handleClearFilters}
                                startContent={<FilterX className="w-4 h-4" />}
                                className="flex-1"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Results info */}
            <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                    Showing <strong>{reports.length}</strong> report{reports.length !== 1 ? "s" : ""}
                    {statusFilter && (
                        <>
                            {" "}matching{" "}
                            <Chip size="sm" variant="flat" color={statusColorMap[statusFilter] || "default"}>
                                {statusFilter}
                            </Chip>
                        </>
                    )}
                </span>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center items-center h-[30vh]">
                    <Spinner size="lg" />
                </div>
            ) : reports.length > 0 ? (
                <Card className="shadow-md">
                    <CardBody className="p-0">
                        <Table aria-label="Daily reports table" removeWrapper>
                            <TableHeader>
                                <TableColumn width={40}> </TableColumn>
                                <TableColumn>REPORT DATE</TableColumn>
                                <TableColumn>RESIDENT</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>METRICS</TableColumn>
                                <TableColumn>NOTES</TableColumn>
                                <TableColumn align="center">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {reports.flatMap((report, index) => {
                                    const rowId = report.id || index;
                                    const isExpanded = expandedRows.has(rowId);
                                    const hasMetrics = report.healthMetrics && report.healthMetrics.length > 0;

                                    const rows = [
                                        <TableRow
                                            key={`row-${rowId}`}
                                            className="cursor-pointer hover:bg-default-100 transition-colors"
                                            onClick={() => navigate(`/employee/dailyreports/${report.id}`)}
                                        >
                                            <TableCell>
                                                {hasMetrics && (
                                                    isExpanded
                                                        ? <ChevronDown className="w-4 h-4 text-default-400" />
                                                        : <ChevronRight className="w-4 h-4 text-default-400" />
                                                )}
                                            </TableCell>
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
                                                    <span>{getResidentName(report.elderlyId)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={statusColorMap[report.approvalStatus] || "default"}
                                                >
                                                    {report.approvalStatus || "N/A"}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="sm" variant="flat" color="primary">
                                                    {report.healthMetrics?.length || 0} metric{(report.healthMetrics?.length || 0) !== 1 ? "s" : ""}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-500 truncate max-w-[200px] block">
                                                    {report.additionalNotes || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/employee/dailyreports/${report.id}`);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {report.approvalStatus === "Pending" && (
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="warning"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/employee/dailyreports/edit/${report.id}`);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ];

                                    if (isExpanded && hasMetrics) {
                                        rows.push(
                                            <TableRow key={`detail-${rowId}`}>
                                                <TableCell colSpan={6}>
                                                    <div className="p-4 bg-default-50 rounded-xl">
                                                        <p className="text-xs font-semibold text-blue-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                            <Activity className="w-4 h-4" />
                                                            Health Metrics
                                                        </p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {report.healthMetrics.map((metric, mIdx) => (
                                                                <div
                                                                    key={mIdx}
                                                                    className="bg-white dark:bg-default-100 border border-default-200 rounded-lg p-3 space-y-1.5"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                            {metric.metricName}
                                                                        </span>
                                                                        <Chip size="sm" variant="flat" color="secondary">
                                                                            {metric.metricType}
                                                                        </Chip>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-lg font-bold text-blue-600">
                                                                            {metric.metricValue}
                                                                        </span>
                                                                        {metric.unit && (
                                                                            <span className="text-xs text-gray-400">
                                                                                {metric.unit}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {metric.notes && (
                                                                        <p className="text-xs text-gray-500 italic">
                                                                            {metric.notes}
                                                                        </p>
                                                                    )}
                                                                    {metric.recordedTime && (
                                                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                            <Clock className="w-3 h-3" />
                                                                            {formatDateTime(metric.recordedTime)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {report.additionalNotes && (
                                                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                                <p className="text-xs font-semibold text-blue-600 mb-1">Additional Notes</p>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {report.additionalNotes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    return rows;
                                })}
                            </TableBody>
                        </Table>
                    </CardBody>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center py-4 border-t border-default-200">
                            <Pagination
                                total={totalPages}
                                page={page}
                                onChange={setPage}
                                showControls
                                color="primary"
                            />
                        </div>
                    )}
                </Card>
            ) : (
                <Card className="shadow-md">
                    <CardBody className="py-16 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-default-400 italic">
                            No reports found matching your filters.
                        </p>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
