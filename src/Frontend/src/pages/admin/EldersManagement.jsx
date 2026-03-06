import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Input, Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem,
    Chip, Select, SelectItem,
} from "@heroui/react";
import { Plus, Search, MoreVertical, HeartIcon, DownloadIcon, FilterXIcon } from "lucide-react";
import { eldersApiServices } from "../../services/Admin/EldersApi";
import { addToast } from "@heroui/toast";
import DeleteElderlyModal from "../../components/Admin/Elders/DeleteElderlyModal";
import CreateElderlyModal from "../../components/Admin/Elders/CreateElderlyModal";
import * as XLSX from 'xlsx';

const columns = [
    { name: "NAME", uid: "name" },
    { name: "ROOM", uid: "roomNumber" },
    { name: "ASSIGNED EMPLOYEE", uid: "assignedEmployee" },
    { name: "STATUS", uid: "isActive" },
    { name: "ACTIONS", uid: "actions" },
];

export default function EldersManagement() {
    const navigate = useNavigate();
    const [elders, setElders] = useState([]);
    const [assignmentsMap, setAssignmentsMap] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [assignmentFilter, setAssignmentFilter] = useState("");
    const [elderlyToDelete, setElderlyToDelete] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const eldersRes = await eldersApiServices.getAllElderly();
            const eldersData = eldersRes.data.data?.data || eldersRes.data.data || eldersRes.data || [];
            const elderToEmpEmailMap = {};

            await Promise.all(
                eldersData.map(async (elder) => {
                    const eId = elder.id || elder.Id;
                    if (eId) {
                        try {
                            const assignmentRes = await eldersApiServices.getAllEmployeeElderlyAssignments({ elderlyId: eId });
                            const data = assignmentRes.data.data?.data || assignmentRes.data.data || assignmentRes.data || [];
                            if (data && data.length > 0) {
                                elderToEmpEmailMap[eId] = data[0].employeeEmail || data[0].EmployeeEmail || "Unknown Email";
                            } else {
                                elderToEmpEmailMap[eId] = "Not Assigned";
                            }
                        } catch (err) {
                            console.error("Failed to fetch assignment for elder " + eId + ":", err);
                            elderToEmpEmailMap[eId] = "Error Loading";
                        }
                    }
                })
            );

            setElders(eldersData);
            setAssignmentsMap(elderToEmpEmailMap);
        } catch (error) {
            console.error("Error fetching data:", error);
            addToast({ title: "Error", description: "Failed to load data", color: "danger" });
        } finally {
            setIsLoading(false);
        }
    };

    const renderCell = React.useCallback((elder, columnKey) => {
        const cellValue = elder[columnKey];
        switch (columnKey) {
            case "name":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{elder.firstName} {elder.lastName}</p>
                    </div>
                );
            case "roomNumber":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm">{elder.roomNumber || "N/A"}</p>
                    </div>
                );
            case "assignedEmployee":
                const eId = elder.id || elder.Id;
                const employeeEmail = assignmentsMap[eId];
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm text-default-500">{employeeEmail || "Not Assigned"}</p>
                    </div>
                );
            case "isActive":
                return (
                    <Chip className="capitalize" color={elder.isActive === false ? "danger" : "success"} size="sm" variant="flat">
                        {elder.isActive === false ? "Inactive" : "Active"}
                    </Chip>
                );
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Button color="primary" size="sm" variant="flat" onPress={() => navigate("/admin/elders/" + elder.id)}>
                            View
                        </Button>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <MoreVertical className="text-default-300" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem color="danger" onPress={() => setElderlyToDelete(elder)}>
                                    Delete
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [navigate, assignmentsMap]);

    const filteredItems = useMemo(() => {
        if (!Array.isArray(elders)) return [];
        let filtered = [...elders];
        if (filterValue) {
            filtered = filtered.filter((elder) => {
                const fullName = (elder.firstName || "") + " " + (elder.lastName || "");
                return fullName.toLowerCase().includes(filterValue.toLowerCase()) ||
                    (elder.roomNumber && elder.roomNumber.toLowerCase().includes(filterValue.toLowerCase()));
            });
        }
        if (statusFilter) {
            filtered = filtered.filter((elder) => {
                if (statusFilter === "active") return elder.isActive !== false;
                if (statusFilter === "inactive") return elder.isActive === false;
                return true;
            });
        }
        if (assignmentFilter) {
            filtered = filtered.filter((elder) => {
                const eId = elder.id || elder.Id;
                const emp = assignmentsMap[eId];
                if (assignmentFilter === "assigned") return emp && emp !== "Not Assigned";
                if (assignmentFilter === "unassigned") return !emp || emp === "Not Assigned";
                return true;
            });
        }
        return filtered;
    }, [elders, filterValue, statusFilter, assignmentFilter, assignmentsMap]);

    const handleClearFilters = () => {
        setFilterValue("");
        setStatusFilter("");
        setAssignmentFilter("");
    };

    const handleExportExcel = () => {
        const rows = filteredItems.map(elder => {
            const eId = elder.id || elder.Id;
            return {
                "First Name": elder.firstName || "",
                "Last Name": elder.lastName || "",
                "Room": elder.roomNumber || "",
                "Status": elder.isActive !== false ? "Active" : "Inactive",
                "Assigned Employee": assignmentsMap[eId] || "Not Assigned",
                "Date of Birth": elder.dateOfBirth ? new Date(elder.dateOfBirth).toLocaleDateString() : "",
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const colWidths = Object.keys(rows[0] || {}).map(key => ({
            wch: Math.max(key.length, ...rows.map(r => String(r[key]).length).slice(0, 50)) + 2
        }));
        worksheet['!cols'] = colWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Elderly");
        XLSX.writeFile(workbook, `Elderly_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <HeartIcon className="w-8 h-8 text-blue-500" />
                    Elders Management
                </h1>
                <p className="text-gray-500 mt-2">Manage all elderly residents in the facility.</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div className="flex flex-wrap items-end gap-3 flex-1">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[220px]"
                        placeholder="Search by name or room..."
                        startContent={<Search className="w-4 h-4" />}
                        value={filterValue}
                        onClear={() => setFilterValue("")}
                        onValueChange={setFilterValue}
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
                        <SelectItem key="">All Statuses</SelectItem>
                        <SelectItem key="active">Active</SelectItem>
                        <SelectItem key="inactive">Inactive</SelectItem>
                    </Select>
                    <Select
                        label="Assignment"
                        labelPlacement="outside"
                        placeholder="All"
                        selectedKeys={assignmentFilter ? [assignmentFilter] : []}
                        onSelectionChange={(keys) => setAssignmentFilter([...keys][0] || "")}
                        size="sm"
                        className="w-full sm:w-[160px]"
                    >
                        <SelectItem key="">All</SelectItem>
                        <SelectItem key="assigned">Assigned</SelectItem>
                        <SelectItem key="unassigned">Unassigned</SelectItem>
                    </Select>
                    {(statusFilter || assignmentFilter) && (
                        <Button variant="flat" size="sm" onPress={handleClearFilters} startContent={<FilterXIcon className="w-4 h-4" />}>
                            Clear
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    {filteredItems.length > 0 && (
                        <Button variant="bordered" color="success" size="sm" onPress={handleExportExcel} startContent={<DownloadIcon className="w-4 h-4" />}>
                            Export To Excel
                        </Button>
                    )}
                    <Button color="primary" size="sm" endContent={<Plus className="w-4 h-4" />} onPress={() => setIsCreateOpen(true)}>
                        Add New Elder
                    </Button>
                </div>
            </div>

            <Table aria-label="Elders management table">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={filteredItems}
                    loadingContent={"Loading..."}
                    loadingState={isLoading ? "loading" : "idle"}
                    emptyContent={"No elders found"}
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <DeleteElderlyModal
                isOpen={!!elderlyToDelete}
                onClose={() => setElderlyToDelete(null)}
                elderly={elderlyToDelete}
                onDeleted={fetchData}
            />

            <CreateElderlyModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={fetchData}
            />
        </div >
    );
}