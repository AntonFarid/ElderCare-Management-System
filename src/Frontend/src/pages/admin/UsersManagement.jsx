import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Chip,
    User,
    useDisclosure,
} from "@heroui/react";
import { Plus, Search, MoreVertical } from "lucide-react";
import { usersApiServices } from "../../services/Admin/UsersApi";
import { addToast } from "@heroui/toast";
import DeleteUserModal from "../../components/Admin/Users/DeleteUserModal";
import EditUserModal from "../../components/Admin/Users/EditUserModal";
import CreateUserModal from "../../components/Admin/Users/CreateUserModal";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
        return users.filter((user) =>
            user.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
            user.lastName.toLowerCase().includes(filterValue.toLowerCase()) ||
            user.email.toLowerCase().includes(filterValue.toLowerCase())
        );
    }, [users, filterValue]);

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-end gap-3">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search by name or email..."
                    startContent={<Search />}
                    value={filterValue}
                    onClear={() => setFilterValue("")}
                    onValueChange={setFilterValue}
                />
                <div className="flex gap-3">
                    <Button color="primary" endContent={<Plus />} onPress={onOpen}>
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
        </div>
    );
}
