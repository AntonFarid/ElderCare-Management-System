import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner, User, Chip } from '@heroui/react';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import { familyApiServices } from '../../services/Family/FamilyApi';

export default function ContactStaffModal({ isOpen, onOpenChange }) {
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchStaff();
        }
    }, [isOpen]);

    const fetchStaff = async () => {
        setIsLoading(true);
        try {
            // First get linked elderly
            const linkedRes = await familyApiServices.getLinkedElderly();
            if (linkedRes.data && linkedRes.data.succeeded) {
                const elderlyList = linkedRes.data.data;
                const allStaff = [];

                // For each elderly, get their details to find assigned employees
                for (const elderly of elderlyList) {
                    const detailsRes = await familyApiServices.getElderlyDetails(elderly.id);
                    if (detailsRes.data && detailsRes.data.succeeded) {
                        const employees = detailsRes.data.data.assignedEmployees || detailsRes.data.data.AssignedEmployees || [];
                        employees.forEach(emp => {
                            // avoid duplicates
                            if (!allStaff.find(s => s.employeeId === (emp.employeeId || emp.EmployeeId))) {
                                allStaff.push({
                                    ...emp,
                                    forElderly: elderly.fullName || elderly.FullName
                                });
                            }
                        });
                    }
                }
                setStaffList(allStaff);
            }
        } catch (error) {
            console.error("Failed to fetch staff:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-xl font-bold text-gray-900">Responsible Staff</h2>
                            <p className="text-sm font-normal text-gray-500">Contact the healthcare professionals assigned to your loved ones.</p>
                        </ModalHeader>
                        <ModalBody>
                            {isLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <Spinner size="lg" color="primary" />
                                </div>
                            ) : staffList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                    {staffList.map((staff, idx) => {
                                        const empName = staff.employeeName || staff.EmployeeName;
                                        const empEmail = staff.employeeEmail || staff.EmployeeEmail;
                                        const empPhone = staff.employeePhoneNumber || staff.EmployeePhoneNumber;
                                        const isPrimary = staff.isPrimary || staff.IsPrimary;

                                        return (
                                            <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
                                                {isPrimary && (
                                                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3" /> Primary
                                                    </div>
                                                )}
                                                <div className="mb-4">
                                                    <User   
                                                        name={<span className="font-bold text-gray-900 text-base">{empName}</span>}
                                                        description={<span className="text-xs font-medium text-gray-500">Caring for {staff.forElderly}</span>}
                                                        avatarProps={{
                                                            radius: "md",
                                                            size: "md",
                                                            className: "bg-blue-100 text-blue-600 font-bold"
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-3 mt-4">
                                                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl shadow-sm border border-gray-100/50">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                            <Phone className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                                                            <p className="text-sm font-bold text-gray-800 truncate">{empPhone || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl shadow-sm border border-gray-100/50">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                            <Mail className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email Address</p>
                                                            <p className="text-sm font-bold text-gray-800 truncate">{empEmail || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <ShieldCheck className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">No staff assigned</h3>
                                    <p className="text-gray-500 text-sm mt-1 max-w-sm">We couldn't find any healthcare professionals currently assigned to your loved ones.</p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" variant="flat" onPress={onClose} className="font-bold">
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
