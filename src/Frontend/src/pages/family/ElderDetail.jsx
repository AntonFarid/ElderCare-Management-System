import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardHeader,
    Avatar,
    Chip,
    Button,
    Skeleton,
    Divider,
    Tab,
    Tabs,
    Progress,
} from "@heroui/react";
import {
    Heart,
    Activity,
    Stethoscope,
    Calendar,
    Mail,
    Phone,
    MessageCircle,
    ArrowLeft,
    TrendingUp,
    ShieldCheck,
    MapPin,
    Users,
    HeartPulse,
    ClipboardCheck,
    Thermometer,
    Sparkles,
} from "lucide-react";
import { familyApiServices } from "../../services/Family/FamilyApi";
import { addToast } from "@heroui/toast";
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';

export default function ElderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [elder, setElder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState([]);
    const [latestAiReport, setLatestAiReport] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    const fetchDetail = async () => {
        setIsLoading(true);
        try {
            const [detailRes, reportRes] = await Promise.all([
                familyApiServices.getElderlyDetails(id),
                familyApiServices.getApprovedReports(id, { PageSize: 1 })
            ]);

            if (detailRes.data.succeeded) {
                setElder(detailRes.data.data);
            }

            if (reportRes.data.succeeded && reportRes.data.data.data?.length > 0) {
                const latestReport = reportRes.data.data.data[0];
                setMetrics(latestReport.healthMetrics || []);
                setLatestAiReport(latestReport.aiGeneratedReport || "");
            }
        } catch (error) {
            console.error("Error fetching loved one details:", error);
            addToast({
                title: "Error",
                description: "Failed to load details. Please try again.",
                color: "danger",
            });
            navigate('/family/loved-ones');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const getMetricIcon = (type = "") => {
        const t = type.toLowerCase();
        if (t.includes('heart')) return <Heart className="w-6 h-6 mb-2 fill-white/20" />;
        if (t.includes('temp') || t.includes('heat')) return <Thermometer className="w-6 h-6 mb-2 fill-white/20" />;
        if (t.includes('glucose') || t.includes('sugar')) return <Activity className="w-6 h-6 mb-2 fill-white/20" />;
        return <Activity className="w-6 h-6 mb-2 fill-white/20" />;
    };

    const handleExportPDF = async () => {
        if (!elder || isExporting) return;

        setIsExporting(true);
        addToast({
            title: "Generating PDF",
            description: "Please wait while we prepare your medical summary...",
            color: "primary",
        });

        try {
            const element = document.getElementById('clinical-box');
            if (!element) {
                throw new Error("Clinical summary content not found");
            }

            // Create a temporary container for height/width calculation and to avoid affecting the live DOM
            const wrapper = document.createElement('div');
            wrapper.style.padding = '40px';
            wrapper.style.background = '#fff';
            wrapper.style.color = '#000';
            wrapper.style.fontFamily = 'serif';

            const headerHtml = `
                <div style="border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Sanad Care Management</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Clinical Care Summary</p>
                </div>
                <div style="margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Resident</p>
                        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">${elder.firstName} ${elder.lastName}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Date Generated</p>
                        <p style="margin: 0; font-size: 14px; color: #1e293b;">${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            `;


            wrapper.innerHTML = `
                ${headerHtml}
                <div style="font-size: 14px; line-height: 1.8; color: #334155; font-style: italic;">
                    ${latestAiReport || "No clinical assessment data available for export."}
                </div>
                
            `;

            const opt = {
                margin: [0.5, 0.5],
                filename: `${elder.firstName}_Clinical_Summary_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true
                },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(wrapper).save();

            addToast({
                title: "Success",
                description: "Medical summary exported successfully.",
                color: "success",
            });
        } catch (error) {
            console.error("PDF Export Error:", error);
            addToast({
                title: "Export Failed",
                description: "An error occurred while generating the PDF. Please try again.",
                color: "danger",
            });
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
                <Skeleton className="h-10 w-48 rounded-lg" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 p-6 space-y-4">
                        <Skeleton className="rounded-full w-24 h-24 mx-auto" />
                        <Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
                        <Skeleton className="h-4 w-1/2 mx-auto rounded-lg" />
                        <Divider />
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    </Card>
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6 h-64"><Skeleton className="h-full w-full rounded-xl" /></Card>
                        <Card className="p-6 h-64"><Skeleton className="h-full w-full rounded-xl" /></Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!elder) return null;

    // Preparation for metrics cards
    const displayMetrics = metrics.slice(0, 3);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumbs / Back button */}
            <div className="flex items-center gap-4">
                <Button
                    as={Link}
                    to="/family/loved-ones"
                    variant="light"
                    isIconOnly
                    className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loved Ones</p>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{elder.firstName}'s Profile</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Sidebar: Profile Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-lg bg-white dark:bg-gray-800 overflow-hidden">
                        <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-blue-600" />
                        <CardBody className="p-8 text-center space-y-6">
                            <div className="relative inline-block">
                                <Avatar
                                    src={elder.imageUrl}
                                    name={elder.fullName}
                                    className="w-32 h-32 text-3xl font-bold bg-blue-50 text-blue-500 border-4 border-white dark:border-gray-700 shadow-md mx-auto"
                                    showFallback
                                />
                                <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                    {elder.firstName} <span className="text-blue-500">{elder.lastName}</span>
                                </h3>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <Chip color="primary" variant="flat" size="sm" className="font-bold">Age: {elder.age}</Chip>
                                    <Chip color="success" variant="flat" size="sm" className="font-bold">Active</Chip>
                                </div>
                            </div>

                            <Divider className="opacity-50" />

                            <div className="space-y-4 text-left">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
                                        <span className="text-xs font-bold text-gray-500 uppercase">Room</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200"> {elder.roomNumber}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Calendar className="w-4 h-4" /></div>
                                        <span className="text-xs font-bold text-gray-500 uppercase">Enrollment</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(elder.admissionDate || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="flat" color="primary" className="w-full font-bold h-12" startContent={<MessageCircle className="w-4 h-4" />}>
                                    Send Message
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Quick Stats Summary */}
                    <Card className="border-none shadow-md">
                        <CardHeader className="px-6 pt-6 pb-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" /> Current Condition
                            </h4>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                <p className="text-sm text-gray-700 dark:text-gray-200 italic leading-relaxed">
                                    "{elder.medicalConditions || "No specific conditions recorded."}"
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column: Health Dashboard */}
                <div className="lg:col-span-8 space-y-6">

                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Vital Summary
                        </h4>
                        <Chip size="sm" color="primary" variant="flat" className="h-4 text-[9px] font-bold uppercase tracking-widest">
                            Source: Last Clinical Report
                        </Chip>
                    </div>

                    {/* Real-time Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {displayMetrics.length > 0 ? displayMetrics.map((m, idx) => {
                            const colors = ["bg-blue-600", "bg-purple-600", "bg-emerald-600"];
                            const textColors = ["text-blue-100", "text-purple-100", "text-emerald-100"];

                            return (
                                <Card key={idx} className={`${colors[idx]} text-white shadow-lg overflow-hidden relative group animate-in slide-in-from-top-4 duration-500`}>
                                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <Activity className="w-24 h-24" />
                                    </div>
                                    <CardBody className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            {getMetricIcon(m.metricType)}
                                            <ShieldCheck className="w-4 h-4 opacity-30" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={`text-[11px] font-bold uppercase tracking-widest ${textColors[idx]}`}>
                                                {m.metricType}
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                                <h5 className="text-4xl font-bold text-white">{m.metricValue}</h5>
                                                <span className={`text-[10px] font-bold uppercase ${textColors[idx]}`}>{m.unit}</span>
                                            </div>
                                        </div>
                                        <Progress value={m.metricValue === 'N/A' ? 0 : 75} maxValue={100} color="white" size="xs" className="mt-5 bg-white/20" />
                                    </CardBody>
                                </Card>
                            );
                        }) : (
                            <Card className="md:col-span-3 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 py-10 shadow-sm">
                                <CardBody className="flex flex-col items-center justify-center gap-3">
                                    <Activity className="w-10 h-10 text-gray-300" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Metric Data Recorded</p>
                                        <p className="text-xs text-gray-400 mt-1 italic">Vitals will appear here once the care team publishes the next update.</p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>

                    {/* Detailed Information Tabs */}
                    <Card className="border-none shadow-md bg-white dark:bg-gray-800">
                        <CardBody className="p-0">
                            <Tabs
                                aria-label="Elderly Details"
                                color="primary"
                                variant="underlined"
                                classNames={{
                                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-gray-100 dark:border-gray-700 px-6",
                                    cursor: "w-full bg-blue-600",
                                    tab: "max-w-fit px-0 h-16 font-bold uppercase text-[10px] tracking-widest",
                                    tabContent: "group-data-[selected=true]:text-blue-600"
                                }}
                            >
                                <Tab
                                    key="caregiver"
                                    title={
                                        <div className="flex items-center space-x-2">
                                            <Users className="w-4 h-4" />
                                            <span>Linked Caregivers</span>
                                        </div>
                                    }
                                >
                                    <div className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {elder.assignedEmployees?.map((emp, i) => (
                                                <Card key={i} className="bg-white dark:bg-gray-800 border border-blue-50 dark:border-blue-900/20 shadow-sm overflow-hidden group">
                                                    <div className="h-1 w-full bg-blue-500" />
                                                    <CardBody className="p-4 flex flex-row items-center gap-4">
                                                        <Avatar name={emp.employeeName} size="lg" className="bg-blue-50 text-blue-600 font-bold" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-bold text-gray-800 dark:text-gray-200">{emp.employeeName}</p>
                                                                <Chip size="sm" color="primary" variant="flat" className="h-4 text-[8px] font-bold uppercase tracking-tighter">Primary</Chip>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 mt-3">
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <Phone className="w-3 h-3 text-blue-500" />
                                                                    <span>{emp.employeePhoneNumber || emp.phoneNumber || "N/A"}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <Mail className="w-3 h-3 text-blue-500" />
                                                                    <span className="truncate">{emp.employeeEmail}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </Tab>

                            </Tabs>
                        </CardBody>
                    </Card>

                    {/* Recent Actions Footer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card as={Link} to={`/family/dailyupdates?elderlyId=${elder.id}`} className="border-none shadow-md bg-white hover:bg-gray-50 transition-colors p-6 cursor-pointer group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
                                        <ClipboardCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-800 uppercase tracking-tight">Daily Progress Reports</h5>
                                        <p className="text-xs text-gray-400">View detailed health logs and caregiver notes</p>
                                    </div>
                                </div>
                                <Activity className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </Card>
                        <Card className="border-none shadow-md bg-white hover:bg-gray-50 transition-colors p-6 cursor-pointer group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-800 uppercase tracking-tight">Medical Records</h5>
                                        <p className="text-xs text-gray-400">Scan prescriptions and lab results</p>
                                    </div>
                                </div>
                                <ShieldCheck className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
