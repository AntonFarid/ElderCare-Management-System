import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ClipboardList, X, ChevronRight, AlertCircle, Clock, Star } from 'lucide-react';
import { employeeApiServices } from '../../services/Employee/EmployeeApi';

const PRIORITY_CONFIG = {
    High:   { color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500'    },
    Medium: { color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
    Low:    { color: 'text-green-500',  bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500'  },
};

const getPriority = (task) => {
    const p = task.priority ?? 'Low';
    return PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.Low;
};

export default function TasksDropdown() {
    const [isOpen, setIsOpen]         = useState(false);
    const [tasks, setTasks]           = useState([]);
    const [summary, setSummary]       = useState(null);
    const [loading, setLoading]       = useState(false);
    const [completing, setCompleting] = useState(null); // taskId being completed
    const dropdownRef = useRef(null);

    // ── fetch data ──────────────────────────────────────────────────────────
    const fetchData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const [pendingRes, summaryRes] = await Promise.all([
                employeeApiServices.getPendingTasks(),
                employeeApiServices.getTasksSummary(today),
            ]);

            if (pendingRes.data?.succeeded)  setTasks(pendingRes.data.data   ?? []);
            if (summaryRes.data?.succeeded)  setSummary(summaryRes.data.data ?? null);
        } catch (err) {
            console.error('TasksDropdown fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen]);

    // ── close on outside click ───────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── complete a task ──────────────────────────────────────────────────────
    const handleComplete = async (taskId) => {
        try {
            setCompleting(taskId);
            const res = await employeeApiServices.completeTask(taskId);
            if (res.data?.succeeded) {
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
                setSummary((prev) =>
                    prev
                        ? {
                              ...prev,
                              completedTasks: prev.completedTasks + 1,
                              pendingTasks:   prev.pendingTasks   - 1,
                              completionRate: Math.round(
                                  ((prev.completedTasks + 1) / prev.totalTasks) * 100
                              ),
                          }
                        : prev
                );
            }
        } catch (err) {
            console.error('Complete task error:', err);
        } finally {
            setCompleting(null);
        }
    };

    const pendingCount = tasks.length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* ── trigger button ── */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="My Tasks"
            >
                <ClipboardList className="w-5 h-5" />
                {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                        {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                )}
            </button>

            {/* ── dropdown panel ── */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-[380px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-500">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-white/80" />
                            <h3 className="text-sm font-bold text-white tracking-wide">My Tasks</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* summary bar */}
                    {summary && (
                        <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
                            {[
                                { label: 'Total',       value: summary.totalTasks,      color: 'text-gray-700' },
                                { label: 'Done',        value: summary.completedTasks,  color: 'text-green-600' },
                                { label: 'Pending',     value: summary.pendingTasks,    color: 'text-blue-600'  },
                                { label: 'Rate',        value: `${summary.completionRate ?? 0}%`, color: 'text-purple-600' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="flex flex-col items-center py-3 px-2">
                                    <span className={`text-lg font-extrabold ${color}`}>{value}</span>
                                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* task list */}
                    <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs text-gray-400">Loading tasks…</p>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">All caught up! No pending tasks.</p>
                            </div>
                        ) : (
                            tasks.map((task) => {
                                const p          = getPriority(task);
                                const isComplete = completing === task.id;
                                const dueDate    = task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : null;

                                return (
                                    <div
                                        key={task.id}
                                        className={`flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group ${p.bg}`}
                                    >
                                        {/* priority dot */}
                                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${p.dot}`} />

                                        {/* content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{task.taskType}</p>
                                            {task.description && (
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                {task.elderlyName && (
                                                    <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                                        <Star className="w-2.5 h-2.5" />
                                                        {task.elderlyName}
                                                    </span>
                                                )}
                                                {dueDate && (
                                                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {dueDate}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${p.color}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>

                                        {/* complete button */}
                                        <button
                                            onClick={() => handleComplete(task.id)}
                                            disabled={isComplete}
                                            title="Mark as complete"
                                            className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-300 hover:text-green-500 hover:bg-green-50 transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        >
                                            {isComplete ? (
                                                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* footer */}
                    {!loading && tasks.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                            <p className="text-xs text-gray-400 text-center">
                                Hover a task and click <CheckCircle2 className="inline w-3 h-3 text-green-500" /> to mark it done
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
