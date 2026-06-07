import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Avatar,
    Chip,
    Skeleton,
    Divider,
    Pagination,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    ScrollShadow,
} from "@heroui/react";
import {
    ArrowLeft,
    Calendar,
    Activity,
    ClipboardCheck,
    Clock,
    Sparkles,
    ChevronRight,
    TrendingUp,
    HeartPulse,
    ShieldCheck,
    MessageCircle,
    X,
} from "lucide-react";
import { familyApiServices } from "../../services/Family/FamilyApi";
import { addToast } from "@heroui/toast";
import ReportDetailModal from "../../components/Family/ReportDetailModal";

export default function DailyUpdates() {
    const [searchParams] = useSearchParams();
    const elderlyId = searchParams.get('elderlyId');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [summary, setSummary] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [resident, setResident] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // For Report Detail Modal
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [activeReportId, setActiveReportId] = useState(null);

    const fetchData = async () => {
        if (!elderlyId) return;
        setIsLoading(true);
        try {
            const reportsParams = {
                PageNumber: page,
                PageSize: 6
            };

            if (fromDate) {
                reportsParams.FromDate = fromDate;
            }
            if (toDate) {
                reportsParams.ToDate = toDate;
            }

            const [reportsRes, summaryRes, residentRes] = await Promise.all([
                familyApiServices.getApprovedReports(elderlyId, reportsParams),
                familyApiServices.getReportsSummary(elderlyId),
                familyApiServices.getElderlyDetails(elderlyId)
            ]);

            if (reportsRes.data.succeeded) {
                setReports(reportsRes.data.data.data || []);
                setTotalPages(Math.ceil(reportsRes.data.data.totalCount / 6));
            }
            if (summaryRes.data.succeeded) {
                setSummary(summaryRes.data.data);
            }
            if (residentRes.data.succeeded) {
                setResident(residentRes.data.data);
            }
        } catch (error) {
            console.error("Error fetching updates:", error);
            addToast({
                title: "Error",
                description: "Failed to load reports. Please try again.",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const autoSelectResident = async () => {
            if (!elderlyId) {
                try {
                    const response = await familyApiServices.getLinkedElderly();
                    if (response.data.succeeded && response.data.data?.length > 0) {
                        const firstResident = response.data.data[0];
                        navigate(`/family/dailyupdates?elderlyId=${firstResident.id}`, { replace: true });
                    }
                } catch (error) {
                    console.error("Auto-select resident failed:", error);
                }
            }
        };
        autoSelectResident();
    }, [elderlyId, navigate]);

    useEffect(() => {
        if (elderlyId) {
            fetchData();
        }
    }, [elderlyId, page, fromDate, toDate]);

    const handleViewDetail = (reportId) => {
        setActiveReportId(reportId);
        onOpen();
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!elderlyId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Activity className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Resident Selected</h2>
                <Link to="/family/loved-ones">
                    <Button color="primary">Go to Loved Ones</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 min-h-screen pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button
                        as={Link}
                        to={resident ? `/family/loved-ones/${resident.id}` : "/family/loved-ones"}
                        variant="flat"
                        isIconOnly
                        className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </Button>
                    <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Clinical Journal</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">
                            Daily {resident ? resident.firstName + "'s" : "Progress"} Reports
                        </h1>
                    </div>
                </div>

                {resident && (
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 pr-6 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                        <Avatar src={resident.imageUrl} size="sm" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">{resident.firstName} {resident.lastName}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">Room {resident.roomNumber}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

                {/* Reports Feed */}
                <div className="lg:col-span-12 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chronological Updates</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-5 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/20 group">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                                    <input
                                        type="date"
                                        className="bg-transparent text-[10px] font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer uppercase tracking-widest placeholder-gray-300"
                                        value={fromDate}
                                        onChange={(e) => {
                                            setFromDate(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="From"
                                    />
                                </div>
                                <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        className="bg-transparent text-[10px] font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer uppercase tracking-widest placeholder-gray-300"
                                        value={toDate}
                                        onChange={(e) => {
                                            setToDate(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="To"
                                    />
                                </div>
                                {(fromDate || toDate) && (
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="h-6 w-6 min-w-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ml-1"
                                        onPress={() => {
                                            setFromDate("");
                                            setToDate("");
                                            setPage(1);
                                        }}
                                    >
                                        <X className="w-3 h-3 text-gray-400" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-3xl" />
                            ))
                        ) : reports.length > 0 ? (
                            reports.map((report) => (
                                <Card
                                    key={report.id}
                                    isHoverable
                                    isPressable
                                    onPress={() => handleViewDetail(report.id)}
                                    className="border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group"
                                >
                                    <CardBody className="p-0">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Date Banner */}
                                            <div className="w-full md:w-48 bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                                                <span className="text-3xl font-bold text-gray-800 dark:text-white uppercase">
                                                    {new Date(report.reportDate).getDate()}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                                    {new Date(report.reportDate).toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-700/50 rounded-full shadow-sm">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <span className="text-[9px] font-bold text-gray-500">{new Date(report.reportDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            {/* Report Details Brief */}
                                            <div className="flex-1 p-6 md:p-8 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Chip size="sm" variant="flat" color="primary" className="font-bold text-[9px] uppercase tracking-widest border-none">
                                                            {report.approvalStatus}
                                                        </Chip>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• Report #{report.id.toString().slice(-6)}</span>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    {(report.healthMetrics || []).slice(0, 4).map((m, i) => (
                                                        <div key={i} className="space-y-1">
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{m.metricType}</p>
                                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{m.metricValue} <span className="text-[9px] text-gray-400 font-bold uppercase">{m.unit}</span></p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl flex items-start gap-3">
                                                    <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2">
                                                        {report.aiGeneratedReport || report.additionalNotes || "Summary analysis processed for this cycle."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4">
                                <ClipboardCheck className="w-16 h-16 text-gray-200 mx-auto" />
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest">No Logs Found</h3>
                                    <p className="text-xs text-gray-300 italic">Check back later for clinical updates.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center pt-8">
                            <Pagination
                                total={totalPages}
                                initialPage={1}
                                page={page}
                                onChange={setPage}
                                color="primary"
                                showShadow
                                size="lg"
                                radius="full"
                                classNames={{
                                    wrapper: "gap-2",
                                    item: "font-bold bg-white dark:bg-gray-800",
                                    cursor: "bg-blue-600 shadow-lg shadow-blue-300",
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Report Detail Modal */}
            <ReportDetailModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                reportId={activeReportId}
            />
        </div>
    );
}