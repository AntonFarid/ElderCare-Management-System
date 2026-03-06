import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, Spinner, Chip, Input, Select, SelectItem, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination } from "@heroui/react";
import { ClipboardListIcon, SearchIcon, FilterXIcon, ChevronDownIcon, ChevronRightIcon, DownloadIcon, UsersIcon, HeartIcon, FileTextIcon, CheckCircleIcon, LogInIcon } from "lucide-react";
import { usersApiServices } from "../../services/Admin/UsersApi";
import * as XLSX from 'xlsx';

const ACTION_OPTIONS = [
    { key: "", label: "All Actions" },
    { key: "Create", label: "Create" },
    { key: "Update", label: "Update" },
    { key: "Delete", label: "Delete" },
];

const ROWS_PER_PAGE = 15;

const actionColorMap = {
    Create: "success",
    Update: "warning",
    Delete: "danger",
};

export default function AuditLogs() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activitySummary, setActivitySummary] = useState(null);

    // Filters
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [entityTypeFilter, setEntityTypeFilter] = useState("");

    // Pagination
    const [page, setPage] = useState(1);

    // Expandable rows
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Available entity types (derived from data)
    const entityTypes = useMemo(() => {
        const types = [...new Set(auditLogs.map(l => l.entityType || l.entityName).filter(Boolean))];
        return [{ key: "", label: "All Entities" }, ...types.map(t => ({ key: t, label: t }))];
    }, [auditLogs]);

    // Fetch audit logs
    const fetchAuditLogs = async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            if (entityTypeFilter) params.entityType = entityTypeFilter;

            const response = await usersApiServices.getAuditLogs(params);
            const data = response.data.data || response.data || [];
            setAuditLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
            setAuditLogs([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
        // Fetch today's activity summary
        const fetchSummary = async () => {
            try {
                const response = await usersApiServices.getActivitySummary();
                const data = response.data.data || response.data;
                setActivitySummary(data);
            } catch (error) {
                console.error("Error fetching activity summary:", error);
            }
        };
        fetchSummary();
    }, []);

    // Apply client-side action filter
    const filteredLogs = useMemo(() => {
        let logs = [...auditLogs];
        if (actionFilter) {
            logs = logs.filter(l => l.action === actionFilter);
        }
        return logs;
    }, [auditLogs, actionFilter]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ROWS_PER_PAGE));
    const paginatedLogs = useMemo(() => {
        const start = (page - 1) * ROWS_PER_PAGE;
        return filteredLogs.slice(start, start + ROWS_PER_PAGE);
    }, [filteredLogs, page]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [actionFilter, auditLogs]);

    const handleApplyFilters = () => {
        setPage(1);
        fetchAuditLogs();
    };

    const handleClearFilters = () => {
        setFromDate("");
        setToDate("");
        setActionFilter("");
        setEntityTypeFilter("");
        setPage(1);
        // Re-fetch without filters
        setTimeout(() => {
            fetchAuditLogs();
        }, 0);
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatJson = (jsonString) => {
        if (!jsonString) return null;
        try {
            const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
            return JSON.stringify(parsed, null, 2);
        } catch {
            return jsonString;
        }
    };

    const handleExportExcel = () => {
        const rows = filteredLogs.map(log => ({
            Action: log.action || "",
            Entity: log.entityType || log.entityName || "",
            "Entity ID": log.entityId ?? "",
            "Performed By": log.performedBy || log.userName || "System",
            "IP Address": log.ipAddress || "",
            Date: new Date(log.timestamp || log.createdAt).toLocaleString(),
            "Old Values": log.oldValues || "",
            "New Values": log.newValues || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Auto-size columns
        const colWidths = Object.keys(rows[0] || {}).map(key => ({
            wch: Math.max(key.length, ...rows.map(r => String(r[key]).length).slice(0, 50)) + 2
        }));
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");

        const today = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `AuditLogs_${today}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <ClipboardListIcon className="w-8 h-8 text-blue-500" />
                    Audit Logs
                </h1>
                <p className="text-gray-500 mt-2">
                    Track all system actions — who did what, when, and what changed.
                </p>
            </div>

            {/* Filters */}
            <Card className="shadow-md">
                <CardBody className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
                            label="Action"
                            labelPlacement="outside"
                            placeholder="All Actions"
                            selectedKeys={actionFilter ? [actionFilter] : []}
                            onSelectionChange={(keys) => setActionFilter([...keys][0] || "")}
                            size="sm"
                        >
                            {ACTION_OPTIONS.map((opt) => (
                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="Entity Type"
                            labelPlacement="outside"
                            placeholder="All Entities"
                            selectedKeys={entityTypeFilter ? [entityTypeFilter] : []}
                            onSelectionChange={(keys) => setEntityTypeFilter([...keys][0] || "")}
                            size="sm"
                        >
                            {entityTypes.map((opt) => (
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
                                startContent={<FilterXIcon className="w-4 h-4" />}
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
                    Showing <strong>{filteredLogs.length}</strong> log{filteredLogs.length !== 1 ? "s" : ""}
                    {actionFilter && <> matching <Chip size="sm" variant="flat" color={actionColorMap[actionFilter] || "default"}>{actionFilter}</Chip></>}
                </span>
                {filteredLogs.length > 0 && (
                    <Button
                        size="sm"
                        variant="bordered"
                        color="success"
                        onPress={handleExportExcel}
                        startContent={<DownloadIcon className="w-4 h-4" />}
                    >
                        Export to Excel
                    </Button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center items-center h-[30vh]">
                    <Spinner size="lg" />
                </div>
            ) : filteredLogs.length > 0 ? (
                <Card className="shadow-md">
                    <CardBody className="p-0">
                        <Table aria-label="Audit logs table" removeWrapper>
                            <TableHeader>
                                <TableColumn width={40}> </TableColumn>
                                <TableColumn>ACTION</TableColumn>
                                <TableColumn>ENTITY</TableColumn>
                                <TableColumn>ENTITY ID</TableColumn>
                                <TableColumn>PERFORMED BY</TableColumn>
                                <TableColumn>IP ADDRESS</TableColumn>
                                <TableColumn>DATE</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {paginatedLogs.flatMap((log, index) => {
                                    const rowId = log.id || index;
                                    const isExpanded = expandedRows.has(rowId);
                                    const hasDetails = log.oldValues || log.newValues;

                                    const rows = [
                                        <TableRow
                                            key={`row-${rowId}`}
                                            className={hasDetails ? "cursor-pointer hover:bg-default-100" : ""}
                                            onClick={() => hasDetails && toggleRow(rowId)}
                                        >
                                            <TableCell>
                                                {hasDetails && (
                                                    isExpanded
                                                        ? <ChevronDownIcon className="w-4 h-4 text-default-400" />
                                                        : <ChevronRightIcon className="w-4 h-4 text-default-400" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={actionColorMap[log.action] || "default"}
                                                >
                                                    {log.action}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>{log.entityType || log.entityName}</TableCell>
                                            <TableCell>{log.entityId}</TableCell>
                                            <TableCell>{log.performedBy || log.userName || "System"}</TableCell>
                                            <TableCell>
                                                <span className="text-xs text-default-400">{log.ipAddress || "—"}</span>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(log.timestamp || log.createdAt).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ];

                                    if (isExpanded && hasDetails) {
                                        rows.push(
                                            <TableRow key={`detail-${rowId}`}>
                                                <TableCell colSpan={7}>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-default-50 rounded-xl">
                                                        {log.oldValues && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wider">Old Values</p>
                                                                <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-x-auto border border-red-200 dark:border-red-800 whitespace-pre-wrap">
                                                                    {formatJson(log.oldValues)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                        {log.newValues && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-green-500 mb-2 uppercase tracking-wider">New Values</p>
                                                                <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded-lg overflow-x-auto border border-green-200 dark:border-green-800 whitespace-pre-wrap">
                                                                    {formatJson(log.newValues)}
                                                                </pre>
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
                    <CardBody className="py-12 text-center text-default-400 italic">
                        No audit logs found matching your filters.
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
