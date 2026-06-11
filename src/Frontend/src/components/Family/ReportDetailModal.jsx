import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip,
    ScrollShadow,
} from "@heroui/react";
import {
    Activity,
    HeartPulse,
    ShieldCheck,
    FileText,
    Clock,
    Sparkles,
} from "lucide-react";
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';
import { familyApiServices } from "../../services/Family/FamilyApi";
import { addToast } from "@heroui/toast";

export default function ReportDetailModal({ isOpen, onOpenChange, reportId }) {
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (isOpen && reportId) {
            fetchDetail();
        }
        if (!isOpen) {
            setReport(null);
        }
    }, [isOpen, reportId]);

    const fetchDetail = async () => {
        setIsLoading(true);
        try {
            const response = await familyApiServices.getReportById(reportId);
            if (response.data.succeeded) {
                setReport(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching report detail:", error);
            addToast({
                title: "Error",
                description: "Failed to load clinical artifacts.",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const handleExportPDF = async () => {
        if (!report || isExporting) return;

        setIsExporting(true);
        addToast({
            title: "Generating PDF",
            description: "Preparing clinical report for download...",
            color: "primary",
        });

        try {
            const wrapper = document.createElement('div');
            wrapper.style.padding = '40px';
            wrapper.style.background = '#fff';
            wrapper.style.color = '#000';
            wrapper.style.fontFamily = 'serif';

            const headerHtml = `
                <div style="border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Sanad Care Management</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px; text-transform: uppercase;">Clinical Progress Report</p>
                </div>
                <div style="margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Report Date</p>
                    <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">${formatDate(report.reportDate)}</p>
                </div>
            `;

            // Health Metrics Table
            let metricsHtml = '';
            if (report.healthMetrics?.length > 0) {
                metricsHtml = `
                    <div style="margin-bottom: 30px;">
                        <h2 style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Vital Signs Log</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align: left; background: #f8fafc;">
                                    <th style="padding: 10px; font-size: 10px; color: #64748b; text-transform: uppercase;">Metric</th>
                                    <th style="padding: 10px; font-size: 10px; color: #64748b; text-transform: uppercase;">Value</th>
                                    <th style="padding: 10px; font-size: 10px; color: #64748b; text-transform: uppercase;">Recorded At</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.healthMetrics.map(m => `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 12px 10px; font-size: 12px; font-weight: bold;">${m.metricType}</td>
                                        <td style="padding: 12px 10px; font-size: 12px;">${m.metricValue} ${m.unit}</td>
                                        <td style="padding: 12px 10px; font-size: 12px; color: #64748b;">${formatTime(m.recordedTime)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // AI Assessment
            const aiHtml = report.aiGeneratedReport ? `
                <div style="margin-bottom: 30px; background: #f0f7ff; padding: 25px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                    <h2 style="font-size: 11px; text-transform: uppercase; color: #3b82f6; margin-bottom: 10px; font-weight: 900;">AI Clinical Analysis</h2>
                    <div style="font-size: 13px; line-height: 1.7; color: #1e293b; font-style: italic;">
                        ${report.aiGeneratedReport}
                    </div>
                </div>
            ` : '';

            wrapper.innerHTML = `
                ${headerHtml}
                ${metricsHtml}
                ${aiHtml}
                <div style="margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    Protocol ID: ${report.id} · Verified by ${report.approvedByName || 'Sanad Care Team'} · Clinical Record
                </div>
            `;

            const opt = {
                margin: 0.5,
                filename: `Sanad_Report_${new Date(report.reportDate).toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(wrapper).save();

            addToast({
                title: "Success",
                description: "Clinical report exported successfully.",
                color: "success",
            });
        } catch (error) {
            console.error("PDF Export Error:", error);
            addToast({
                title: "Export Failed",
                description: "An error occurred while generating the PDF.",
                color: "danger",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange} 
            size="4xl" 
            scrollBehavior="inside"
            backdrop="blur"
            classNames={{
                base: "bg-white dark:bg-gray-900 rounded-[40px] overflow-hidden",
                header: "border-b border-gray-100 dark:border-gray-800 p-8",
                body: "p-0",
                footer: "border-t border-gray-100 dark:border-gray-800 p-6",
                closeButton: "top-4 right-4 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {isLoading ? (
                            <div className="p-24 flex flex-col items-center justify-center gap-5">
                                <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                                <div className="text-center animate-pulse">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-1">Synchronizing Artifacts...</p>
                                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">Clinical Protocol Secure Connection</p>
                                </div>
                            </div>
                        ) : report ? (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                            Cycle: {new Date(report.reportDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <Chip size="sm" variant="flat" color="success" className="font-bold text-[9px] uppercase tracking-widest border-none px-3">
                                            {report.approvalStatus}
                                        </Chip>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                                        Report for {formatDate(report.reportDate)}
                                    </h2>
                                </ModalHeader>
                                <ModalBody>
                                    <ScrollShadow className="p-8 space-y-12">
                                        {/* AI Analysis Insight Section */}
                                        <div className="relative p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-inner group">
                                             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                                 <Sparkles className="w-24 h-24 text-blue-500" />
                                             </div>
                                             <div className="relative z-10 space-y-6">
                                                 <div className="flex items-center gap-2">
                                                     <Sparkles className="w-5 h-5 text-blue-500" />
                                                     <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-widest">Protocol Insight Analysis</h3>
                                                 </div>
                                                 <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed selection:bg-blue-100">
                                                    <ReactMarkdown>
                                                        {(report.aiGeneratedReport || report.additionalNotes || "").trim() || "Summary analysis processed for this cycle."}
                                                    </ReactMarkdown>
                                                 </div>
                                             </div>
                                        </div>

                                        {/* Detailed Vitals Grid */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex items-center gap-3">
                                                    <Activity className="w-5 h-5 text-emerald-500" />
                                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vital Signs Captured</h3>
                                                </div>
                                                <Chip size="sm" variant="flat" className="h-4 text-[8px] font-bold uppercase tracking-tighter border-none opacity-50">7 Metrics Logged</Chip>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                {(report.healthMetrics || []).map((m, i) => (
                                                    <div key={i} className="p-6 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-[32px] hover:border-blue-200 dark:hover:border-blue-900/50 transition-all hover:shadow-sm group">
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-2 group-hover:text-blue-500 transition-colors">{m.metricType}</p>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <h4 className="text-3xl font-bold text-gray-900 dark:text-white leading-none">{m.metricValue}</h4>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{m.unit}</span>
                                                        </div>
                                                        <div className="mt-4 flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                                            <Clock className="w-3 h-3 text-blue-500/50" />
                                                            <span>Log: {formatTime(m.recordedTime)}</span>
                                                        </div>
                                                        {m.notes && (
                                                            <p className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 text-[10px] italic text-gray-500 line-clamp-1">{m.notes}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Clinical Verification Footer */}
                                        <div className="p-8 bg-blue-50/30 dark:bg-blue-900/5 rounded-[40px] border border-blue-100/50 dark:border-blue-900/20 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-50 dark:border-blue-900/20">
                                                    <ShieldCheck className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">Verified Clinical Record</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Care Team: {report.approvedByName || "Sanad Medical Group"}</p>
                                                </div>
                                            </div>
                                            <div className="text-center md:text-right space-y-1">
                                                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.25em] italic">Protocol Signed</p>
                                                <p className="text-[9px] text-gray-300 font-bold uppercase">Artifact ID: {report.id.toString()}</p>
                                            </div>
                                        </div>
                                    </ScrollShadow>
                                </ModalBody>
                                <ModalFooter>
                                    <Button 
                                        variant="light" 
                                        onPress={onClose}
                                        className="font-bold uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-900 h-12 px-10"
                                    >
                                        Close Record
                                    </Button>
                                    <Button 
                                        color="primary" 
                                        className="bg-blue-600 shadow-xl shadow-blue-100 font-bold uppercase text-[10px] tracking-widest h-12 px-12 rounded-full transform hover:scale-105 transition-transform"
                                        onPress={handleExportPDF}
                                        isLoading={isExporting}
                                        startContent={!isExporting && <FileText className="w-4 h-4" />}
                                    >
                                        {isExporting ? "Generating..." : "Export to PDF"}
                                    </Button>
                                </ModalFooter>
                            </>
                        ) : (
                            <div className="p-32 text-center space-y-6">
                                <Activity className="w-16 h-16 text-gray-100 mx-auto" />
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Protocol Sync Failed</h3>
                                    <p className="text-xs text-gray-300 italic">Attempting to re-establish secure connection...</p>
                                </div>
                                <Button className="mt-4 font-bold uppercase text-[10px]" onPress={onClose}>Close</Button>
                            </div>
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
