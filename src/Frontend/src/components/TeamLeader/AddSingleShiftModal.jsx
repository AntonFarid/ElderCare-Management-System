import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Tooltip
} from "@heroui/react";

import {
    Clock,
    FileText,
    CheckCircle2,
    Coffee,
    Briefcase,
    AlertCircle,
    Zap
} from "lucide-react";

export default function AddSingleShiftModal({
    isOpen,
    onOpenChange,
    employees,
    singleFormData,
    setSingleFormData,
    handleSingleSubmit,
    isCreatingSingle,
    shiftTypes
}) {
    const isOffDay = (singleFormData.shiftType === "Off Day" || singleFormData.shiftType === "OffDay");

    const presets = [
        { label: "Morning", start: "08:00", end: "16:00", type: "Morning", color: "primary" },
        { label: "Afternoon", start: "12:00", end: "20:00", type: "Afternoon", color: "secondary" },
        { label: "Night", start: "20:00", end: "04:00", type: "Night", color: "warning" },
        { label: "Overnight", start: "00:00", end: "08:00", type: "Overnight", color: "default" },
        { label: "Off Day", start: "00:00", end: "00:00", type: "OffDay", color: "danger" }
    ];

    const applyPreset = (preset) => {
        setSingleFormData(prev => ({
            ...prev,
            startTime: preset.start,
            endTime: preset.end,
            shiftType: preset.type
        }));
    };

    const offDayReasons = [
        { label: "Weekly Rest", value: "Rotational Off Day" },
        { label: "Annual Leave", value: "Annual Leave" },
        { label: "Sick Leave", value: "Sick Leave" },
        { label: "Public Holiday", value: "Public Holiday" },
        { label: "Personal Reason", value: "Personal Reason" }
    ];
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center" size="md">
            <ModalContent>
                {(onClose) => (
                    <form onSubmit={handleSingleSubmit}>
                        <ModalHeader className="flex flex-col gap-1 border-b">Create Single Shift</ModalHeader>
                        <ModalBody className="py-6">
                            <div className="space-y-4">
                                <Select
                                    label="Select Caregiver"
                                    placeholder="Choose an employee"
                                    name="employeeId"
                                    selectedKeys={singleFormData.employeeId ? [singleFormData.employeeId.toString()] : []}
                                    onChange={(e) => setSingleFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                    isRequired
                                    variant="bordered"
                                    emptyContent="No caregivers found. Verify team members are active."
                                >
                                    {(employees || []).map(emp => (
                                        <SelectItem key={emp.id.toString()} textValue={`${emp.firstName} ${emp.lastName}`}>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{emp.firstName} {emp.lastName}</span>
                                                <span className="text-tiny text-default-400">{emp.email}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Input
                                    type="date"
                                    label="Shift Date"
                                    name="shiftDate"
                                    value={singleFormData.shiftDate}
                                    onChange={(e) => setSingleFormData(prev => ({ ...prev, shiftDate: e.target.value }))}
                                    isRequired
                                    variant="bordered"
                                    isInvalid={singleFormData.shiftDate && singleFormData.shiftDate < new Date().toISOString().split('T')[0]}
                                    errorMessage={singleFormData.shiftDate && singleFormData.shiftDate < new Date().toISOString().split('T')[0] ? "Cannot schedule for past dates" : ""}
                                />

                                <div className={`p-4 rounded-xl border-2 transition-all ${isOffDay ? 'border-amber-200 bg-amber-50/50' : 'border-indigo-100 bg-indigo-50/30'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${isOffDay ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {isOffDay ? <Coffee className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{isOffDay ? 'Rest / Off Day' : 'Active Duty'}</p>
                                                <p className="text-[10px] text-gray-500">{isOffDay ? 'Employee will be unavailable' : 'Regular working shift'}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color={isOffDay ? "primary" : "warning"}
                                            onPress={() => setSingleFormData(prev => ({
                                                ...prev,
                                                shiftType: isOffDay ? "Morning" : "OffDay",
                                                notes: isOffDay ? "" : "Rotational Off Day"
                                            }))}
                                        >
                                            {isOffDay ? "Switch to Working" : "Mark as Off Day"}
                                        </Button>
                                    </div>

                                    {!isOffDay ? (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                            {/* Quick Presets Section */}
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                    <Zap className="w-3 h-3 text-amber-500" /> Quick-Presets
                                                </p>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {presets.map(p => (
                                                        <Tooltip key={p.label} content={`${p.start} - ${p.end}`} size="sm">
                                                            <Button
                                                                size="sm"
                                                                variant="flat"
                                                                color={p.color}
                                                                className="px-3 min-w-0 font-semibold h-8 rounded-full border border-transparent hover:border-current transition-all"
                                                                onPress={() => applyPreset(p)}
                                                            >
                                                                {p.label}
                                                            </Button>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 border rounded-xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white shadow-sm rounded-lg text-indigo-600">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shift Window</p>
                                                        <p className="text-lg font-black text-indigo-900 leading-none">
                                                            {singleFormData.startTime} - {singleFormData.endTime}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Duration</p>
                                                    <p className="text-xs font-bold text-gray-600">8 Hours</p>
                                                </div>
                                            </div>

                                            <Input
                                                type="text"
                                                label="Shift Notes"
                                                name="notes"
                                                value={singleFormData.notes}
                                                onChange={(e) => setSingleFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                placeholder="E.g., Cover front desk"
                                                variant="bordered"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                            <Select
                                                label="Reason for Off Day"
                                                placeholder="Select reason"
                                                selectedKeys={[singleFormData.notes]}
                                                onChange={(e) => setSingleFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                variant="bordered"
                                            >
                                                {offDayReasons.map(reason => (
                                                    <SelectItem key={reason.value} value={reason.value}>
                                                        {reason.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                            <div className="flex items-start gap-2 p-3 bg-amber-100/50 rounded-lg border border-amber-200">
                                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                                <p className="text-xs text-amber-700">
                                                    Marking this day as "Off" will clear any existing shift timings for this employee on this date.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter className="border-t">
                            <Button color="danger" variant="flat" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button 
                                color="primary" 
                                type="submit" 
                                isLoading={isCreatingSingle}
                                isDisabled={!singleFormData.shiftDate || (singleFormData.shiftDate < new Date().toISOString().split('T')[0])}
                            >
                                Assign Shift
                            </Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    );
}
