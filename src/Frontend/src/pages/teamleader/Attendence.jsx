import React, { useState, useEffect, useMemo } from 'react';
import { 
    Card, 
    CardBody, 
    Table, 
    TableHeader, 
    TableColumn, 
    TableBody, 
    TableRow, 
    TableCell, 
    Input, 
    Button, 
    Chip, 
    Avatar,
    Spinner,
    Progress,
    Tooltip
} from "@heroui/react";
import { 
    Search, 
    Users, 
    Clock, 
    Calendar, 
    Download, 
    Filter,
    CheckCircle2, 
    AlertCircle, 
    ArrowUpRight,
    ArrowDownLeft,
    Timer,
    History
} from "lucide-react";
import { teamLeaderApiServices } from '../../services/TeamLeader/TeamLeaderApi';
import { addToast } from "@heroui/toast";

export default function Attendence() {
    const [attendance, setAttendance] = useState([]);
    const [currentStatus, setCurrentStatus] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA'));

    useEffect(() => {
        fetchAttendanceData();
    }, [filterDate]);

    const fetchAttendanceData = async () => {
        setIsLoading(true);
        try {
            const [logsRes, summaryRes, currentRes] = await Promise.all([
                teamLeaderApiServices.getAttendance({ date: filterDate }),
                teamLeaderApiServices.getAttendanceSummary(),
                teamLeaderApiServices.getAttendanceCurrentStatus()
            ]);

            if (logsRes.data.succeeded) {
                const rawData = logsRes.data.data || [];
                setAttendance(Array.isArray(rawData) ? rawData : Object.values(rawData));
            }
            if (summaryRes.data.succeeded) {
                setSummary(summaryRes.data.data);
            }
            if (currentRes.data.succeeded) {
                const rawCurrent = currentRes.data.data || [];
                setCurrentStatus(Array.isArray(rawCurrent) ? rawCurrent : Object.values(rawCurrent));
            }
        } catch (error) {
            console.error("Attendance Fetch Error:", error);
            addToast({ 
                title: "Syncing Error", 
                description: "Could not fetch live attendance logs.", 
                color: "danger" 
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Intelligent Ledger Merge: Combine Historical Logs with Live Presence
    const processedLogs = useMemo(() => {
        // Start with historical logs
        const merged = [...attendance];
        
        // Add anyone currently on-site who isn't already in the log for this date
        const todayDate = new Date().toLocaleDateString('en-CA');
        const isFilteringToday = filterDate === todayDate;

        if (isFilteringToday && Array.isArray(currentStatus)) {
            currentStatus.forEach(liveEmp => {
                if (!liveEmp) return;
                const liveId = (liveEmp.employeeId || liveEmp.employee?.id)?.toString();
                const alreadyExists = merged.some(log => 
                    log && (log.employeeId || log.employee?.id)?.toString() === liveId
                );

                if (!alreadyExists && liveEmp.isPresent) {
                    merged.unshift({
                        id: `live-${liveId}`,
                        employeeId: liveEmp.employeeId,
                        employeeName: liveEmp.employeeName,
                        loginTime: liveEmp.clockInTime || liveEmp.LoginTime,
                        logoutTime: liveEmp.clockOutTime || liveEmp.LogoutTime,
                        status: "Present (Live)",
                        isLive: true
                    });
                }
            });
        }

        return merged;
    }, [attendance, currentStatus, filterDate]);

    const filteredLogs = useMemo(() => {
        return processedLogs.filter(log => 
            log && log.employeeName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [processedLogs, searchQuery]);

    const formatTime = (timeStr) => {
        if (!timeStr) return "---";
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const calculateDuration = (start, end) => {
        if (!start) return "N/A";
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();
        const diffMs = endTime - startTime;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        return `${diffHrs}h ${diffMins}m`;
    };

    return (
        <div className="max-w-[1400px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        Attendance Control
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Live monitoring of team presence and punctuality.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Input 
                        type="date"
                        size="sm"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="max-w-[200px]"
                        startContent={<Calendar className="w-4 h-4 text-gray-400" />}
                    />
                    <Button 
                        variant="flat" 
                        color="primary" 
                        size="sm"
                        startContent={<Download className="w-4 h-4" />}
                        className="font-semibold cursor-not-allowed"
                        disabled
                    >
                        Export Log
                    </Button>
                </div>
            </div>


            {/* Attendance Ledger Table */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardBody className="p-0">
                    <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/30">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <History className="w-4 h-4 text-indigo-600" />
                                Attendance Ledger
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Syncing with Live Central records</p>
                        </div>
                        <Input 
                            placeholder="Search caregiver by name..."
                            size="sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            startContent={<Search className="w-4 h-4 text-gray-400" />}
                            className="max-w-[400px]"
                            classNames={{
                                inputWrapper: "bg-white border-gray-200"
                            }}
                        />
                    </div>

                    <Table 
                        aria-label="Attendance Table"
                        shadow="none"
                        selectionMode="single"
                        classNames={{
                            th: "bg-gray-50/80 text-gray-400 font-semibold text-[11px] uppercase tracking-wider py-5 border-b border-gray-100",
                            td: "py-5 font-semibold text-sm text-gray-700 border-b border-gray-50",
                            tr: "group hover:bg-indigo-50/40 transition-all duration-300 cursor-pointer"
                        }}
                    >
                        <TableHeader>
                            <TableColumn>CAREGIVER</TableColumn>
                            <TableColumn align="center">DATE</TableColumn>
                            <TableColumn align="center">STARTED SHIFT</TableColumn>
                            <TableColumn align="center">ENDED SHIFT</TableColumn>
                            <TableColumn align="center">WORKED HOURS</TableColumn>
                            <TableColumn align="center">STATUS</TableColumn>
                        </TableHeader>
                        <TableBody 
                            emptyContent={"No attendance logs found for this date."}
                            isLoading={isLoading}
                            loadingContent={<Spinner label="Connecting to Attendance Central..." color="primary" />}
                        >
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id || log.employeeId}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar 
                                                    name={log.employeeName} 
                                                    size="md"
                                                    className="bg-indigo-100 text-indigo-600 font-bold ring-2 ring-white shadow-sm"
                                                />
                                                {!(log.logoutTime || log.clockOutTime) && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-base leading-none">{log.employeeName}</p>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase">Staff ID: #{log.employeeId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell align="center">
                                        <div className="text-gray-500 font-semibold tabular-nums bg-gray-50 py-1 px-3 rounded-full inline-block">
                                            {log.logDate || new Date(log.loginTime || log.clockInTime).toLocaleDateString('en-CA')}
                                        </div>
                                    </TableCell>
                                    <TableCell align="center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-indigo-600 font-bold tabular-nums text-base">
                                                {formatTime(log.loginTime || log.clockInTime || log.actualStartTime)}
                                            </div>
                                            <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase mt-0.5">
                                                <ArrowUpRight className="w-3 h-3" />
                                                Arrival
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell align="center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-gray-500 font-bold tabular-nums text-base">
                                                {formatTime(log.logoutTime || log.clockOutTime || log.actualEndTime)}
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-black uppercase mt-0.5">
                                                <ArrowDownLeft className="w-3 h-3" />
                                                Departure
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell align="center">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 border border-indigo-100">
                                                <Timer className="w-3.5 h-3.5" />
                                                {calculateDuration(log.loginTime || log.clockInTime, log.logoutTime || log.clockOutTime)}
                                            </div>
                                            <Progress 
                                                size="sm" 
                                                value={(log.logoutTime || log.clockOutTime) ? 100 : 65} 
                                                color={(log.logoutTime || log.clockOutTime) ? "default" : "primary"}
                                                className="max-w-[60px]"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell align="center">
                                         {(() => {
                                            const start = log.loginTime || log.clockInTime;
                                            const end = log.logoutTime || log.clockOutTime;
                                            const isFinished = !!end;
                                            
                                            // 8 hours in milliseconds = 28,800,000
                                            const diffMs = isFinished ? (new Date(end) - new Date(start)) : 0;
                                            const isShortShift = isFinished && diffMs < (8 * 60 * 60 * 1000);

                                            return (
                                                <Chip 
                                                    size="sm" 
                                                    variant="flat" 
                                                    color={!isFinished ? "success" : (isShortShift ? "warning" : "default")}
                                                    className="font-semibold text-[10px] uppercase tracking-widest px-3"
                                                    startContent={!isFinished && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />}
                                                >
                                                    {!isFinished 
                                                        ? "Shift In Progress" 
                                                        : (isShortShift ? "Left without completing the shift" : "Shift Completed")
                                                    }
                                                </Chip>
                                            );
                                         })()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
}