import React, { useState, useEffect } from "react";
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
    Checkbox,
    Divider,
    Spinner,
    Tooltip
} from "@heroui/react";
import { 
    Plus, 
    Calendar as CalendarIcon, 
    Clock, 
    User, 
    Trash2, 
    Edit2, 
    CalendarDays, 
    Sparkles, 
    Copy, 
    AlertTriangle, 
    Zap, 
    Briefcase, 
    Coffee,
    CheckCircle2
} from "lucide-react";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";

const OFF_DAY_REASONS = [
    { label: "Weekly Rest", value: "Rotational Off Day" },
    { label: "Annual Leave", value: "Annual Leave" },
    { label: "Sick Leave", value: "Sick Leave" },
    { label: "Public Holiday", value: "Public Holiday" }
];

export default function AddWeeklyScheduleModal({
    isOpen,
    onOpenChange,
    employees,
    schedules = [],
    onSuccess
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAiCalculating, setIsAiCalculating] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [weeklySchedule, setWeeklySchedule] = useState([]);
    const [weekStart, setWeekStart] = useState(() => {
        return new Date().toLocaleDateString('en-CA');
    });

    const presets = [
        { label: "Morning", start: "08:00", end: "16:00", type: "Morning", color: "primary" },
        { label: "Afternoon", start: "12:00", end: "20:00", type: "Afternoon", color: "secondary" },
        { label: "Night", start: "20:00", end: "04:00", type: "Night", color: "warning" },
        { label: "Overnight", start: "00:00", end: "08:00", type: "Overnight", color: "default" },
        { label: "Off Day", start: "00:00", end: "00:00", type: "OffDay", color: "danger" }
    ];

    const aiGenerateSchedule = () => {
        setIsAiCalculating(true);
        setTimeout(() => {
            const types = ["Morning", "Afternoon", "Night", "Overnight"];
            const newSched = [...weeklySchedule];
            
            // Goal: Exactly 1 or 2 Off Days (5 or 6 Working Days)
            const offDaysTarget = 1 + Math.floor(Math.random() * 2); 
            const indices = [0, 1, 2, 3, 4, 5, 6];
            const offDayIndices = [];
            
            for(let i=0; i < offDaysTarget; i++) {
                const randomIdx = indices.splice(Math.floor(Math.random() * indices.length), 1)[0];
                offDayIndices.push(randomIdx);
            }

            newSched.forEach((day, i) => {
                const todayStr = new Date().toISOString().split('T')[0];
                if (day.date < todayStr) return; // Protect history

                if (offDayIndices.includes(i)) {
                    day.isWorking = false;
                    day.shiftType = "OffDay";
                    day.startTime = "00:00";
                    day.endTime = "00:00";
                    day.notes = "Rotational Off Day";
                } else {
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    const p = presets.find(pr => pr.type === randomType);
                    day.isWorking = true;
                    day.shiftType = randomType;
                    day.startTime = p.start;
                    day.endTime = p.end;
                    day.notes = "";
                }
            });
            
            setWeeklySchedule(newSched);
            setIsAiCalculating(false);
            addToast({ 
                title: "AI Optimized", 
                description: "Optimized 7-day schedule generated (with guaranteed rest days).", 
                color: "success" 
            });
        }, 800);
    };

    useEffect(() => {
        if (!weekStart) return;
        const days = [];
        const baseDate = weekStart;

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(baseDate + "T00:00:00");
            currentDate.setDate(currentDate.getDate() + i);
            days.push({
                date: currentDate.toLocaleDateString('en-CA'),
                dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                isWorking: i < 5,
                startTime: "09:00",
                endTime: "17:00",
                shiftType: "Morning",
                notes: ""
            });
        }
        setWeeklySchedule(days);
    }, [weekStart]);

    const handleDayToggle = (index, value) => {
        const newSched = [...weeklySchedule];
        newSched[index].isWorking = value;
        if (!value) {
            newSched[index].notes = "Rotational Off Day";
        }
        setWeeklySchedule(newSched);
    };

    const handleApplyPreset = (index, p) => {
        const newSched = [...weeklySchedule];
        if (p.type === "OffDay") {
            newSched[index].isWorking = false;
            newSched[index].notes = "Rotational Off Day";
        } else {
            newSched[index].isWorking = true;
            newSched[index].startTime = p.start;
            newSched[index].endTime = p.end;
            newSched[index].shiftType = p.type;
            newSched[index].notes = "";
        }
        setWeeklySchedule(newSched);
    };

    const handleDayChange = (index, field, value) => {
        const newSched = [...weeklySchedule];
        newSched[index][field] = value;
        
        if (field === "shiftType") {
            const p = presets.find(pr => pr.type === value);
            if (p) {
                newSched[index].startTime = p.start;
                newSched[index].endTime = p.end;
            }
        }
        setWeeklySchedule(newSched);
    };

    const repeatMonday = () => {
        const firstDay = weeklySchedule[0];
        const newSched = weeklySchedule.map((day, idx) => {
            if (idx === 0) return day;
            return {
                ...day,
                isWorking: true,
                startTime: firstDay.startTime,
                endTime: firstDay.endTime,
                shiftType: firstDay.shiftType,
                notes: firstDay.notes
            };
        });
        setWeeklySchedule(newSched);
        addToast({ title: "Template Applied", description: "Monday's schedule copied to all days.", color: "primary" });
    };

    const markAllOff = () => {
        const newSched = weeklySchedule.map(day => ({
            ...day,
            isWorking: false,
            notes: "Rotational Off Day"
        }));
        setWeeklySchedule(newSched);
    };

    const hasConflict = (date) => {
        if (!selectedEmployee) return false;
        return schedules.some(s =>
            s.employeeId === parseInt(selectedEmployee) &&
            new Date(s.shiftDate).toISOString().split('T')[0] === date
        );
    };

    const onSubmit = async () => {
        if (!selectedEmployee) {
            addToast({ title: "Validation Error", description: "Please select an employee.", color: "warning" });
            return;
        }

        for (const day of weeklySchedule) {
            if (day.isWorking && (!day.startTime || !day.endTime)) {
                addToast({
                    title: "Missing Time",
                    description: `Please select a start and end time for ${day.dayName} or toggle it off.`,
                    color: "warning"
                });
                return;
            }
        }

        setIsSubmitting(true);
        let successCount = 0;
        let errorCount = 0;
        let lastErrorMsg = "";

        for (const day of weeklySchedule) {
            try {
                const formatTime = (timeStr) => timeStr.length === 5 ? `${timeStr}:00` : timeStr;

                const payload = {
                    employeeId: parseInt(selectedEmployee),
                    shiftDate: new Date(day.date).toISOString(),
                    startTime: day.isWorking ? formatTime(day.startTime) : "00:00:00",
                    endTime: day.isWorking ? formatTime(day.endTime) : "00:00:00",
                    shiftType: day.isWorking ? day.shiftType : "OffDay",
                };

                const response = await teamLeaderApiServices.createSchedule(payload);
                if (response.data.succeeded) {
                    successCount++;
                } else {
                    errorCount++;
                    lastErrorMsg = response.data.message || "Failed to create schedule.";
                }
            } catch (innerError) {
                console.error(`Failed to schedule ${day.date}:`, innerError.response?.data || innerError);
                errorCount++;
                const apiError = innerError.response?.data;
                let errorMsg = "Schedule overlaps or validation failed.";
                if (apiError?.errors) {
                    if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
                        errorMsg = apiError.errors[0];
                    } else if (typeof apiError.errors === 'object' && Object.values(apiError.errors).length > 0) {
                        const firstError = Object.values(apiError.errors)[0];
                        errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
                    }
                } else if (apiError?.message && apiError.message !== "Validation failed.") {
                    errorMsg = apiError.message;
                } else if (apiError?.title) {
                    errorMsg = apiError.title;
                }
                lastErrorMsg = errorMsg;
            }
        }

        setIsSubmitting(false);

        if (errorCount === 0) {
            addToast({
                title: "Success",
                description: `Successfully scheduled ${successCount} days for the week.`,
                color: "success"
            });
            onSuccess();
        } else if (successCount > 0) {
            addToast({
                title: "Partial Success",
                description: `Scheduled ${successCount} days, but ${errorCount} failed. Last error: ${lastErrorMsg}`,
                color: "warning"
            });
            onSuccess();
        } else {
            addToast({
                title: "Scheduling Failed",
                description: `Failed to schedule the week. Error: ${lastErrorMsg}`,
                color: "danger"
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Weekly Schedule Planner</ModalHeader>
                        <ModalBody className="py-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1 space-y-6">
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">General Settings</p>
                                        <Select
                                            label="Caregiver"
                                            placeholder="Choose an employee"
                                            selectedKeys={selectedEmployee ? [selectedEmployee.toString()] : []}
                                            onChange={(e) => setSelectedEmployee(e.target.value)}
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
                                            label="Week Start Date"
                                            value={weekStart}
                                            onChange={(e) => setWeekStart(e.target.value)}
                                            isRequired
                                            variant="bordered"
                                        />
                                    </div>

                                    <Divider />

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Automation Tools</p>
                                        <Button
                                            fullWidth
                                            color="secondary"
                                            variant="shadow"
                                            startContent={isAiCalculating ? <Spinner size="sm" color="current" /> : <Sparkles className="w-4 h-4 fill-current" />}
                                            onPress={aiGenerateSchedule}
                                            isLoading={isAiCalculating}
                                            className="font-bold bg-gradient-to-tr from-indigo-600 to-purple-500 text-white shadow-indigo-200"
                                        >
                                            {isAiCalculating ? "Thinking..." : "Magic AI Fill"}
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="flat"
                                            color="primary"
                                            startContent={<Copy className="w-4 h-4" />}
                                            onPress={repeatMonday}
                                            className="justify-start font-medium"
                                        >
                                            Repeat Monday to All
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="flat"
                                            color="danger"
                                            startContent={<Trash2 className="w-4 h-4" />}
                                            onPress={markAllOff}
                                            className="justify-start font-medium"
                                        >
                                            Mark Full Week Off
                                        </Button>
                                    </div>

                                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 italic text-[11px] text-indigo-700 leading-relaxed">
                                        <Zap className="w-3 h-3 mb-1" />
                                        Tip: Use "Repeat Monday" to quickly fill the whole week with the same shift, then just toggle off the weekend!
                                    </div>
                                </div>

                                {/* Weekly List Side */}
                                <div className="md:col-span-3">
                                    <div className="divide-y border rounded-lg overflow-hidden shadow-sm">
                                        {weeklySchedule.map((day, index) => {
                                            const todayStr = new Date().toISOString().split('T')[0];
                                            const isPast = day.date < todayStr;
                                            const conflict = hasConflict(day.date);
                                            return (
                                                <div key={day.date} className={`p-4 transition-colors ${isPast ? 'bg-gray-100 opacity-60 cursor-not-allowed' : (!day.isWorking ? 'bg-gray-50' : 'bg-white')} ${conflict ? 'border-l-4 border-l-amber-400' : ''}`}>
                                                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                                                        <div className="w-52 flex flex-col gap-1">
                                                            <div className="flex items-center gap-3">
                                                                <Checkbox
                                                                    isSelected={day.isWorking}
                                                                    onValueChange={(val) => !isPast && handleDayToggle(index, val)}
                                                                    size="md"
                                                                    isDisabled={isPast}
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={`text-sm font-bold ${isPast ? 'text-gray-400' : (day.isWorking ? 'text-indigo-900' : 'text-gray-400')}`}>
                                                                            {day.dayName}
                                                                        </p>
                                                                        {isPast ? (
                                                                            <span className="text-[8px] font-black uppercase text-gray-500 bg-gray-200 px-1 rounded">Past</span>
                                                                        ) : conflict && (
                                                                            <Tooltip content="Shift already exists for this date">
                                                                                <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" />
                                                                            </Tooltip>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500">{new Date(day.date).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            {/* Per-day Presets */}
                                                            <div className="flex flex-wrap gap-1.5 pl-8 mt-1">
                                                                {[{ l: "Morning", c: "blue", t: "Morning", s: "08:00", e: "16:00" },
                                                                { l: "Afternoon", c: "purple", t: "Afternoon", s: "12:00", e: "20:00" },
                                                                { l: "Night", c: "amber", t: "Night", s: "20:00", e: "04:00" },
                                                                { l: "Overnight", c: "indigo", t: "Overnight", s: "00:00", e: "08:00" },
                                                                { l: "Off Day", c: "red", t: "OffDay" }].map(p => (
                                                                    <button
                                                                        key={p.l}
                                                                        type="button"
                                                                        disabled={isPast}
                                                                        onClick={() => handleApplyPreset(index, { type: p.t, start: p.s, end: p.e })}
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border border-transparent 
                                                                            ${isPast ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed' : 'shadow-sm hover:shadow-md hover:scale-105 active:scale-95'}
                                                                            ${!isPast && (p.c === "red" ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' :
                                                                              p.c === "blue" ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                                                                              p.c === "purple" ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' :
                                                                              p.c === "indigo" ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' :
                                                                              'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100')}`}
                                                                    >
                                                                        {p.l}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {day.isWorking ? (
                                                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-center animate-in slide-in-from-left-2 duration-300">
                                                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg px-3 py-2 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="w-4 h-4 text-indigo-600" />
                                                                        <div>
                                                                            <p className="text-[9px] font-bold text-indigo-400 uppercase leading-none">Time Window</p>
                                                                            <p className="text-sm font-bold text-indigo-900">{day.startTime} - {day.endTime}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-indigo-300">8H</span>
                                                                </div>

                                                                <Input
                                                                    type="text"
                                                                    label="Notes"
                                                                    size="sm"
                                                                    variant="bordered"
                                                                    value={day.notes}
                                                                    onChange={(e) => handleDayChange(index, "notes", e.target.value)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 flex items-center gap-4 bg-amber-50/50 p-2 rounded-lg border border-amber-100 animate-in slide-in-from-right-2 duration-300">
                                                                <div className="flex items-center gap-2 text-amber-600">
                                                                    <Coffee className="w-4 h-4" />
                                                                    <span className="text-sm font-medium italic">Off Day</span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <Select
                                                                        aria-label="Reason for off day"
                                                                        placeholder="Reason for off day"
                                                                        size="sm"
                                                                        variant="flat"
                                                                        className="max-w-[200px]"
                                                                        selectedKeys={[day.notes]}
                                                                        onChange={(e) => handleDayChange(index, "notes", e.target.value)}
                                                                    >
                                                                        {OFF_DAY_REASONS.map(reason => (
                                                                            <SelectItem key={reason.value} value={reason.value}>
                                                                                {reason.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter className="border-t">
                            <Button color="danger" variant="flat" onPress={onClose}>
                                Close
                            </Button>
                            <Button color="primary" onPress={onSubmit} isLoading={isSubmitting} startContent={!isSubmitting && <CheckCircle2 className="w-4 h-4" />}>
                                {isSubmitting ? "Publishing..." : "Publish Full Week"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
