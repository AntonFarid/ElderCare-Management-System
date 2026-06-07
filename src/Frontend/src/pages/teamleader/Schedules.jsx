import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Chip,
    useDisclosure,
    Pagination
} from "@heroui/react";
import {
    Plus,
    Calendar as CalendarIcon,
    Clock,
    User,
    Trash2,
    Edit2,
    CalendarDays,
    Users,
    Search,
    Filter,
    ChevronRight,
    Info,
    Coffee,
    Download,
    Zap
} from "lucide-react";
import {
    Avatar,
    Input,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Badge
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import EditScheduleModal from "../../components/TeamLeader/EditScheduleModal";
import AddSingleShiftModal from "../../components/TeamLeader/AddSingleShiftModal";
import AddWeeklyScheduleModal from "../../components/TeamLeader/AddWeeklyScheduleModal";

export default function Schedules() {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const [isEditing, setIsEditing] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        shiftDate: "",
        startTime: "",
        endTime: "",
        shiftType: "",
        notes: ""
    });

    // Filter Stats
    const [filterText, setFilterText] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [filterDate, setFilterDate] = useState("");

    // Single Shift Modal State
    const { isOpen: isSingleOpen, onOpen: onSingleOpen, onClose: onSingleClose } = useDisclosure();
    const [isCreatingSingle, setIsCreatingSingle] = useState(false);
    const [singleFormData, setSingleFormData] = useState({
        employeeId: "",
        shiftDate: new Date().toLocaleDateString('en-CA'),
        startTime: "09:00",
        endTime: "17:00",
        shiftType: "Morning",
        notes: ""
    });

    // Weekly Schedule Modal State
    const { isOpen: isWeeklyOpen, onOpen: onWeeklyOpen, onClose: onWeeklyClose } = useDisclosure();

    const shiftTypes = [
        { label: "Morning", value: "Morning" },
        { label: "Afternoon", value: "Afternoon" },
        { label: "Night", value: "Night" },
        { label: "Overnight", value: "Overnight" },
        { label: "Off Day", value: "OffDay" }
    ];

    const isActionDisabled = (dateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const shiftDate = new Date(dateString);
        shiftDate.setHours(0, 0, 0, 0);
        // Deactivate if date is today or in the past
        return shiftDate <= today;
    };

    const fetchData = async () => {
        setIsLoading(true);
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        try {
            // Fetch Schedules and Attendance in parallel
            const [schedsRes, attendanceRes, empsRes] = await Promise.all([
                teamLeaderApiServices.getSchedules(today.toISOString(), nextMonth.toISOString(), null),
                teamLeaderApiServices.getAttendanceCurrentStatus(),
                teamLeaderApiServices.getEmployees({ pageSize: 100, isActive: true })
            ]);

            console.log("[DEBUG] RAW SCHEDULES:", schedsRes.data.data);
            console.log("[DEBUG] LIVE ATTENDANCE:", attendanceRes.data.data);

            let attendanceMap = {};
            if (attendanceRes.data.succeeded) {
                const logsData = attendanceRes.data.data || [];
                if (Array.isArray(logsData)) {
                    logsData.forEach(log => {
                        const empId = (log.EmployeeId || log.employeeId || log.employee?.id)?.toString();
                        if (empId) attendanceMap[empId] = log;
                    });
                } else {
                    // It's a dictionary/object
                    Object.keys(logsData).forEach(id => {
                        const logObj = logsData[id];
                        const empId = (id || logObj.EmployeeId || logObj.employeeId || logObj.employee?.id)?.toString();
                        if (empId) attendanceMap[empId] = logObj;
                    });
                }
            }

            console.log("[DEBUG] ATTENDANCE MAP:", attendanceMap);

            if (schedsRes.data.succeeded) {
                const rawSchedules = schedsRes.data.data || [];
                const mergedSchedules = rawSchedules.map(s => {
                    const shiftDateNorm = s.shiftDate ? s.shiftDate.substring(0, 10) : "";
                    const todayDate = new Date().toLocaleDateString('en-CA');
                    const isTodayShift = shiftDateNorm === todayDate;

                    const sEmpId = (s.EmployeeId || s.employeeId || s.employee?.id)?.toString();
                    const log = attendanceMap[sEmpId];

                    // Match today's shifts OR specific dates
                    const isMatch = log && (isTodayShift || (log.LogDate || log.logDate || (log.LoginTime || log.loginTime || log.clockInTime)?.substring(0, 10)) === shiftDateNorm);

                    if (isMatch) {
                        return {
                            ...s,
                            actualStartTime: log.clockInTime || log.LoginTime || log.loginTime || log.actualStartTime,
                            actualEndTime: log.clockOutTime || log.LogoutTime || log.logoutTime || log.actualEndTime
                        };
                    }
                    return s;
                });
                console.log("[DEBUG] MERGED SCHEDULES:", mergedSchedules);
                setSchedules(mergedSchedules);
            }

            if (empsRes.data.succeeded) {
                const empData = empsRes.data.data;
                const employeeList = Array.isArray(empData)
                    ? empData
                    : (empData && Array.isArray(empData.data) ? empData.data : []);
                setEmployees(employeeList || []);
            }

        } catch (error) {
            console.error("Data Fetch Error:", error);
            if (error.response?.status === 401) {
                addToast({ title: "Session Expired", description: "Please log in again.", color: "danger" });
            } else {
                addToast({ title: "Sync Interrupted", description: "Could not sync live data. Please refresh.", color: "danger" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (scheduleId) => {
        if (!window.confirm("Are you sure you want to delete this schedule?")) return;

        try {
            const response = await teamLeaderApiServices.deleteSchedule(scheduleId);
            if (response.data.succeeded) {
                addToast({ title: "Deleted", description: "Schedule deleted successfully.", color: "success" });
                fetchData();
            } else {
                addToast({ title: "Error", description: response.data.message || "Failed to delete schedule.", color: "danger" });
            }
        } catch (error) {
            console.error(error);
            addToast({ title: "Error", description: "Unexpected error during deletion.", color: "danger" });
        }
    };

    const handleEditClick = (schedule) => {
        setEditingScheduleId(schedule.id);
        const datePart = schedule.shiftDate.includes('T')
            ? schedule.shiftDate.split('T')[0]
            : new Date(schedule.shiftDate).toLocaleDateString('en-CA');

        setEditFormData({
            employeeId: schedule.employeeId,
            shiftDate: datePart,
            startTime: schedule.startTime.substring(0, 5),
            endTime: schedule.endTime.substring(0, 5),
            shiftType: schedule.shiftType,
            notes: schedule.notes || ""
        });
        onEditOpen();
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsEditing(true);

        try {
            const formatTime = (timeStr) => timeStr.length === 5 ? `${timeStr}:00` : timeStr;
            const isOff = (editFormData.shiftType === "Off Day" || editFormData.shiftType === "OffDay");
            const payload = {
                employeeId: editFormData.employeeId,
                shiftDate: new Date(editFormData.shiftDate).toISOString(),
                startTime: isOff ? "00:00:00" : formatTime(editFormData.startTime),
                endTime: isOff ? "00:00:00" : formatTime(editFormData.endTime),
                shiftType: editFormData.shiftType,
                notes: editFormData.notes || (isOff ? "Rotational Off Day" : "")
            };

            const response = await teamLeaderApiServices.updateSchedule(editingScheduleId, payload);

            if (response.data.succeeded) {
                addToast({ title: "Updated", description: "Schedule updated successfully.", color: "success" });
                onEditClose();
                fetchData();
            } else {
                addToast({ title: "Error", description: response.data.message || "Failed to update schedule.", color: "danger" });
            }
        } catch (error) {
            console.error("Update error:", error);
            const apiError = error.response?.data;
            let lastErrorMsg = "Failed to update schedule.";
            if (apiError?.errors) {
                if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
                    lastErrorMsg = apiError.errors[0];
                } else if (typeof apiError.errors === 'object' && Object.values(apiError.errors).length > 0) {
                    const firstError = Object.values(apiError.errors)[0];
                    lastErrorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
                }
            } else if (apiError?.message && apiError.message !== "Validation failed.") {
                lastErrorMsg = apiError.message;
            } else if (apiError?.title) {
                lastErrorMsg = apiError.title;
            }
            addToast({ title: "Error", description: lastErrorMsg, color: "danger" });
        } finally {
            setIsEditing(false);
        }
    };

    const handleSingleSubmit = async (e) => {
        e.preventDefault();

        if (!singleFormData.employeeId) {
            addToast({ title: "Validation Error", description: "Please select an employee.", color: "warning" });
            return;
        }

        setIsCreatingSingle(true);
        try {
            const formatTime = (timeStr) => timeStr.length === 5 ? `${timeStr}:00` : timeStr;
            const payload = {
                employeeId: parseInt(singleFormData.employeeId),
                shiftDate: new Date(singleFormData.shiftDate).toISOString(),
                startTime: singleFormData.shiftType === "OffDay" ? "00:00:00" : formatTime(singleFormData.startTime),
                endTime: singleFormData.shiftType === "OffDay" ? "00:00:00" : formatTime(singleFormData.endTime),
                shiftType: singleFormData.shiftType,
                notes: singleFormData.notes || (singleFormData.shiftType === "OffDay" ? "Rotational Off Day" : "")
            };

            const response = await teamLeaderApiServices.createSchedule(payload);

            if (response.data.succeeded) {
                addToast({ title: "Success", description: "Single shift successfully created.", color: "success" });
                onSingleClose();
                fetchData();
            } else {
                addToast({ title: "Error", description: response.data.message || "Failed to create shift.", color: "danger" });
            }
        } catch (error) {
            console.error("Create single shift error:", error);
            const apiError = error.response?.data;
            let lastErrorMsg = "Failed to create shift.";
            if (apiError?.errors) {
                if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
                    lastErrorMsg = apiError.errors[0];
                } else if (typeof apiError.errors === 'object' && Object.values(apiError.errors).length > 0) {
                    const firstError = Object.values(apiError.errors)[0];
                    lastErrorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
                }
            } else if (apiError?.message && apiError.message !== "Validation failed.") {
                lastErrorMsg = apiError.message;
            } else if (apiError?.title) {
                lastErrorMsg = apiError.title;
            }
            addToast({ title: "Error", description: lastErrorMsg, color: "danger" });
        } finally {
            setIsCreatingSingle(false);
        }
    };

    const filteredSchedules = (schedules || []).filter(s => {
        const matchesSearch = (s.employeeName || "").toLowerCase().includes(filterText.toLowerCase());
        const matchesStatus = statusFilter === "all" || s.shiftType === statusFilter;

        const shiftDateClean = s.shiftDate ? (s.shiftDate.includes('T') ? s.shiftDate.split('T')[0] : s.shiftDate) : "";
        const matchesDate = !filterDate || shiftDateClean === filterDate;

        return matchesSearch && matchesStatus && matchesDate;
    });

    const exportToExcel = () => {
        if (filteredSchedules.length === 0) {
            addToast({ title: "No Data", description: "There is nothing to export in current view.", color: "warning" });
            return;
        }

        const headers = ["Employee Name", "Shift Date", "Start Time", "End Time", "Shift Type", "Notes"];
        const csvRows = filteredSchedules.map(s => [
            s.employeeName,
            new Date(s.shiftDate).toLocaleDateString('en-CA'),
            s.startTime,
            s.endTime,
            s.shiftType,
            s.notes || ""
        ].map(val => `"${val}"`).join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `staff_schedule_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getShiftColor = (type) => {
        switch (type) {
            case 'Morning': return 'primary';
            case 'Afternoon': return 'secondary';
            case 'Night': return 'warning';
            case 'Overnight': return 'default';
            case 'OffDay': return 'danger';
            default: return 'default';
        }
    };

    const stats = {
        total: (schedules || []).length,
        today: (schedules || []).filter(s => {
            if (!s.shiftDate) return false;
            const dateStr = s.shiftDate.includes('T') ? s.shiftDate.split('T')[0] : s.shiftDate;
            const isToday = dateStr === new Date().toLocaleDateString('en-CA');
            return isToday && s.shiftType !== 'OffDay';
        }).length,
        offDays: (schedules || []).filter(s => s.shiftType === 'OffDay').length,
    };

    // Pagination Logic
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;
    const pages = Math.ceil(filteredSchedules.length / rowsPerPage);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredSchedules.slice(start, end);
    }, [page, filteredSchedules]);

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1);
    }, [filterText, statusFilter, filterDate]);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 italic">
                            <CalendarIcon className="w-8 h-8 text-white" />
                        </div>
                        Team Schedules
                    </h1>
                    <p className="text-gray-500 font-medium mt-2 max-w-md">
                        Orchestrate your caregiving team with modern, AI-assisted shift management.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        size="lg"
                        color="success"
                        variant="flat"
                        onPress={exportToExcel}
                        startContent={<Download className="w-5 h-5" />}
                        className="font-semibold h-14 rounded-2xl bg-white border-2 border-emerald-100 text-emerald-600"
                    >
                        Export CSV
                    </Button>
                    <Button
                        size="lg"
                        color="primary"
                        variant="shadow"
                        onPress={onWeeklyOpen}
                        startContent={<CalendarDays className="w-5 h-5" />}
                        className="font-semibold px-8 h-14 rounded-2xl"
                    >
                        Weekly Planner
                    </Button>
                    <Button
                        size="lg"
                        color="secondary"
                        variant="flat"
                        onPress={onSingleOpen}
                        startContent={<Plus className="w-5 h-5" />}
                        className="font-semibold h-14 rounded-2xl border-2 border-dashed border-indigo-200"
                    >
                        Single Shift
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
                    <CardBody className="p-6 relative z-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wider">Today's Active Staff</p>
                                <h3 className="text-4xl font-bold mt-2">{stats.today} <span className="text-lg font-normal opacity-80">Caregivers</span></h3>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Users className="w-8 h-8" />
                            </div>
                        </div>
                    </CardBody>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Users className="w-32 h-32" />
                    </div>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden relative border border-gray-100">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Scheduled This Week</p>
                                <h3 className="text-4xl font-bold mt-2 text-gray-900">{stats.total} <span className="text-lg font-normal text-gray-400">Total</span></h3>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                                <CalendarIcon className="w-8 h-8" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden relative border border-gray-100">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-amber-500 text-sm font-semibold uppercase tracking-wider">Off-Days Assigned</p>
                                <h3 className="text-4xl font-bold mt-2 text-gray-900">{stats.offDays} <span className="text-lg font-normal text-gray-400">Days</span></h3>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl text-amber-500">
                                <Clock className="w-8 h-8" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search by employee name..."
                        className="pl-10 h-12"
                        variant="flat"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        isClearable
                    />
                </div>
                <div className="w-full md:w-48">
                    <Input
                        type="date"
                        variant="flat"
                        className="h-12"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'Morning', 'Afternoon', 'Night', 'Overnight', 'OffDay'].map(type => (
                        <Button
                            key={type}
                            size="sm"
                            variant={statusFilter === type ? "solid" : "flat"}
                            color={statusFilter === type ? "primary" : "default"}
                            className="font-bold rounded-xl whitespace-nowrap"
                            onPress={() => setStatusFilter(type)}
                        >
                            {type === 'all' ? 'View All' : type}
                        </Button>
                    ))}
                </div>
            </div>

            <Card className="shadow-xl border-none p-2 rounded-[2rem]">
                <CardBody className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Spinner size="lg" color="primary" />
                            <p className="text-gray-500 font-semibold animate-pulse">Syncing shifts...</p>
                        </div>
                    ) : filteredSchedules.length > 0 ? (
                        <Table
                            aria-label="Schedules Table"
                            removeWrapper
                            classNames={{
                                th: "bg-gray-50/50 text-gray-400 font-semibold uppercase tracking-tighter text-xs py-5",
                                td: "py-4 border-b border-gray-50 last:border-0",
                            }}
                        >
                            <TableHeader>
                                <TableColumn>EMPLOYEE IDENTITY</TableColumn>
                                <TableColumn>SHIFT DATE</TableColumn>
                                <TableColumn>TIME WINDOW</TableColumn>
                                <TableColumn align="center">ACTUAL START</TableColumn>
                                <TableColumn align="center">ACTUAL END</TableColumn>
                                <TableColumn>SHIFT ROLE</TableColumn>
                                <TableColumn align="center">STATUS</TableColumn>
                                <TableColumn align="center">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {items.map((schedule) => (
                                    <TableRow key={schedule.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar
                                                    name={schedule.employeeName}
                                                    className="w-10 h-10 text-xs font-semibold border-2 border-white shadow-sm"
                                                    color={getShiftColor(schedule.shiftType)}
                                                />
                                                <div>
                                                    <p className="font-bold text-gray-900 leading-none">{schedule.employeeName}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p className="font-semibold text-gray-700">
                                                    {new Date(schedule.shiftDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] text-indigo-400 font-semibold">
                                                    {new Date(schedule.shiftDate).toLocaleDateString('en-US', { weekday: 'long' })}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {schedule.shiftType === "OffDay" ? (
                                                <div className="flex items-center gap-2 text-rose-500 font-bold text-sm uppercase italic">
                                                    <Coffee className="w-4 h-4 text-rose-400" />
                                                    {schedule.notes || "Rest Day"}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-none">
                                                            {schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {schedule.actualStartTime ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold drop-shadow-sm">
                                                        <Zap className="w-3.5 h-3.5 fill-current" />
                                                        {schedule.actualStartTime.includes('T') ? schedule.actualStartTime.split('T')[1].substring(0, 5) : schedule.actualStartTime.substring(0, 5)}
                                                    </div>
                                                    <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-tighter">Started the shift</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 font-bold text-[10px] italic">--- Pending ---</span>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {schedule.actualEndTime ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1.5 text-amber-600 font-black drop-shadow-sm">
                                                        <Clock className="w-3.5 h-3.5 fill-current" />
                                                        {schedule.actualEndTime.includes('T') ? schedule.actualEndTime.split('T')[1].substring(0, 5) : schedule.actualEndTime.substring(0, 5)}
                                                    </div>
                                                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter">Ended the shift</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-200 font-bold text-[10px] italic">--- In Progress ---</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                variant="flat"
                                                color={getShiftColor(schedule.shiftType)}
                                                className="font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter"
                                            >
                                                {schedule.shiftType}
                                            </Chip>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                size="sm"
                                                variant="dot"
                                                color={(schedule.shiftDate && schedule.shiftDate.startsWith(new Date().toLocaleDateString('en-CA'))) ? "success" : "default"}
                                                className="font-bold"
                                            >
                                                {(schedule.shiftDate && schedule.shiftDate.startsWith(new Date().toLocaleDateString('en-CA'))) ? "Active Today" : "Planned"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell align="center">
                                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="primary"
                                                    onPress={() => handleEditClick(schedule)}
                                                    isDisabled={isActionDisabled(schedule.shiftDate)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onPress={() => handleDelete(schedule.id)}
                                                    isDisabled={isActionDisabled(schedule.shiftDate)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center p-6">
                            <div className="p-10 bg-gray-50 rounded-[3rem] mb-6">
                                <CalendarIcon className="w-20 h-20 text-gray-200" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">No Schedules Found</h3>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                                We couldn't find any shifts matching your current filters. Try adjusting your search!
                            </p>
                            <Button
                                color="primary"
                                variant="flat"
                                className="mt-8 font-bold rounded-2xl h-12 px-8"
                                onPress={() => { setFilterText(""); setStatusFilter("all"); }}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    )}

                    <div className="flex w-full justify-center py-6 border-t border-gray-50 bg-gray-50/10">
                        <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={page}
                            total={pages}
                            onChange={(page) => setPage(page)}
                        />
                    </div>
                </CardBody>
            </Card>

            <EditScheduleModal
                isOpen={isEditOpen}
                onOpenChange={onEditClose}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                handleEditChange={handleEditChange}
                handleEditSubmit={handleEditSubmit}
                isEditing={isEditing}
                shiftTypes={shiftTypes}
            />

            <AddSingleShiftModal
                isOpen={isSingleOpen}
                onOpenChange={onSingleClose}
                employees={employees}
                singleFormData={singleFormData}
                setSingleFormData={setSingleFormData}
                handleSingleSubmit={handleSingleSubmit}
                isCreatingSingle={isCreatingSingle}
                shiftTypes={shiftTypes}
            />

            <AddWeeklyScheduleModal
                isOpen={isWeeklyOpen}
                onOpenChange={onWeeklyClose}
                employees={employees}
                schedules={schedules}
                onSuccess={() => {
                    onWeeklyClose();
                    fetchData();
                }}
            />
        </div>
    );
}