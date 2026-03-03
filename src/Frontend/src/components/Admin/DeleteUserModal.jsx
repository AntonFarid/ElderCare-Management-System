import React from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";
import { TriangleAlertIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { adminApiServices } from "../../services/AdminApi";
import { addToast } from "@heroui/toast";

/**
 * DeleteUserModal
 *
 * Props:
 *   isOpen     – boolean, controls visibility
 *   onClose    – () => void
 *   user       – the user object to delete { id, firstName, lastName, email }
 *   onDeleted  – () => void  called after a successful delete so the parent can refresh
 */
export default function DeleteUserModal({ isOpen, onClose, user, onDeleted }) {

    const { mutate: deleteUser, isPending } = useMutation({
        mutationFn: () => adminApiServices.deleteUser(user.id),
        onSuccess: () => {
            addToast({
                title: "User deleted",
                description: `${user.firstName} ${user.lastName} has been removed.`,
                color: "success",
            });
            onClose();
            onDeleted?.();
        },
        onError: (error) => {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete user",
                color: "danger",
            });
        },
    });

    return (
        <Modal isOpen={isOpen} onOpenChange={onClose} size="sm">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2 text-danger">
                            <TriangleAlertIcon className="w-5 h-5" />
                            Delete User
                        </ModalHeader>

                        <ModalBody className="pb-2">
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Are you sure you want to delete{" "}
                                <span className="font-semibold text-gray-800 dark:text-white">
                                    {user?.firstName} {user?.lastName}
                                </span>
                                ? This action <span className="font-semibold text-danger">cannot be undone</span>.
                            </p>
                            {user?.email && (
                                <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <Button variant="flat" onPress={onClose} isDisabled={isPending}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={() => deleteUser()}
                                isLoading={isPending}
                            >
                                Delete
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
