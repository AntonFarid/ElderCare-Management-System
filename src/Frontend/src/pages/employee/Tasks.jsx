import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardBody, Spinner, Button, Chip, Input, Select, SelectItem,
} from '@heroui/react';
import { addToast } from '@heroui/toast';
import {
    ClipboardList, CheckCircle2, Clock, Calendar, Star,
    AlertCircle, RefreshCw, Filter, TrendingUp, ListTodo,
    CheckCheck, Hourglass,
} from 'lucide-react';
import { employeeApiServices } from '../../services/Employee/EmployeeApi';

// ── constants ────────────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
    High:   { label: 'High',   color: 'danger',   dot: 'bg-red-500',    text: 'text-red-500',    badge: 'bg-red-50 text-red-600 border-red-200'   },
    Medium: { label: 'Medium', color: 'warning',  dot: 'bg-amber-500',  text: 'text-amber-500',  badge: 'bg-amber-50 text-amber-600 border-amber-200' },
    Low:    { label: 'Low',    color: 'success',  dot: 'bg-green-500',  text: 'text-green-500',  badge: 'bg-green-50 text-green-600 border-green-200' },
};

const PRIORITY_SORT = { High: 0, Medium: 1, Low: 2 };

function getPriorityCfg(p) {
    return PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.Low;
}

