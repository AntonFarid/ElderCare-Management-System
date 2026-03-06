import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Textarea,
    Button,
    Spinner,
    Divider,
    Chip,
} from "@heroui/react";
import {
    FileText,
    ArrowLeft,
    Plus,
    Trash2,
    Send,
    User,
    Calendar,
    Activity,
    Clock,
    StickyNote,
} from "lucide-react";
import { employeeApiServices } from "../../services/Employee/EmployeeApi";
import { addToast } from "@heroui/toast";

const METRIC_TYPES_MAP = [
    { value: "Vital", label: "Vital Signs" },
    { value: "Medication", label: "Medication" },
    { value: "Activity", label: "Activity" },
    { value: "Symptom", label: "Physical Health / Symptoms" },
    { value: "Mood", label: "Mental Health / Mood" },
    { value: "Meal", label: "Nutrition / Meals" },
];

const COMMON_METRICS = {
    "Vital": [
        { name: "Blood Pressure", unit: "mmHg" },
        { name: "Heart Rate", unit: "bpm" },
        { name: "Temperature", unit: "°F" },
        { name: "Oxygen Saturation", unit: "%" },
        { name: "Respiratory Rate", unit: "breaths/min" },
    ],
    "Symptom": [
        { name: "Weight", unit: "kg" },
        { name: "Pain Level", unit: "/10" },
        { name: "Mobility Score", unit: "/5" },
    ],
    "Mood": [
        { name: "Mood Rating", unit: "/10" },
        { name: "Cognitive Score", unit: "/10" },
        { name: "Anxiety Level", unit: "/10" },
    ],
    "Meal": [
        { name: "Meals Eaten", unit: "meals" },
        { name: "Water Intake", unit: "ml" },
        { name: "Appetite Level", unit: "/5" },
    ],
    "Medication": [
        { name: "Medications Taken", unit: "" },
        { name: "Missed Doses", unit: "" },
    ],
    "Activity": [
        { name: "Steps", unit: "steps" },
        { name: "Exercise Duration", unit: "min" },
        { name: "Sleep Duration", unit: "hours" },
    ],
};

const createEmptyMetric = () => ({
    metricType: "",
    metricName: "",
    metricValue: "",
    unit: "",
    notes: "",
    recordedTime: new Date().toISOString().slice(0, 16), // datetime-local format
});

