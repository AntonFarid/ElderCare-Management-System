import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
} from "@heroui/react";
import { XCircle } from "lucide-react";

/**
 * Reusable Rejection Modal for Team Leader report/visit rejection flows.
 *
 * Props:
 *  - isOpen         {boolean}   Whether the modal is visible
 *  - onOpenChange   {function}  HeroUI disclosure handler (controls open/close)
 *  - reportId       {number}    ID of the item being rejected (shown in header)
 *  - rejectionReason {string}   Current value of the textarea
 *  - onReasonChange {function}  Called with the new string when textarea changes
 *  - onConfirm      {function}  Called with (onClose) when "Confirm Rejection" is pressed
 *  - isLoading      {boolean}   Shows a spinner on the confirm button while submitting
 *  - title          {string}    Optional – overrides the modal header text
 */
export default function RejectionModal({
    isOpen,
    onOpenChange,
    reportId,
    rejectionReason,
    onReasonChange,
    onConfirm,
    isLoading = false,
    title,
}) {
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2 text-danger-600">
                            <XCircle className="w-5 h-5" />
                            {title ?? `Reject Report #${reportId}`}
                        </ModalHeader>

                        <ModalBody>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Please provide a reason for rejecting this daily care report.
                                This reason will be visible to the employee who submitted it.
                            </p>
                            <Textarea
                                isRequired
                                label="Rejection Reason"
                                placeholder="Enter detailed reason here..."
                                variant="bordered"
                                value={rejectionReason}
                                onValueChange={onReasonChange}
                                minRows={4}
                            />
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                color="default"
                                variant="light"
                                onPress={onClose}
                                isDisabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={() => onConfirm(onClose)}
                                isLoading={isLoading}
                            >
                                Confirm Rejection
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