function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg }) {
    return (
        <div className={`flex items-center gap-4 p-5 rounded-2xl border ${bg} shadow-sm`}>
            <div className={`p-3 rounded-xl ${color} bg-white shadow-sm`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-2xl font-extrabold text-gray-800">{value ?? '—'}</p>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
        </div>
    );
}

// ── task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onComplete, completing, isCompleted }) {
    const p = getPriorityCfg(task.priority);

    return (
        <div className={`relative bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${isCompleted ? 'opacity-70' : 'hover:-translate-y-0.5'}`}>
            {/* priority dot */}
            <span className={`absolute top-5 left-5 w-2.5 h-2.5 rounded-full ${p.dot}`} />

            <div className="pl-5">
                {/* top row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className={`font-bold text-gray-800 text-base ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {task.taskType}
                        </p>
                        {task.description && (
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{task.description}</p>
                        )}
                    </div>

                    {/* priority badge */}
                    <span className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${p.badge}`}>
                        {p.label}
                    </span>
                </div>

                {/* meta row */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                    {task.elderlyName && (
                        <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full font-medium">
                            <Star className="w-3 h-3" />
                            {task.elderlyName}
                        </span>
                    )}
                    {task.dueDate && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Due {formatDate(task.dueDate)}
                        </span>
                    )}
                    {isCompleted && task.completedAt && (
                        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed {formatTime(task.completedAt)}
                        </span>
                    )}
                </div>

                {/* complete button */}
                {!isCompleted && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            isLoading={completing === task.id}
                            onPress={() => onComplete(task.id)}
                            startContent={completing !== task.id && <CheckCircle2 className="w-4 h-4" />}
                            className="font-semibold"
                        >
                            Mark as Complete
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function Tasks() {
    const [activeTab, setActiveTab]   = useState('pending');   // 'pending' | 'completed'
    const [date, setDate]             = useState(todayISO());
    const [priorityFilter, setPriorityFilter] = useState('');

    const [pendingTasks, setPendingTasks]   = useState([]);
    const [summary, setSummary]             = useState(null);
    const [loading, setLoading]             = useState(false);
    const [completing, setCompleting]       = useState(null);  // taskId

    // ── fetch ──────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [pendingRes, summaryRes] = await Promise.all([
                employeeApiServices.getPendingTasks(),
                employeeApiServices.getTasksSummary(date),
            ]);
            if (pendingRes.data?.succeeded)  setPendingTasks(pendingRes.data.data   ?? []);
            if (summaryRes.data?.succeeded)  setSummary(summaryRes.data.data ?? null);
        } catch (err) {
            console.error('Tasks fetch error:', err);
            addToast({ title: 'Error', description: 'Failed to load tasks.', color: 'danger' });
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── complete ───────────────────────────────────────────────────────────
    const handleComplete = async (taskId) => {
        try {
            setCompleting(taskId);
            const res = await employeeApiServices.completeTask(taskId);
            if (res.data?.succeeded) {
                setPendingTasks((prev) => prev.filter((t) => t.id !== taskId));
                setSummary((prev) =>
                    prev ? {
                        ...prev,
                        completedTasks: prev.completedTasks + 1,
                        pendingTasks:   prev.pendingTasks   - 1,
                        completionRate: Math.round(((prev.completedTasks + 1) / prev.totalTasks) * 100),
                    } : prev
                );
                addToast({ title: 'Task Completed!', description: 'Great job! Keep it up.', color: 'success' });
            }
        } catch (err) {
            console.error('Complete task error:', err);
            addToast({ title: 'Error', description: 'Could not complete this task.', color: 'danger' });
        } finally {
            setCompleting(null);
        }
    };

    // ── derived data ───────────────────────────────────────────────────────
    const completedTasks = summary?.tasks?.filter((t) => t.isCompleted) ?? [];

    const applyPriorityFilter = (list) =>
        priorityFilter ? list.filter((t) => t.priority === priorityFilter) : list;

    const sortByPriority = (list) =>
        [...list].sort((a, b) => (PRIORITY_SORT[a.priority] ?? 2) - (PRIORITY_SORT[b.priority] ?? 2));

    const filteredPending   = sortByPriority(applyPriorityFilter(pendingTasks));
    const filteredCompleted = sortByPriority(applyPriorityFilter(completedTasks));

    const displayList = activeTab === 'pending' ? filteredPending : filteredCompleted;

    const completionPct = summary?.completionRate ?? 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-blue-500" />
                        My Tasks
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Track and complete your daily care tasks.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Input
                        type="date"
                        size="sm"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        startContent={<Calendar className="w-4 h-4 text-gray-400" />}
                        className="w-44"
                        labelPlacement="outside"
                    />
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        isIconOnly
                        onPress={fetchAll}
                        isLoading={loading}
                        title="Refresh"
                    >
                        {!loading && <RefreshCw className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* ── stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={ListTodo}   label="Total"      value={summary?.totalTasks}      color="text-blue-600"   bg="border-blue-100 bg-blue-50/60"   />
                <StatCard icon={CheckCheck} label="Completed"  value={summary?.completedTasks}  color="text-green-600"  bg="border-green-100 bg-green-50/60"  />
                <StatCard icon={Hourglass}  label="Pending"    value={summary?.pendingTasks}     color="text-amber-600"  bg="border-amber-100 bg-amber-50/60"  />
                <StatCard icon={TrendingUp} label="Completion" value={summary ? `${completionPct}%` : '—'} color="text-purple-600" bg="border-purple-100 bg-purple-50/60" />
            </div>

            {/* ── progress bar ── */}
            {summary && summary.totalTasks > 0 && (
                <Card className="shadow-sm border border-gray-100">
                    <CardBody className="py-4 px-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Today's Progress</span>
                            <span className="text-sm font-bold text-blue-600">{completionPct}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${completionPct}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            {summary.completedTasks} of {summary.totalTasks} tasks completed
                        </p>
                    </CardBody>
                </Card>
            )}

            {/* ── filters + tabs ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
                    {[
                        { key: 'pending',   label: 'Pending',   count: pendingTasks.length,    icon: Hourglass   },
                        { key: 'completed', label: 'Completed', count: completedTasks.length,  icon: CheckCheck  },
                    ].map(({ key, label, count, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                                ${activeTab === key
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            {count > 0 && (
                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full
                                    ${activeTab === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* priority filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <Select
                        size="sm"
                        placeholder="All priorities"
                        selectedKeys={priorityFilter ? [priorityFilter] : []}
                        onSelectionChange={(keys) => setPriorityFilter([...keys][0] || '')}
                        className="w-40"
                        aria-label="Filter by priority"
                    >
                        <SelectItem key="">All Priorities</SelectItem>
                        <SelectItem key="High">🔴 High</SelectItem>
                        <SelectItem key="Medium">🟡 Medium</SelectItem>
                        <SelectItem key="Low">🟢 Low</SelectItem>
                    </Select>
                </div>
            </div>

            {/* ── task list ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Spinner size="lg" color="primary" />
                    <p className="text-sm text-gray-400">Loading tasks…</p>
                </div>
            ) : displayList.length === 0 ? (
                <Card className="shadow-sm border border-dashed border-gray-200">
                    <CardBody className="py-16 flex flex-col items-center justify-center gap-4">
                        {activeTab === 'pending' ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-semibold text-gray-700">All tasks complete!</p>
                                    <p className="text-sm text-gray-400 mt-1">No pending tasks for this date. Great work!</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                    <ClipboardList className="w-8 h-8 text-gray-300" />
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-semibold text-gray-700">No completed tasks yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Complete a pending task to see it here.</p>
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {displayList.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onComplete={handleComplete}
                            completing={completing}
                            isCompleted={activeTab === 'completed'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
