import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Input, Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem,
    Chip, User, useDisclosure, Select, SelectItem,
} from "@heroui/react";
import { Plus, Search, MoreVertical, UsersIcon, DownloadIcon, FilterXIcon } from "lucide-react";
import { usersApiServices } from "../../services/Admin/UsersApi";
import { addToast } from "@heroui/toast";
import DeleteUserModal from "../../components/Admin/Users/DeleteUserModal";
import EditUserModal from "../../components/Admin/Users/EditUserModal";
import CreateUserModal from "../../components/Admin/Users/CreateUserModal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as XLSX from 'xlsx';

const userSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    userType: z.string().min(1, "User type is required"),
    roles: z.array(z.string()).min(1, "At least one role is required")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const statusColorMap = {
    Admin: "danger",
    Employee: "primary",
    FamilyMember: "success",
    TeamLeader: "warning",
};

const columns = [
    { name: "USER", uid: "name" },
    { name: "ROLE", uid: "role" },
    { name: "PHONE", uid: "phone" },
    { name: "ACTIONS", uid: "actions" },
];

export default function UsersManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [userToEdit, setUserToEdit] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            roles: ["Family Member"]
        }
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await usersApiServices.getAllUsers();
            setUsers(response.data.data.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            addToast({
                title: "Error",
                description: "Failed to load users",
                color: "danger"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const { confirmPassword, ...payload } = data;
            await usersApiServices.createUser(payload);
            addToast({
                title: "Success",
                description: "User created successfully",
                color: "success"
            });
            onClose();
            reset();
            fetchUsers();
        } catch (error) {
            console.error("Error creating user:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create user",
                color: "danger"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCell = React.useCallback((user, columnKey) => {
        const cellValue = user[columnKey];

        switch (columnKey) {
            case "name":
                return (
                    <User
                        avatarProps={{ radius: "lg", src: user.profileImageUrl }}
                        description={user.email}
                        name={`${user.firstName} ${user.lastName}`}
                    >
                        {user.email}
                    </User>
                );
            case "role":
                const userRole = user.roles?.[0] ?? user.userType;
                return (
                    <Chip className="capitalize" color={statusColorMap[userRole]} size="sm" variant="flat">
                        {userRole}
                    </Chip>
                );
            case "phone":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{user.phoneNumber}</p>
                    </div>
                );
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Button
                            color="primary"
                            size="sm"
                            variant="flat"
                            onPress={() => navigate(`/admin/users/${user.id}`)}
                        >
                            View
                        </Button>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <MoreVertical className="text-default-300" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem
                                    color="danger"
                                    onPress={() => setUserToDelete(user)}
                                >
                                    Delete User
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [navigate]);

    const filteredItems = useMemo(() => {
        let filtered = [...users];
        if (filterValue) {
            filtered = filtered.filter((user) =>
                user.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
                user.lastName.toLowerCase().includes(filterValue.toLowerCase()) ||
                user.email.toLowerCase().includes(filterValue.toLowerCase())
            );
        }
        if (roleFilter) {
            filtered = filtered.filter((user) => {
                const userRole = user.roles?.[0] ?? user.userType;
                return userRole === roleFilter;
            });
        }
        if (statusFilter) {
            filtered = filtered.filter((user) => {
                if (statusFilter === "active") return user.isActive !== false;
                if (statusFilter === "inactive") return user.isActive === false;
                return true;
            });
        }
        return filtered;
    }, [users, filterValue, roleFilter, statusFilter]);

    const handleClearFilters = () => {
        setFilterValue("");
        setRoleFilter("");
        setStatusFilter("");
    };

    const handleExportExcel = () => {
        const rows = filteredItems.map(user => ({
            "First Name": user.firstName || "",
            "Last Name": user.lastName || "",
            "Email": user.email || "",
            "Phone": user.phoneNumber || "",
            "Role": user.roles?.[0] ?? user.userType ?? "",
            "Status": user.isActive !== false ? "Active" : "Inactive",
            "Created At": user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const colWidths = Object.keys(rows[0] || {}).map(key => ({
            wch: Math.max(key.length, ...rows.map(r => String(r[key]).length).slice(0, 50)) + 2
        }));
        worksheet['!cols'] = colWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        XLSX.writeFile(workbook, `Users_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <UsersIcon className="w-8 h-8 text-blue-500" />
                    Users Management
                </h1>
                <p className="text-gray-500 mt-2">Manage all user accounts in the system.</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div className="flex flex-wrap items-end gap-3 flex-1">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[220px]"
                        placeholder="Search by name or email..."
                        startContent={<Search className="w-4 h-4" />}
                        value={filterValue}
                        onClear={() => setFilterValue("")}
                        onValueChange={setFilterValue}
                        size="sm"
                    />
                    <Select
                        label="Role"
                        labelPlacement="outside"
                        placeholder="All Roles"
                        selectedKeys={roleFilter ? [roleFilter] : []}
                        onSelectionChange={(keys) => setRoleFilter([...keys][0] || "")}
                        size="sm"
                        className="w-full sm:w-[160px]"
                    >
                        <SelectItem key="">All Roles</SelectItem>
                        <SelectItem key="Admin">Admin</SelectItem>
                        <SelectItem key="Employee">Employee</SelectItem>
                        <SelectItem key="TeamLeader">Team Leader</SelectItem>
                        <SelectItem key="FamilyMember">Family Member</SelectItem>
                    </Select>
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
                    {(roleFilter || statusFilter) && (
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
                    <Button color="primary" size="sm" endContent={<Plus className="w-4 h-4" />} onPress={onOpen}>
                        Add New User
                    </Button>
                </div>
            </div>

            <Table aria-label="Users management table">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={filteredItems} loadingContent={"Loading..."} loadingState={isLoading ? "loading" : "idle"} emptyContent={"No users found"}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <CreateUserModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onClose={onClose}
                onCreated={fetchUsers}
            />

            {/* Delete User Modal */}
            <DeleteUserModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                user={userToDelete}
                onDeleted={fetchUsers}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={!!userToEdit}
                onClose={() => setUserToEdit(null)}
                user={userToEdit}
                onUpdated={fetchUsers}
            />
        </div >
    );
}
