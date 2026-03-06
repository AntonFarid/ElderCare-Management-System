import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Divider,
    Chip,
    Spinner,
    Breadcrumbs,
    BreadcrumbItem,
} from "@heroui/react";
import {
    Calendar,
    User,
    Activity,
    Clock,
    ArrowLeft,
    FileText,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Edit,
    Sparkles,
    Download
} from "lucide-react";
import { employeeApiServices } from "../../services/Employee/EmployeeApi";
import { addToast } from "@heroui/toast";
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';

const statusColorMap = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger",
};

const statusIconMap = {
    Pending: <Clock3 className="w-4 h-4" />,
    Approved: <CheckCircle2 className="w-4 h-4" />,
    Rejected: <AlertCircle className="w-4 h-4" />,
};

export default function ViewReport() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await employeeApiServices.getReportById(id);
                setReport(response.data.data);
            } catch (error) {
                console.error("Error fetching report:", error);
                addToast({
                    title: "Error",
                    description: "Failed to load report details",
                    color: "danger",
                });
                navigate("/employee/dailyreports");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchReport();
    }, [id, navigate]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: 'long',
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (val) => {
        if (!val) return "—";
        if (typeof val === 'string' && val.includes(':')) {
            const [h, m] = val.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${m} ${ampm}`;
        }
        return val;
    };

    const handleExportToPDF = () => {
        if (!report) return;

        const wrapper = document.createElement("div");
        
        let htmlContent = `
            <div style="padding: 20px 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                <h1 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px;">
                    Daily Care Report <br/>
                    <span style="color: #1f2937; font-size: 18px;">Resident: ${report.elderlyName}</span>
                </h1>
                <div style="margin-bottom: 30px; font-size: 14px; color: #4b5563;">
                    <p><strong>Report Date:</strong> ${formatDate(report.reportDate)}</p>
                    <p><strong>Status:</strong> ${report.approvalStatus}</p>
                    <p><strong>Submitted On:</strong> ${new Date(report.submissionDate).toLocaleString()}</p>
                    <p><strong>Processed By:</strong> ${report.approvedByName || "System"}</p>
                </div>
        `;

        // Add Metrics
        if (report.healthMetrics && report.healthMetrics.length > 0) {
            htmlContent += `
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #1f2937; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Health Metrics</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                        <thead>
                            <tr style="background-color: #f3f4f6; text-align: left;">
                                <th style="padding: 8px; border: 1px solid #e5e7eb;">Type</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb;">Name</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb;">Value</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb;">Time</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            report.healthMetrics.forEach(m => {
                htmlContent += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e5e7eb;">${m.metricType}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb;">${m.metricName}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${m.metricValue} ${m.unit || ''}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb;">${formatTime(m.recordedTime)}</td>
                    </tr>
                `;
            });
            htmlContent += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Add Additional Notes
        if (report.additionalNotes) {
             htmlContent += `
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #1f2937; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Observations & Notes</h2>
                    <p style="font-size: 14px; color: #374151; white-space: pre-wrap;">${report.additionalNotes}</p>
                </div>
            `;
        }

        // Add AI Report if exists
        if (report.aiGeneratedReport) {
            const aiElement = document.getElementById("ai-report-content");
            const aiClone = aiElement ? aiElement.cloneNode(true) : null;
            if(aiClone) {
               htmlContent += `
                   <div style="margin-bottom: 30px;">
                       <h2 style="color: #1f2937; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">AI Analysis & Insights</h2>
                       <div style="font-size: 13px; line-height: 1.6; color: #374151;">
                           ${aiClone.innerHTML}
                       </div>
                   </div>
               `;
            }
        }

        htmlContent += `
                <div style="margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                    Generated by SilverNest AI on ${new Date().toLocaleDateString()}
                </div>
            </div>
        `;

        wrapper.innerHTML = htmlContent;

        const dateStr = new Date(report.reportDate).toISOString().split('T')[0];
        const fileName = `${report.elderlyName.replace(/\s+/g, '_')}_Daily_Report_${dateStr}.pdf`;

        const opt = {
            margin: 0.5,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(wrapper).save().then(() => {
            addToast({
                title: "Download Complete",
                description: `Saved as ${fileName}`,
                color: "success",
            });
        }).catch(err => {
            console.error("PDF generation failed", err);
            addToast({
                title: "Download Failed",
                description: "There was an error generating the PDF.",
                color: "danger",
            });
        });

        addToast({
            title: "Generating PDF...",
            description: "Please wait.",
            color: "primary",
        });
    };



    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Spinner size="lg" label="Loading report details..." />
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <Breadcrumbs size="sm" variant="light">
                        <BreadcrumbItem onClick={() => navigate("/employee/dailyreports")}>Reports</BreadcrumbItem>
                        <BreadcrumbItem>Report #{id}</BreadcrumbItem>
                    </Breadcrumbs>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Daily Report Details</h1>
                </div>
                <div className="flex gap-2">
                    {report.approvalStatus === "Pending" && (
                        <Button
                            variant="flat"
                            color="warning"
                            startContent={<Edit className="w-4 h-4" />}
                            onClick={() => navigate(`/employee/dailyreports/edit/${id}`)}
                        >
                            Edit Report
                        </Button>
                    )}
                    <Button 
                        variant="flat" 
                        color="success" 
                        startContent={<Download className="w-4 h-4" />}
                        onPress={handleExportToPDF}
                    >
                        Export as PDF
                    </Button>
                    <Button
                        variant="flat"
                        color="primary"
                        startContent={<ArrowLeft className="w-4 h-4" />}
                        onClick={() => navigate("/employee/dailyreports")}
                    >
                        Back
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Essential Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-md border-none overflow-hidden">
                        <div className="h-2 bg-blue-500" />
                        <CardBody className="p-6 space-y-6">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</p>
                                <Chip
                                    color={statusColorMap[report.approvalStatus] || "default"}
                                    variant="flat"
                                    startContent={statusIconMap[report.approvalStatus]}
                                    className="px-3"
                                >
                                    {report.approvalStatus}
                                </Chip>
                            </div>

                            <Divider />

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Report Date</p>
                                        <p className="text-sm font-semibold">{formatDate(report.reportDate)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <User className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Resident</p>
                                        <p className="text-sm font-semibold">{report.elderlyName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Submitted On</p>
                                        <p className="text-sm font-semibold">{new Date(report.submissionDate).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {report.approvalStatus !== 'Pending' && (
                        <Card className="shadow-md border-none bg-default-50">
                            <CardBody className="p-6 space-y-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approval Info</p>
                                <div>
                                    <p className="text-xs text-gray-400">Processed By</p>
                                    <p className="text-sm font-semibold">{report.approvedByName || "System"}</p>
                                </div>
                                {report.rejectionReason && (
                                    <div className="p-3 bg-danger-50 text-danger-600 rounded-lg border border-danger-100 italic text-sm">
                                        "{report.rejectionReason}"
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Right Column: Metrics & Notes */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-md border-none">
                        <CardHeader className="px-6 pt-6 flex gap-2 items-center">
                            <Activity className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold">Health Metrics</h2>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {report.healthMetrics?.map((metric, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl border border-default-100 bg-white dark:bg-default-50 hover:shadow-sm transition-shadow duration-200"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-blue-500 uppercase tracking-tight">{metric.metricType}</span>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(metric.recordedTime)}
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{metric.metricName}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-900 dark:text-white">{metric.metricValue}</span>
                                            <span className="text-xs text-gray-400 font-medium">{metric.unit}</span>
                                        </div>
                                        {metric.notes && (
                                            <p className="mt-3 text-xs text-gray-500 border-t border-default-100 pt-2 italic">
                                                {metric.notes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="shadow-md border-none overflow-hidden">
                        <CardHeader className="px-6 pt-6 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                            <div className="flex gap-2 items-center">
                                <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Analysis & Insights</h2>
                            </div>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="relative">
                                <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full opacity-20" />
                                <div id="ai-report-content" className="prose prose-sm dark:prose-invert max-w-none pl-4 text-gray-700 dark:text-gray-300">
                                    {report.aiGeneratedReport ? (
                                        <ReactMarkdown>{report.aiGeneratedReport}</ReactMarkdown>
                                    ) : (
                                        <p className="italic">AI Analysis is being processed for this report. Please check back shortly.</p>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="shadow-md border-none">
                        <CardHeader className="px-6 pt-6 flex gap-2 items-center">
                            <FileText className="w-5 h-5 text-purple-500" />
                            <h2 className="text-lg font-bold">Observations & Notes</h2>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="p-5 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30 min-h-[120px]">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {report.additionalNotes || "No additional observations were recorded for this report."}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
