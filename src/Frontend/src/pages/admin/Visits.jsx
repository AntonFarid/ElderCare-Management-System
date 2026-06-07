import React, { useState, useEffect, useMemo } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Input, Button, Select, SelectItem, Chip
} from "@heroui/react";
import { Search, CalendarDays, DownloadIcon, FilterXIcon } from "lucide-react";
import { adminVisitsApiServices } from "../../services/Admin/VisitsApi";
import { addToast } from "@heroui/toast";
import * as XLSX from 'xlsx';

const columns = [
    { name: "FAMILY MEMBER", uid: "familyMemberName" },
    { name: "ELDER NAME", uid: "elderlyName" },
    { name: "DATE", uid: "requestedDate" },
    { name: "TIME", uid: "requestedTime" },
    { name: "DURATION (MINS)", uid: "durationMinutes" },
    { name: "STATUS", uid: "status" },
    { name: "APPROVED BY", uid: "approvedByName" },
];

export default function Visits() {
    const [visits, setVisits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        setIsLoading(true);
        try {
            const res = await adminVisitsApiServices.getAllVisits();
            const visitsData = res.data?.data?.data || res.data?.data || res.data || [];
            setVisits(visitsData);
        } catch (error) {
            console.error("Error fetching visits:", error);
            addToast({ title: "Error", description: "Failed to load visits.", color: "danger" });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredVisits = useMemo(() => {
        if (!Array.isArray(visits)) return [];
        let filtered = [...visits];

        // Apply Search
        if (searchQuery) {
            filtered = filtered.filter(v => {
                const searchLower = searchQuery.toLowerCase();
                return (
                    (v.familyMemberName && v.familyMemberName.toLowerCase().includes(searchLower)) ||
                    (v.elderlyName && v.elderlyName.toLowerCase().includes(searchLower))
                );
            });
        }

        // Apply Status Filter
        if (statusFilter && statusFilter !== "all") {
            filtered = filtered.filter(v => v.status === statusFilter);
        }

        // Apply Date Filter (Upcoming vs Past)
        if (dateFilter) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = filtered.filter(v => {
                const visitDate = new Date(v.requestedDate);
                if (dateFilter === "upcoming") {
                    return visitDate >= today;
                } else if (dateFilter === "past") {
                    return visitDate < today;
                }
                return true;
            });
        }

        return filtered;
    }, [visits, searchQuery, statusFilter, dateFilter]);

    const handleClearFilters = () => {
        setSearchQuery("");
        setStatusFilter("");
        setDateFilter("");
    };

    const handleExportExcel = () => {
        const rows = filteredVisits.map(v => ({
            "Family Member": v.familyMemberName || "Unknown",
            "Elder Name": v.elderlyName || "Unknown",
            "Date": new Date(v.requestedDate).toLocaleDateString(),
            "Time": v.requestedTime,
            "Duration (Mins)": v.durationMinutes,
            "Status": v.status,
            "Approved By": v.approvedByName || "—"
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const colWidths = Object.keys(rows[0] || {}).map(key => ({
            wch: Math.max(key.length, ...rows.map(r => String(r[key]).length).slice(0, 50)) + 2
        }));
        worksheet['!cols'] = colWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Visits");
        XLSX.writeFile(workbook, `Visits_Overview_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Approved": return "success";
            case "Pending": return "warning";
            case "Rejected": return "danger";
            case "Cancelled": return "default";
            case "Completed": return "primary";
            default: return "default";
        }
    };

    const renderCell = React.useCallback((visit, columnKey) => {
        const cellValue = visit[columnKey];
        switch (columnKey) {
            case "requestedDate":
                return <span>{new Date(visit.requestedDate).toLocaleDateString()}</span>;
            case "status":
                return (
                    <Chip size="sm" variant="flat" color={getStatusColor(visit.status)}>
                        {visit.status}
                    </Chip>
                );
            case "approvedByName":
                return <span>{visit.approvedByName || <span className="text-gray-400 italic">Pending/Auto</span>}</span>;
            default:
                return cellValue;
        }
    }, []);

    return (
        <div className="p-4 space-y-4">
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <CalendarDays className="w-8 h-8 text-purple-500" />
                    Visits Overview
                </h1>
                <p className="text-gray-500 mt-2">View all past and upcoming visits scheduled by family members.</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div className="flex flex-wrap items-end gap-3 flex-1">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[220px]"
                        placeholder="Search by name..."
                        startContent={<Search className="w-4 h-4" />}
                        value={searchQuery}
                        onClear={() => setSearchQuery("")}
                        onValueChange={setSearchQuery}
                        size="sm"
                    />
                    <Select
                        label="Status"
                        labelPlacement="outside"
                        placeholder="All Statuses"
                        selectedKeys={statusFilter ? [statusFilter] : []}
                        onSelectionChange={(keys) => setStatusFilter([...keys][0] || "")}
                        size="sm"
                        className="w-full sm:w-[150px]"
                    >
                        <SelectItem key="all">All Statuses</SelectItem>
                        <SelectItem key="Pending">Pending</SelectItem>
                        <SelectItem key="Approved">Approved</SelectItem>
                        <SelectItem key="Rejected">Rejected</SelectItem>
                        <SelectItem key="Cancelled">Cancelled</SelectItem>
                        <SelectItem key="Completed">Completed</SelectItem>
                    </Select>
                    <Select
                        label="Date"
                        labelPlacement="outside"
                        placeholder="All Dates"
                        selectedKeys={dateFilter ? [dateFilter] : []}
                        onSelectionChange={(keys) => setDateFilter([...keys][0] || "")}
                        size="sm"
                        className="w-full sm:w-[150px]"
                    >
                        <SelectItem key="all">All Dates</SelectItem>
                        <SelectItem key="upcoming">Upcoming Visits</SelectItem>
                        <SelectItem key="past">Past Visits</SelectItem>
                    </Select>
                    {(searchQuery || statusFilter || dateFilter) && (
                        <Button variant="flat" size="sm" onPress={handleClearFilters} startContent={<FilterXIcon className="w-4 h-4" />}>
                            Clear
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    {filteredVisits.length > 0 && (
                        <Button variant="bordered" color="success" size="sm" onPress={handleExportExcel} startContent={<DownloadIcon className="w-4 h-4" />}>
                            Export To Excel
                        </Button>
                    )}
                </div>
            </div>

            <Table aria-label="Visits Overview Table">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "status" ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={filteredVisits}
                    loadingContent={"Loading..."}
                    loadingState={isLoading ? "loading" : "idle"}
                    emptyContent={"No visits found"}
                >
                    {(item) => (
                        <TableRow key={item.id || Math.random()}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
