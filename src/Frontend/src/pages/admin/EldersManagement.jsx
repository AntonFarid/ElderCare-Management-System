import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Input, Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem,
    Chip,
} from "@heroui/react";
import { Plus, Search, MoreVertical } from "lucide-react";
import { eldersApiServices } from "../../services/Admin/EldersApi";
import { addToast } from "@heroui/toast";
import DeleteElderlyModal from "../../components/Admin/Elders/DeleteElderlyModal";
import CreateElderlyModal from "../../components/Admin/Elders/CreateElderlyModal";

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
        return elders.filter((elder) => {
            const fullName = (elder.firstName || "") + " " + (elder.lastName || "");
            return fullName.toLowerCase().includes(filterValue.toLowerCase()) ||
                (elder.roomNumber && elder.roomNumber.toLowerCase().includes(filterValue.toLowerCase()));
        });
    }, [elders, filterValue]);

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-end gap-3">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search by name or room..."
                    startContent={<Search />}
                    value={filterValue}
                    onClear={() => setFilterValue("")}
                    onValueChange={setFilterValue}
                />
                <div className="flex gap-3">
                    <Button color="primary" endContent={<Plus />} onPress={() => setIsCreateOpen(true)}>
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
        </div>
    );
}