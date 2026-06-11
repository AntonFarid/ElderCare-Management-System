import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card, CardHeader, CardBody, Button, Chip, Divider, Spinner,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
} from "@heroui/react";
import {
    ArrowLeft, UserCircle2, Heart, Users,
    Stethoscope, Calendar, MapPin, Phone, AlertTriangle, UtensilsCrossed,
    ChefHat, RefreshCw, Sparkles,
} from "lucide-react";
import { employeeApiServices } from "../../services/Employee/EmployeeApi";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";
import ReactMarkdown from 'react-markdown';

export default function ResidentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const isTeamLeader = window.location.pathname.includes('/teamleader/');
    const apiService = isTeamLeader ? teamLeaderApiServices : employeeApiServices;

    const [elderly, setElderly] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dietRecommendation, setDietRecommendation] = useState(null);
    const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);

    const { 
        isOpen: isDietOpen, 
        onOpen: onOpenDiet, 
        onOpenChange: onDietOpenChange 
    } = useDisclosure();

    const fetchElderly = async () => {
        setIsLoading(true);
        try {
            const response = isTeamLeader 
                ? await teamLeaderApiServices.getElderlyById(id)
                : await employeeApiServices.getAssignedElderlyById(id);
            const data = response.data.data || response.data;
            setElderly(data);
        } catch (error) {
            console.error("Error fetching elderly details:", error);
            addToast({ title: "Error", description: "Failed to load resident details", color: "danger" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateDiet = async () => {
        setIsGeneratingDiet(true);
        onOpenDiet();
        try {
            const response = await apiService.getDietRecommendation(id);
            if (response.data.succeeded) {
                setDietRecommendation(response.data.data);
            } else {
                addToast({ title: "Warning", description: response.data.message || "Failed to generate recommendations", color: "warning" });
            }
        } catch (error) {
            console.error("Error generating diet recommendation:", error);
            addToast({ title: "Error", description: "Failed to generate diet recommendation", color: "danger" });
        } finally {
            setIsGeneratingDiet(false);
        }
    };

    useEffect(() => {
        if (id) fetchElderly();
    }, [id]);

    const InfoRow = ({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-3">
            {Icon && <Icon size={16} className="text-default-400 mt-0.5 shrink-0" />}
            <div>
                <p className="text-xs text-default-400">{label}</p>
                <p className="text-sm font-medium">{value || "—"}</p>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!elderly) {
        return (
            <div className="p-4 flex flex-col items-center justify-center space-y-4 h-[50vh]">
                <h2 className="text-2xl font-bold">Resident Not Found</h2>
                <Button color="primary" onPress={() => navigate(isTeamLeader ? '/teamleader/residents' : '/employee/residents')}>
                    Back to Residents
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button isIconOnly variant="light" onPress={() => navigate(isTeamLeader ? '/teamleader/residents' : '/employee/residents')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{elderly.firstName} {elderly.lastName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Chip color={elderly.isActive ? "success" : "danger"} size="sm" variant="flat">
                                {elderly.isActive ? "Active" : "Inactive"}
                            </Chip>
                            {elderly.roomNumber && (
                                <Chip size="sm" variant="flat" startContent={<MapPin size={12} />}>
                                    Room {elderly.roomNumber}
                                </Chip>
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    color="success"
                    variant="flat"
                    className="font-bold rounded-xl text-xs uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800"
                    startContent={<ChefHat size={16} />}
                    onPress={handleGenerateDiet}
                >
                    AI Dietary Advisor
                </Button>
            </div>

            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserCircle2 size={20} className="text-primary" />
                        Personal Information
                    </h3>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoRow icon={UserCircle2} label="First Name" value={elderly.firstName} />
                        <InfoRow icon={UserCircle2} label="Last Name" value={elderly.lastName} />
                        <InfoRow icon={Calendar} label="Date of Birth"
                            value={elderly.dateOfBirth
                                ? `${new Date(elderly.dateOfBirth).toLocaleDateString()} (Age: ${elderly.age ?? "—"})`
                                : "—"} />
                        <InfoRow icon={MapPin} label="Room Number" value={elderly.roomNumber} />
                        <InfoRow icon={Phone} label="Emergency Contact" value={elderly.emergencyContact} />
                    </div>
                </CardBody>
            </Card>

            {/* Medical Information */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Stethoscope size={20} className="text-danger" />
                        Medical Information
                    </h3>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoRow icon={Stethoscope} label="Medical Conditions" value={elderly.medicalConditions} />
                        <InfoRow icon={AlertTriangle} label="Allergies" value={elderly.allergies} />
                        <InfoRow icon={UtensilsCrossed} label="Dietary Restrictions" value={elderly.dietaryRestrictions} />
                    </div>
                </CardBody>
            </Card>

            {/* Assignments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assigned Employees */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users size={20} className="text-primary" />
                            Assigned Employees
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {elderly.assignedEmployees && elderly.assignedEmployees.length > 0 ? (
                            <div className="space-y-3">
                                {elderly.assignedEmployees.map((emp) => (
                                    <div key={emp.employeeId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-default-50 border border-default-200">
                                        <div>
                                            <p className="font-medium text-sm">{emp.employeeName}</p>
                                            <p className="text-xs text-default-400">{emp.employeeEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {emp.isPrimary && (
                                                <Chip size="sm" color="warning" variant="flat">Primary</Chip>
                                            )}
                                            <Chip size="sm" variant="flat">
                                                {new Date(emp.assignedDate).toLocaleDateString()}
                                            </Chip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-default-400 text-sm italic">No employees assigned</p>
                        )}
                    </CardBody>
                </Card>

                {/* Family Members */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Heart size={20} className="text-danger" />
                            Family Members
                        </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {elderly.familyMembers && elderly.familyMembers.length > 0 ? (
                            <div className="space-y-3">
                                {elderly.familyMembers.map((fam) => (
                                    <div key={fam.familyMemberId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-default-50 border border-default-200">
                                        <div>
                                            <p className="font-medium text-sm">{fam.familyMemberName}</p>
                                            <p className="text-xs text-default-400">{fam.relationship}</p>
                                        </div>
                                        {fam.isPrimaryContact && (
                                            <Chip size="sm" color="warning" variant="flat">Primary Contact</Chip>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-default-400 text-sm italic">No family members linked</p>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Diet Recommendation Modal */}
            <Modal
                isOpen={isDietOpen}
                onOpenChange={onDietOpenChange}
                size="4xl"
                scrollBehavior="inside"
                backdrop="blur"
                classNames={{
                    base: "bg-slate-50 dark:bg-slate-900 max-h-[95vh]",
                    header: "border-b border-slate-100 dark:border-slate-800",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="p-6">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                            <ChefHat className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Dietary & Nutrition Advisor</h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personalized Diet Plan & Clinician Insights</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button isIconOnly size="sm" variant="light" onPress={handleGenerateDiet} disabled={isGeneratingDiet} className="text-slate-400 hover:text-emerald-500">
                                            <RefreshCw className={`w-4 h-4 ${isGeneratingDiet ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody className="p-6 space-y-6">
                                {isGeneratingDiet ? (
                                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                                        <Spinner size="lg" color="success" />
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest animate-pulse">Analyzing health records...</p>
                                            <p className="text-xs text-slate-500 mt-1">Reviewing allergies, vitals, medical conditions, and recent appetite history.</p>
                                        </div>
                                    </div>
                                ) : dietRecommendation ? (
                                    <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                                        {/* Summary of Vitals / Appetite Scan */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recent Avg Appetite</p>
                                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                                    {dietRecommendation.avg_meals_eaten_percent ? `${Math.round(dietRecommendation.avg_meals_eaten_percent)}%` : "N/A"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">Meals consumed over last 7 days</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Blood Sugar</p>
                                                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                                                    {dietRecommendation.recent_avg_blood_sugar ? `${dietRecommendation.recent_avg_blood_sugar.toFixed(1)} mg/dL` : "N/A"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">Recent clinical log average</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Systolic BP</p>
                                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                                    {dietRecommendation.recent_avg_systolic_bp ? `${Math.round(dietRecommendation.recent_avg_systolic_bp)} mmHg` : "N/A"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">Recent systolic blood pressure</p>
                                            </div>
                                        </div>

                                        {/* Meal Plan Recommendations */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended Daily Menu</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {dietRecommendation.meals && dietRecommendation.meals.map((meal, index) => {
                                                    const mealTypes = {
                                                        Breakfast: { color: "from-amber-400 to-orange-500", bgLight: "bg-amber-50/50" },
                                                        Lunch: { color: "from-emerald-400 to-teal-500", bgLight: "bg-emerald-50/50" },
                                                        Dinner: { color: "from-indigo-400 to-purple-500", bgLight: "bg-indigo-50/50" }
                                                    };
                                                    const styling = mealTypes[meal.type] || { color: "from-blue-400 to-indigo-500", bgLight: "bg-blue-50/50" };
                                                    return (
                                                        <div key={index} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between">
                                                            <div>
                                                                <div className={`p-4 bg-gradient-to-r ${styling.color} text-white flex items-center justify-between`}>
                                                                    <span className="font-bold text-xs uppercase tracking-widest">{meal.type}</span>
                                                                    <span className="text-xs font-semibold">{meal.calories} kcal</span>
                                                                </div>
                                                                <div className="p-5">
                                                                    <h5 className="font-bold text-base text-slate-800 dark:text-white leading-tight mb-2">
                                                                        {meal.recipe_name}
                                                                    </h5>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                                                        {meal.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                                                <div className="grid grid-cols-3 gap-1 text-center">
                                                                    <div>
                                                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Protein</span>
                                                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{meal.protein_g}g</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Carbs</span>
                                                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{meal.carbs_g}g</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Fat</span>
                                                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{meal.fat_g}g</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* AI Dietitian Notes */}
                                        <div className="p-6 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
                                            <h4 className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">
                                                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> AI Dietitian Clinical Rationale
                                            </h4>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                                                <ReactMarkdown>
                                                    {(dietRecommendation?.dietitian_notes || "").trim() || "No specific advice found."}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Warning */}
                                        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                                            <p className="text-xs font-bold text-amber-700">DISCLAIMER: AI-generated meal plans should be verified by a certified healthcare professional before deployment.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-24 text-center">
                                        <p className="text-sm text-slate-500 italic">No diet recommendation could be loaded. Please try again or contact support.</p>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter className="p-6">
                                <Button color="danger" variant="light" onPress={onClose} className="font-bold">Close Advisor</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
