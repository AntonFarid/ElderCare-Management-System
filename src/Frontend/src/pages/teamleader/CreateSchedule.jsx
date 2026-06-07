import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    Button,
    Select,
    SelectItem,
    Input,
    Checkbox,
    Divider,
    Spinner
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { ArrowLeft, Calendar as CalendarIcon, Clock, FileText, CheckCircle2 } from "lucide-react";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";

export default function CreateSchedule() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [weekStart, setWeekStart] = useState(() => {
        // Start date initially set to next upcoming Monday
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    });

    const [weeklySchedule, setWeeklySchedule] = useState([]);

    const shiftTypes = [
        { label: "Morning", value: "Morning" },
        { label: "Afternoon", value: "Afternoon" },
        { label: "Night", value: "Night" },
        { label: "Overnight", value: "Overnight" }
    ];

    // Generate 7 days of schedule state when weekStart changes
    useEffect(() => {
        if (!weekStart) return;
        const days = [];
        const baseDate = new Date(weekStart);

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(baseDate);
            currentDate.setDate(baseDate.getDate() + i);
            days.push({
                date: currentDate.toISOString().split('T')[0],
                dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                isWorking: i < 5, // Default Monday-Friday as working
                startTime: "09:00",
                endTime: "17:00",
                shiftType: "Morning",
                notes: ""
            });
        }
        setWeeklySchedule(days);
    }, [weekStart]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await teamLeaderApiServices.getEmployees({ PageSize: 100 });
            if (res.data.succeeded) {
                setEmployees(res.data.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            addToast({ title: "Error", description: "Failed to load employees.", color: "danger" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDayToggle = (index, value) => {
        const newSched = [...weeklySchedule];
        newSched[index].isWorking = value;
        setWeeklySchedule(newSched);
    };

    const handleDayChange = (index, field, value) => {
        const newSched = [...weeklySchedule];
        newSched[index][field] = value;
        setWeeklySchedule(newSched);
    };

    const onSubmit = async () => {
        if (!selectedEmployee) {
            addToast({ title: "Validation Error", description: "Please select an employee.", color: "warning" });
            return;
        }

        // Validate that if a day is working, it must have a start and end time
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

        // Process sequentially to handle individual errors gracefully and not spam the API
        for (const day of weeklySchedule) {
            try {
                // Ensure proper formatting for backend TimeSpan (HH:mm:ss)
                const formatTime = (timeStr) => timeStr.length === 5 ? `${timeStr}:00` : timeStr;

                const payload = {
                    employeeId: parseInt(selectedEmployee),
                    shiftDate: new Date(day.date).toISOString(),
                    startTime: day.isWorking ? formatTime(day.startTime) : "00:00:00",
                    endTime: day.isWorking ? formatTime(day.endTime) : "00:00:00",
                    shiftType: day.isWorking ? day.shiftType : "Off Day",
                    notes: day.isWorking ? day.notes : "Rotational Off Day"
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
                // Extract API returned error if any
                const apiError = innerError.response?.data;
                if (apiError?.errors) {
                    if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
                        lastErrorMsg = apiError.errors[0]; // if it's a flat array
                    } else if (typeof apiError.errors === 'object' && Object.values(apiError.errors).length > 0) {
                        const firstError = Object.values(apiError.errors)[0];
                        lastErrorMsg = Array.isArray(firstError) ? firstError[0] : firstError; // if it's a dictionary
                    } else {
                        lastErrorMsg = apiError.message || "Schedule overlaps or validation failed.";
                    }
                } else if (apiError?.message && apiError.message !== "Validation failed.") {
                    lastErrorMsg = apiError.message;
                } else if (apiError?.title) {
                    lastErrorMsg = apiError.title; // e.g. "One or more validation errors occurred."
                } else {
                    lastErrorMsg = apiError?.message || "Schedule overlaps or validation failed.";
                }
            }
        }

        setIsSubmitting(false);

        if (errorCount === 0) {
            addToast({
                title: "Success",
                description: `Successfully scheduled ${successCount} days for the week.`,
                color: "success"
            });
            navigate("/teamleader/schedules");
        } else if (successCount > 0) {
            addToast({
                title: "Partial Success",
                description: `Scheduled ${successCount} days, but ${errorCount} failed. Last error: ${lastErrorMsg}`,
                color: "warning"
            });
        } else {
            addToast({
                title: "Scheduling Failed",
                description: `Failed to schedule the week. Error: ${lastErrorMsg}`,
                color: "danger"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Loading employee data..." />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-4">
                <Button
                    isIconOnly
                    variant="light"
                    onPress={() => navigate('/teamleader/schedules')}
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <CalendarIcon className="w-7 h-7 text-indigo-500" />
                        Weekly Schedule Planner
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Assign shifts for an entire week at once.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Panel: Employee & Week Selection */}
                <div className="md:col-span-1 space-y-4">
                    <Card className="shadow-md">
                        <CardBody className="space-y-6 p-5">
                            <div>
                                <h3 className="text-md font-semibold mb-3">1. Select Caregiver</h3>
                                <Select
                                    label="Caregiver"
                                    placeholder="Choose an employee"
                                    selectedKeys={selectedEmployee ? [selectedEmployee] : []}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    isRequired
                                >
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.firstName} {emp.lastName}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <Divider />

                            <div>
                                <h3 className="text-md font-semibold mb-3">2. Week Start</h3>
                                <Input
                                    type="date"
                                    label="Start Date"
                                    value={weekStart}
                                    onChange={(e) => setWeekStart(e.target.value)}
                                    isRequired
                                    description="Schedule will generate 7 days from this date."
                                />
                            </div>

                            <Button
                                color="primary"
                                className="w-full mt-4"
                                size="lg"
                                onPress={onSubmit}
                                isLoading={isSubmitting}
                                startContent={!isSubmitting && <CheckCircle2 className="w-5 h-5" />}
                            >
                                Publish Week
                            </Button>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Panel: Daily Shift Configuration */}
                <div className="md:col-span-3">
                    <Card className="shadow-md border-none">
                        <CardBody className="p-0">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                                    3. Configure Daily Shifts
                                </h3>
                            </div>

                            <div className="divide-y">
                                {weeklySchedule.map((day, index) => (
                                    <div key={day.date} className={`p-4 transition-colors ${!day.isWorking ? 'bg-gray-50 text-gray-400' : ''}`}>
                                        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">

                                            {/* Date Toggle */}
                                            <div className="w-48 flex items-center gap-3">
                                                <Checkbox
                                                    isSelected={day.isWorking}
                                                    onValueChange={(val) => handleDayToggle(index, val)}
                                                    size="lg"
                                                />
                                                <div>
                                                    <p className={`font-bold ${day.isWorking ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                                                        {day.dayName}
                                                    </p>
                                                    <p className="text-xs">{new Date(day.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            {/* Times & Inputs */}
                                            {day.isWorking ? (
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                                                    <Input
                                                        type="time"
                                                        label="Start Time"
                                                        size="sm"
                                                        value={day.startTime}
                                                        onChange={(e) => handleDayChange(index, "startTime", e.target.value)}
                                                        startContent={<Clock className="w-3 h-3 text-gray-400" />}
                                                    />
                                                    <Input
                                                        type="time"
                                                        label="End Time"
                                                        size="sm"
                                                        value={day.endTime}
                                                        onChange={(e) => handleDayChange(index, "endTime", e.target.value)}
                                                        startContent={<Clock className="w-3 h-3 text-gray-400" />}
                                                    />
                                                    <Select
                                                        label="Shift Type"
                                                        size="sm"
                                                        selectedKeys={[day.shiftType]}
                                                        onChange={(e) => handleDayChange(index, "shiftType", e.target.value)}
                                                    >
                                                        {shiftTypes.map(type => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <Input
                                                        type="text"
                                                        label="Notes"
                                                        size="sm"
                                                        value={day.notes}
                                                        onChange={(e) => handleDayChange(index, "notes", e.target.value)}
                                                        startContent={<FileText className="w-3 h-3 text-gray-400" />}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-between text-sm italic py-2 pl-4 border-l-2 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 rounded-r-lg">
                                                    <span className="text-indigo-600 dark:text-indigo-300">Off Day.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
