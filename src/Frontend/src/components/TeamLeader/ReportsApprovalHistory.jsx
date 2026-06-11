import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Spinner,
    Input,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    Search as SearchIcon,
    FilterX,
    Calendar,
    User,
    Eye,
    RefreshCw,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";
import axios from "axios";

const statusColorMap = {
    Approved: "success",
    Rejected: "danger",
};

export default function ReportsApprovalHistory({ allResidents = [], initialElderlyId }) {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedElderlyId, setSelectedElderlyId] = useState(initialElderlyId || "");

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            if (statusFilter) params.status = statusFilter;
            if (selectedElderlyId) params.elderlyId = selectedElderlyId;

            // Notice we use direct axios here because teamLeaderApiServices currently doesn't map params for this particular API
            const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/reports/approval-history", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                params
            });

            if (response.data.succeeded) {
                setHistory(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching approval history:", error);
            addToast({
                title: "Error",
                description: "Failed to load approval history",
                color: "danger",
            });
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setSelectedElderlyId(initialElderlyId || "");
    }, [initialElderlyId]);

    useEffect(() => {
        fetchHistory();
    }, [selectedElderlyId]);

    const handleApplyFilters = () => {
        fetchHistory();
    };

    const handleClearFilters = () => {
        setFromDate("");
        setToDate("");
        setStatusFilter("");
        setSelectedElderlyId("");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 mt-4">
            {/* Filters */}
            <Card className="shadow-sm">
                <CardBody className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <Input
                            type="date"
                            label="From Date"
                            labelPlacement="outside"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            size="sm"
                            className="max-w-[200px]"
                        />
                        <Input
                            type="date"
                            label="To Date"
                            labelPlacement="outside"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            size="sm"
                            className="max-w-[200px]"
                        />
                        <Select
                            label="Care Resident"
                            labelPlacement="outside"
                            placeholder="All Residents"
                            size="sm"
                            selectedKeys={selectedElderlyId ? [selectedElderlyId] : []}
                            onChange={(e) => setSelectedElderlyId(e.target.value)}
                            className="max-w-[200px]"
                        >
                            {allResidents.map((res) => (
                                <SelectItem key={String(res.id)} value={String(res.id)} textValue={`${res.firstName} ${res.lastName}`}>
                                    {res.firstName} {res.lastName}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="Status"
                            labelPlacement="outside"
                            placeholder="All Statuses"
                            size="sm"
                            selectedKeys={statusFilter ? [statusFilter] : []}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="max-w-[150px]"
                        >
                            <SelectItem key="Approved" value="Approved">Approved</SelectItem>
                            <SelectItem key="Rejected" value="Rejected">Rejected</SelectItem>
                        </Select>
                        <div className="flex gap-2">
                            <Button
                                color="primary"
                                size="sm"
                                onPress={handleApplyFilters}
                                startContent={<SearchIcon className="w-4 h-4" />}
                            >
                                Filter
                            </Button>
                            <Button
                                variant="flat"
                                size="sm"
                                onPress={handleClearFilters}
                                startContent={<FilterX className="w-4 h-4" />}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="flat"
                                size="sm"
                                onClick={fetchHistory}
                                isIconOnly
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center items-center h-[30vh]">
                    <Spinner size="lg" label="Loading history..." />
                </div>
            ) : history.length > 0 ? (
                <Card className="shadow-md">
                    <CardBody className="p-0">
                        <Table aria-label="Approval history table" removeWrapper>
                            <TableHeader>
                                <TableColumn>REPORT DATE</TableColumn>
                                <TableColumn>RESIDENT</TableColumn>
                                <TableColumn>EMPLOYEE</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>REASON / TIME</TableColumn>
                                <TableColumn align="center">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {history.map((record, index) => (
                                    <TableRow key={record.reportId || index} className="hover:bg-default-100 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-400" />
                                                <span className="font-medium">{formatDate(record.reportDate)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>{record.elderlyName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-purple-400" />
                                                <span>{record.employeeName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="sm" variant="flat" color={statusColorMap[record.status] || "default"}>
                                                {record.status}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {record.status === 'Rejected' ? (
                                                 <div className="text-xs text-danger-600 truncate max-w-[200px]" title={record.rejectionReason}>
                                                    {record.rejectionReason}
                                                 </div>
                                            ) : (
                                                 <div className="text-xs text-gray-500">
                                                    Processed on {formatDateTime(record.approvedDate)}
                                                 </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Tooltip content="View Original Report">
                                                    <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => navigate(`/teamleader/reports/${record.reportId}`)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            ) : (
                <Card className="shadow-md">
                    <CardBody className="py-16 text-center">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-default-400 italic">No history records found for the selected dates.</p>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