export default function CreateReport() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isEditMode = !!id;

    const [residents, setResidents] = useState([]);
    const [isLoadingResidents, setIsLoadingResidents] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [elderlyId, setElderlyId] = useState(searchParams.get("elderlyId") || "");
    const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [healthMetrics, setHealthMetrics] = useState([createEmptyMetric()]);

    // Sync from search params if they change
    useEffect(() => {
        const id = searchParams.get("elderlyId");
        if (id) setElderlyId(id);
    }, [searchParams]);

    // Fetch residents and initial data if in Edit Mode
    useEffect(() => {
        const initData = async () => {
            setIsLoadingResidents(true);
            try {
                // Fetch residents list
                const residentsResponse = await employeeApiServices.getAssignedElderly();
                const residentsList = residentsResponse.data.data || [];
                setResidents(residentsList);

                // If in edit mode, fetch existing report details
                if (isEditMode) {
                    const reportResponse = await employeeApiServices.getReportById(id);
                    const report = reportResponse.data.data;

                    if (report) {
                        // Check if report is pending - only pending reports can be edited
                        if (report.approvalStatus !== "Pending") {
                            addToast({
                                title: "Cannot Edit",
                                description: "Only pending reports can be edited.",
                                color: "warning"
                            });
                            navigate("/employee/dailyreports");
                            return;
                        }

                        setElderlyId(String(report.elderlyId));
                        setReportDate(report.reportDate.slice(0, 10));
                        setAdditionalNotes(report.additionalNotes || "");

                        if (report.healthMetrics && report.healthMetrics.length > 0) {
                            setHealthMetrics(report.healthMetrics.map(m => ({
                                metricType: m.metricType,
                                metricName: m.metricName,
                                metricValue: m.metricValue,
                                unit: m.unit || "",
                                notes: m.notes || "",
                                // Combine report date and metric time for datetime-local
                                recordedTime: `${report.reportDate.slice(0, 11)}${m.recordedTime?.slice(0, 5) || "00:00"}`
                            })));
                        }
                    }
                }
            } catch (error) {
                console.error("Error initializing report form:", error);
                addToast({
                    title: "Error",
                    description: "Failed to load report data",
                    color: "danger",
                });
            } finally {
                setIsLoadingResidents(false);
            }
        };
        initData();
    }, [id, isEditMode, navigate]);

    // Metric handlers
    const addMetric = () => {
        setHealthMetrics(prev => [...prev, createEmptyMetric()]);
    };

    const removeMetric = (index) => {
        setHealthMetrics(prev => prev.filter((_, i) => i !== index));
    };

    const updateMetric = (index, field, value) => {
        setHealthMetrics(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            // Auto-fill name suggestions when type changes
            if (field === "metricType") {
                updated[index].metricName = "";
                updated[index].unit = "";
            }

            // Auto-fill unit when a common metric name is selected
            if (field === "metricName") {
                const type = updated[index].metricType;
                const found = COMMON_METRICS[type]?.find(m => m.name === value);
                if (found) {
                    updated[index].unit = found.unit;
                }
            }

            return updated;
        });
    };

    // Validation
    const isFormValid = () => {
        if (!elderlyId || !reportDate) return false;
        if (healthMetrics.length === 0) return false;
        return healthMetrics.every(m => m.metricType && m.metricName && m.metricValue);
    };

    // Submit
    const handleSubmit = async () => {
        if (!isFormValid()) {
            addToast({
                title: "Validation Error",
                description: "Please fill in all required fields and at least one health metric.",
                color: "warning",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Helper to get HH:mm:ss from a datetime-local string (YYYY-MM-DDTHH:mm)
            const toTimeSpan = (dateTimeStr) => {
                if (!dateTimeStr) return "00:00:00";
                const [_, time] = dateTimeStr.split('T');
                return time ? `${time}:00` : "00:00:00";
            };

            const reportData = {
                elderlyId: parseInt(elderlyId),
                reportDate: new Date(reportDate).toISOString(),
                healthMetrics: healthMetrics.map(m => ({
                    metricType: m.metricType,
                    metricName: m.metricName,
                    metricValue: m.metricValue,
                    unit: m.unit,
                    notes: m.notes,
                    recordedTime: m.recordedTime ? toTimeSpan(m.recordedTime) : "00:00:00"
                })),
                additionalNotes: additionalNotes,
            };

            console.log(`${isEditMode ? 'Updating' : 'Submitting'} report with payload:`, reportData);

            if (isEditMode) {
                await employeeApiServices.updateReport(id, reportData);
            } else {
                await employeeApiServices.createReport(reportData);
            }

            addToast({
                title: "Success",
                description: `Report ${isEditMode ? 'updated' : 'created'} successfully!`,
                color: "success",
            });
            navigate("/employee/dailyreports");
        } catch (error) {
            console.error("Error creating report:", error);

            let errorMessage = "Failed to create report. Please try again.";

            if (error.response?.data) {
                console.error("Server validation error details:", JSON.stringify(error.response.data, null, 2));

                if (error.response.data.errors) {
                    const errors = error.response.data.errors;
                    const errorDetails = Object.entries(errors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
                        .join(" | ");
                    errorMessage = `Validation Error: ${errorDetails}`;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }

            addToast({
                title: "Error",
                description: errorMessage,
                color: "danger",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get selected resident info
    const selectedResident = residents.find(r => String(r.id) === String(elderlyId));

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Button
                            variant="light"
                            size="sm"
                            isIconOnly
                            onPress={() => navigate("/employee/dailyreports")}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-500" />
                            {isEditMode ? "Edit Daily Report" : "New Daily Report"}
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-12">
                        {isEditMode
                            ? "Make changes to your pending report below."
                            : "Fill in the details below to submit a daily health report."
                        }
                    </p>
                </div>
            </div>

            {/* Section 1: Report Info */}
            <Card className="shadow-md">
                <CardHeader className="px-6 pt-5 pb-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Report Information</h2>
                            <p className="text-xs text-gray-400">Select the resident and report date</p>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="px-6 pb-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {isLoadingResidents ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 col-span-2">
                                <Spinner size="sm" /> Loading residents...
                            </div>
                        ) : (
                            <Select
                                label="Resident"
                                placeholder="Select a resident"
                                isRequired
                                selectedKeys={elderlyId ? [String(elderlyId)] : []}
                                onSelectionChange={(keys) => setElderlyId([...keys][0] || "")}
                                startContent={<User className="w-4 h-4 text-gray-400" />}
                                classNames={{
                                    label: "text-blue-600 font-semibold",
                                }}
                                description={selectedResident
                                    ? `Room ${selectedResident.roomNumber || "N/A"} • Age ${selectedResident.age || "N/A"}`
                                    : undefined
                                }
                            >
                                {residents.map((r) => (
                                    <SelectItem key={String(r.id)}>
                                        {r.fullName || `${r.firstName} ${r.lastName}`}
                                    </SelectItem>
                                ))}
                            </Select>
                        )}
                        <Input
                            type="date"
                            label="Report Date"
                            labelPlacement="outside"
                            placeholder=" "
                            isRequired
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            startContent={<Calendar className="w-4 h-4 text-gray-400" />}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Section 2: Health Metrics */}
            <Card className="shadow-md">
                <CardHeader className="px-6 pt-5 pb-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Health Metrics</h2>
                                <p className="text-xs text-gray-400">Record health measurements for this visit</p>
                            </div>
                        </div>
                        <Chip size="sm" variant="flat" color="primary">
                            {healthMetrics.length} metric{healthMetrics.length !== 1 ? "s" : ""}
                        </Chip>
                    </div>
                </CardHeader>
                <CardBody className="px-6 pb-6 pt-4 space-y-4">
                    {healthMetrics.map((metric, index) => (
                        <div
                            key={index}
                            className="relative border border-default-200 rounded-xl p-5 bg-default-50/50 hover:bg-default-50 transition-colors"
                        >
                            {/* Metric number badge */}
                            <div className="absolute -top-3 left-4">
                                <Chip size="sm" variant="solid" color="primary" className="h-6">
                                    #{index + 1}
                                </Chip>
                            </div>

                            {/* Remove button */}
                            {healthMetrics.length > 1 && (
                                <button
                                    onClick={() => removeMetric(index)}
                                    className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove metric"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                <Select
                                    label="Metric Type"
                                    placeholder="Select type"
                                    isRequired
                                    size="sm"
                                    selectedKeys={metric.metricType ? [metric.metricType] : []}
                                    onSelectionChange={(keys) => updateMetric(index, "metricType", [...keys][0] || "")}
                                >
                                    {METRIC_TYPES_MAP.map((type) => (
                                        <SelectItem key={type.value} textValue={type.label}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {metric.metricType && COMMON_METRICS[metric.metricType]?.length > 0 ? (
                                    <Select
                                        label="Metric Name"
                                        labelPlacement="outside"
                                        placeholder="Select metric"
                                        isRequired
                                        size="sm"
                                        selectedKeys={metric.metricName ? [metric.metricName] : []}
                                        onSelectionChange={(keys) => updateMetric(index, "metricName", [...keys][0] || "")}
                                    >
                                        {COMMON_METRICS[metric.metricType].map((m) => (
                                            <SelectItem key={m.name}>{m.name}</SelectItem>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        label="Metric Name"
                                        labelPlacement="outside"
                                        placeholder="e.g. Blood Pressure"
                                        isRequired
                                        size="sm"
                                        value={metric.metricName}
                                        onChange={(e) => updateMetric(index, "metricName", e.target.value)}
                                    />
                                )}

                                <Input
                                    label="Value"
                                    labelPlacement="outside"
                                    placeholder="e.g. 120/80"
                                    isRequired
                                    size="sm"
                                    value={metric.metricValue}
                                    onChange={(e) => updateMetric(index, "metricValue", e.target.value)}
                                    endContent={
                                        metric.unit && (
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {metric.unit}
                                            </span>
                                        )
                                    }
                                />

                                <Input
                                    label="Unit"
                                    labelPlacement="outside"
                                    placeholder="e.g. mmHg"
                                    size="sm"
                                    value={metric.unit}
                                    onChange={(e) => updateMetric(index, "unit", e.target.value)}
                                />

                                <Input
                                    type="datetime-local"
                                    label="Recorded Time"
                                    labelPlacement="outside"
                                    placeholder=" "
                                    size="sm"
                                    value={metric.recordedTime}
                                    onChange={(e) => updateMetric(index, "recordedTime", e.target.value)}
                                    startContent={<Clock className="w-3.5 h-3.5 text-gray-400" />}
                                />

                                <Input
                                    label="Notes"
                                    labelPlacement="outside"
                                    placeholder="Optional notes..."
                                    size="sm"
                                    value={metric.notes}
                                    onChange={(e) => updateMetric(index, "notes", e.target.value)}
                                />
                            </div>
                        </div>
                    ))}

                    <Button
                        variant="bordered"
                        color="primary"
                        onPress={addMetric}
                        startContent={<Plus className="w-4 h-4" />}
                        className="w-full border-dashed"
                    >
                        Add Another Metric
                    </Button>
                </CardBody>
            </Card>

            {/* Section 3: Additional Notes */}
            <Card className="shadow-md">
                <CardHeader className="px-6 pt-5 pb-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <StickyNote className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Additional Notes</h2>
                            <p className="text-xs text-gray-400">Any extra observations or comments</p>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="px-6 pb-6 pt-4">
                    <Textarea
                        placeholder="Enter any additional observations, concerns, or notes about the resident's condition..."
                        minRows={4}
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        variant="bordered"
                    />
                </CardBody>
            </Card>

            {/* Submit Section */}
            <Card className="shadow-md border-t-4 border-t-blue-500">
                <CardBody className="px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-500">
                            {isFormValid() ? (
                                <span className="text-green-600 font-medium flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                                    Ready to submit — {healthMetrics.length} metric{healthMetrics.length !== 1 ? "s" : ""} recorded
                                </span>
                            ) : (
                                <span className="text-amber-600 font-medium flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full inline-block"></span>
                                    Please fill in all required fields
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="flat"
                                onPress={() => navigate("/employee/dailyreports")}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSubmit}
                                isLoading={isSubmitting}
                                isDisabled={!isFormValid()}
                                startContent={!isSubmitting && <Send className="w-4 h-4" />}
                                className="px-8"
                            >
                                {isEditMode ? "Update Report" : "Submit Report"}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
