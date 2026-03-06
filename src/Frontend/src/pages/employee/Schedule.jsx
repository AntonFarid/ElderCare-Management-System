import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Spinner,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Input,
    Chip,
} from "@heroui/react";
import {
    Calendar,
    Briefcase,
    Search
} from "lucide-react";
import { employeeApiServices } from "../../services/Employee/EmployeeApi";
import TodayShiftCard from "../../components/employee/TodayShiftCard";

export default function Schedule() {
    const [todaySchedule, setTodaySchedule] = useState(null);
    const [isLoadingToday, setIsLoadingToday] = useState(true);

    const [fullSchedule, setFullSchedule] = useState([]);
    const [isLoadingFull, setIsLoadingFull] = useState(false);

    // Default filters
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    });

    const fetchTodaySchedule = async () => {
        setIsLoadingToday(true);
        try {
            const response = await employeeApiServices.getTodaySchedule();
            const scheduleData = response.data?.data;
            if (Array.isArray(scheduleData) && scheduleData.length > 0) {
                setTodaySchedule(scheduleData[0]);
            } else if (scheduleData && !Array.isArray(scheduleData)) {
                setTodaySchedule(scheduleData);
            }
        } catch (error) {
            console.error("Error fetching today's schedule:", error);
        } finally {
            setIsLoadingToday(false);
        }
    };

    const fetchFullSchedule = async () => {
        setIsLoadingFull(true);
        try {
            const response = await employeeApiServices.getSchedule({
                startDate,
                endDate
            });
            const data = response.data?.data || [];
            if (Array.isArray(data)) {
                setFullSchedule(data);
            } else {
                setFullSchedule([]);
            }
        } catch (error) {
            console.error("Error fetching full schedule:", error);
            setFullSchedule([]);
        } finally {
            setIsLoadingFull(false);
        }
    };

    useEffect(() => {
        fetchTodaySchedule();
        fetchFullSchedule();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleApplyFilter = () => {
        fetchFullSchedule();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            weekday: 'long'
        });
    };

    const getShiftStatus = (shiftDateStr) => {
        if (!shiftDateStr) return { label: "Unknown", color: "default" };
        const shiftDate = new Date(shiftDateStr);
        shiftDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (shiftDate < today) return { label: "Completed", color: "success" };
        if (shiftDate > today) return { label: "Upcoming", color: "primary" };
        return { label: "Today", color: "warning" };
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-blue-500" />
                    Employee Schedule
                </h1>
                <p className="text-gray-500 mt-2 text-sm">
                    View your upcoming shifts and current work hours.
                </p>
            </div>

            {/* Today's Schedule Card Highlight */}
            <TodayShiftCard schedule={todaySchedule} isLoading={isLoadingToday} />

            {/* Filter controls */}
            <Card className="shadow-md">
                <CardBody className="p-5">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <Input
                            type="date"
                            label="Start Date"
                            labelPlacement="outside"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1"
                        />
                        <Input
                            type="date"
                            label="End Date"
                            labelPlacement="outside"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            color="primary"
                            onPress={handleApplyFilter}
                            startContent={<Search className="w-4 h-4" />}
                            className="px-8"
                        >
                            Filter Schedule
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Full Schedule Table */}
            <Card className="shadow-md">
                <CardBody className="p-0">
                    {isLoadingFull ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner size="lg" color="primary" />
                        </div>
                    ) : (
                        <Table aria-label="Full schedule table" removeWrapper>
                            <TableHeader>
                                <TableColumn>DATE</TableColumn>
                                <TableColumn>SHIFT TYPE</TableColumn>
                                <TableColumn>START TIME</TableColumn>
                                <TableColumn>END TIME</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {fullSchedule.length > 0 ? (
                                    fullSchedule.map((shift, index) => {
                                        const status = getShiftStatus(shift.shiftDate);
                                        return (
                                            <TableRow key={shift.id || index} className="hover:bg-default-50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">
                                                            {formatDate(shift.shiftDate)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium text-gray-600 dark:text-gray-300">
                                                        {shift.shiftType ? `${shift.shiftType} Shift` : "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-blue-600">
                                                        {formatTableTimeSpan(shift.startTime)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-blue-600">
                                                        {formatTableTimeSpan(shift.endTime)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip size="sm" color={status.color} variant="flat">
                                                        {status.label}
                                                    </Chip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                                            No shifts found for the selected date range.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

// Helper to format table time span since we extracted the general formatTimeSpan logic
function formatTableTimeSpan(timeStr) {
    if (!timeStr) return "N/A";
    let hours = 0;
    let minutes = 0;
    if (typeof timeStr === 'string') {
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
            hours = parseInt(parts[0], 10) || 0;
            minutes = parseInt(parts[1], 10) || 0;
        }
    }
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${ampm}`;
}
