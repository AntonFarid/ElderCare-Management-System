import React, { useState, useEffect } from 'react';
import { Card, CardBody, Spinner, Button } from '@heroui/react';
import { addToast } from '@heroui/toast';
import { Calendar, Briefcase, Clock, LogIn, LogOut, Coffee } from 'lucide-react';
import { employeeAttendanceServices } from '../../services/Employee/EmployeeAttendence';

export default function TodayShiftCard({ schedule, isLoading }) {
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [isClocking, setIsClocking] = useState(false);

    const isOffDay = (schedule?.shiftType === "Off Day" || schedule?.shiftType === "OffDay");

    const fetchAttendanceStatus = async () => {
        try {
            setIsCheckingStatus(true);
            const response = await employeeAttendanceServices.getAttendanceStatus();

            if (response.data && response.data.succeeded) {
                setAttendanceStatus(response.data.data);
            } else {
                setAttendanceStatus(null);
            }
        } catch (error) {
        } finally {
            setIsCheckingStatus(false);
        }
    };

    useEffect(() => {
        if (schedule) {
            fetchAttendanceStatus();
        } else {
            setIsCheckingStatus(false);
        }
    }, [schedule]);

    const handleClockIn = async () => {
        try {
            setIsClocking(true);
            const response = await employeeAttendanceServices.clockIn();

            if (response.data?.succeeded && response.data?.data) {
                setAttendanceStatus(response.data.data);
            } else {
                // Fallback in case the clock-in object isn't immediately returned
                await fetchAttendanceStatus();
            }

            addToast({
                title: "Shift Started",
                description: "You have successfully clocked in.",
                color: "success"
            });
        } catch (error) {
            console.error("Clock In failed:", error);
            const errorMessage = error.response?.data?.message || "Failed to clock in. You may not have a shift assigned today.";
            addToast({
                title: "Action Failed",
                description: errorMessage,
                color: "danger"
            });
        } finally {
            setIsClocking(false);
        }
    };

    const handleClockOut = async () => {
        try {
            setIsClocking(true);
            const response = await employeeAttendanceServices.clockOut();

            if (response.data?.succeeded && response.data?.data) {
                setAttendanceStatus(response.data.data);
            } else {
                await fetchAttendanceStatus();
            }

            addToast({
                title: "Shift Ended",
                description: "You have successfully clocked out.",
                color: "success"
            });
        } catch (error) {
            console.error("Clock Out failed:", error);
            const errorMessage = error.response?.data?.message || "Failed to clock out.";
            addToast({
                title: "Action Failed",
                description: errorMessage,
                color: "danger"
            });
        } finally {
            setIsClocking(false);
        }
    };

    const renderAttendanceAction = () => {
        if (isCheckingStatus) {
            return (
                <div className="mt-6 pt-6 border-t border-blue-50 dark:border-default-200 flex justify-center">
                    <Spinner size="sm" color="primary" />
                </div>
            );
        }

        const isLoggedIn = attendanceStatus && attendanceStatus.loginTime;
        const isLoggedOut = attendanceStatus && attendanceStatus.logoutTime;

        if (isLoggedOut) {
            return (
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-blue-50 dark:border-default-200">
                    <div className="p-3 bg-gray-50 dark:bg-default-100 rounded-xl text-gray-500">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">Shift Completed</p>
                        <p className="text-sm text-gray-500">
                            Clocked out at {new Date(attendanceStatus.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            );
        }

        if (isLoggedIn) {
            return (
                <div className="mt-8 pt-6 border-t border-white/20">
                    <div className="flex flex-col sm:flex-row bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 justify-between sm:items-center gap-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center p-3 sm:p-4 bg-white/20 rounded-xl shadow-inner border border-white/10">
                                <span className="absolute flex h-3 w-3 top-0 right-0 -mt-1 -mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-0.5">Started the shift</h3>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-green-400/30 text-green-100 border border-green-400/50 rounded-md text-xs font-bold uppercase tracking-wider">Active</span>
                                    <span className="text-sm font-medium text-blue-100">
                                        Since {new Date(attendanceStatus.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            color="danger"
                            variant="flat"
                            size="lg"
                            className="w-full sm:w-auto font-semibold px-8 whitespace-nowrap bg-white/20 text-white hover:bg-red-500 hover:text-white border border-white/30 backdrop-blur-md"
                            isLoading={isClocking}
                            onPress={handleClockOut}
                            startContent={!isClocking && <LogOut className="w-5 h-5" />}
                        >
                            End Shift
                        </Button>
                    </div>
                </div>
            );
        }

        if (isOffDay) {
            return (
                <div className="mt-8 pt-6 border-t border-white/20">
                    <div className="flex flex-col sm:flex-row bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 justify-center items-center gap-4 shadow-sm">
                        <div className="p-4 bg-white/20 rounded-full">
                            <Coffee className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-1">It's your day off!</h3>
                            <p className="text-blue-100 italic">"Rest is the base of progress." — Have a great day!</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex flex-col sm:flex-row bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 justify-between sm:items-center gap-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center justify-center p-3 sm:p-4 bg-white/20 rounded-xl shadow-inner border border-white/10">
                            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-0.5">Ready for your shift?</h3>
                            <p className="text-sm text-blue-100 font-medium">Start working on your shift to track your time and activities.</p>
                        </div>
                    </div>
                    <Button
                        color="primary"
                        variant="solid"
                        size="lg"
                        className="w-full sm:w-auto font-bold px-10 whitespace-nowrap bg-white text-blue-600 hover:bg-blue-50 shadow-md"
                        isLoading={isClocking}
                        onPress={handleClockIn}
                        startContent={!isClocking && <LogIn className="w-5 h-5" />}
                    >
                        Start Your Shift Now
                    </Button>
                </div>
            </div>
        );
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

    const formatTimeSpan = (timeSpanObj) => {
        if (!timeSpanObj) return "N/A";

        let hours = 0;
        let minutes = 0;

        if (typeof timeSpanObj === 'string') {
            const parts = timeSpanObj.split(':');
            if (parts.length >= 2) {
                hours = parseInt(parts[0], 10) || 0;
                minutes = parseInt(parts[1], 10) || 0;
            }
        } else {
            hours = timeSpanObj.hours || 0;
            minutes = timeSpanObj.minutes || 0;
        }

        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');

        return `${displayHour}:${displayMinutes} ${ampm}`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-6">
                <Spinner size="lg" label="Loading today's shift..." />
            </div>
        );
    }

    if (!schedule) {
        return (
            <Card className="shadow-sm border border-default-200 bg-default-50/50">
                <CardBody className="py-8 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                    <Briefcase className="w-10 h-10 opacity-20" />
                    <p>No shift scheduled for today.</p>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-none text-white overflow-hidden relative">
            {/* Decorative abstract circle */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/20 blur-3xl"></div>
            <CardBody className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
                            <Clock className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-1 text-white">Today's Shift</h2>
                            <p className="text-blue-100 flex items-center gap-2 font-medium">
                                <Calendar className="w-5 h-5 opacity-80" />
                                {formatDate(schedule.shiftDate)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[280px] shadow-sm">
                        {!isOffDay ? (
                            <>
                                <div className="flex items-center gap-2 mb-3 opacity-90">
                                    <Clock className="w-4 h-4 text-white" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">Working Hours</span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <p className="text-3xl font-extrabold tracking-tight text-white">
                                        {formatTimeSpan(schedule.startTime)}
                                    </p>
                                    <span className="text-blue-200 mx-3">—</span>
                                    <p className="text-3xl font-extrabold tracking-tight text-white">
                                        {formatTimeSpan(schedule.endTime)}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-1">
                                <div className="flex items-center gap-2 mb-1 px-3 py-1 bg-white/20 rounded-full border border-white/10">
                                    <Coffee className="w-3 h-3 text-white" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">Status: Day Off</span>
                                </div>
                                <p className="text-2xl font-black text-white italic opacity-80">Personal Time</p>
                            </div>
                        )}
                    </div>
                </div>

                {renderAttendanceAction()}
            </CardBody>
        </Card>
    );
}
