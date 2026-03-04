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
import { eldersApiServices } from "../../../services/Admin/EldersApi";
import { addToast } from "@heroui/toast";

/**
 * DeleteElderlyModal
 *
 * Props:
 *   isOpen      – boolean, controls visibility
 *   onClose     – () => void
 *   elderly     – the elderly object to delete { id, firstName, lastName }
 *   onDeleted   – () => void  called after a successful delete so the parent can refresh
 */
export default function DeleteElderlyModal({ isOpen, onClose, elderly, onDeleted }) {
    const { mutate: deleteElderly, isPending } = useMutation({
        mutationFn: () => eldersApiServices.deleteElderly(elderly.id),
        onSuccess: () => {
            addToast({
                title: "Elderly deleted",
                description: `${elderly.firstName} ${elderly.lastName} has been removed.`,
                color: "success",
            });
            onClose();
            onDeleted?.();
        },
        onError: (error) => {
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete elderly",
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
                            Delete Elderly
                        </ModalHeader>
                        <ModalBody className="pb-2">
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Are you sure you want to delete{" "}
                                <span className="font-semibold text-gray-800 dark:text-white">
                                    {elderly?.firstName} {elderly?.lastName}
                                </span>
                                ? This action <span className="font-semibold text-danger">cannot be undone</span>.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onClose} isDisabled={isPending}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={() => deleteElderly()}
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