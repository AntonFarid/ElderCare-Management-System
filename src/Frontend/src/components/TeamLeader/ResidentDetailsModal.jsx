import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Divider,
  Avatar,
  Spinner,
  useDisclosure,
  Tooltip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  User,
  Phone,
  Mail,
  Home,
  HeartPulse,
  Users,
  ShieldCheck,
  FileText,
  Calendar,
  ChevronRight,
  UserCheck,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Stethoscope,
  BriefcaseMedical,
  RefreshCw,
  Activity,
  ChefHat,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import ReactMarkdown from 'react-markdown';

export default function ResidentDetailsModal({ isOpen, onClose, resident }) {
  const navigate = useNavigate();
  
  // Diet state
  const [dietRecommendation, setDietRecommendation] = useState(null);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
  
  const { 
    isOpen: isDietOpen, 
    onOpen: onOpenDiet, 
    onOpenChange: onDietOpenChange 
  } = useDisclosure();

  useEffect(() => {
    if (!isOpen) {
      setDietRecommendation(null);
    }
  }, [isOpen]);

  const handleGenerateDiet = async () => {
    setIsGeneratingDiet(true);
    onOpenDiet();
    try {
      const response = await teamLeaderApiServices.getDietRecommendation(resident.id);
      if (response.data.succeeded) {
        setDietRecommendation(response.data.data);
      }
    } catch (error) {
      console.error("Error generating diet recommendation:", error);
    } finally {
      setIsGeneratingDiet(false);
    }
  };



  if (!resident) return null;

  return (
    <>
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="4xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        base: "bg-slate-50 dark:bg-slate-900 max-h-[90vh]",
        header: "border-b border-slate-100",
        footer: "border-t border-slate-100",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                  {resident.firstName?.[0] || resident.fullName?.[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {resident.fullName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Chip size="sm" variant="flat" color="primary" className="font-semibold">
                      Room {resident.roomNumber}
                    </Chip>
                    <Chip
                      size="sm"
                      variant="dot"
                      color={resident.isActive ? "success" : "default"}
                      className="font-bold border-none"
                    >
                      {resident.isActive ? "Active Care" : "Inactive"}
                    </Chip>
                  </div>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-full">
                {/* Left Column: Personal & Medical */}
                <div className="md:col-span-7 p-6 space-y-8 overflow-y-auto border-r border-slate-100 dark:border-slate-800">
                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> personal profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Age</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{resident.age} Years</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Enrollment</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{new Date(resident.admissionDate || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </section>


                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-danger-500">
                      <HeartPulse className="w-3.5 h-3.5" /> current conditions
                    </h4>
                    <div className="bg-danger-50/30 dark:bg-danger-900/10 p-4 rounded-2xl border border-danger-100/50">
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic">
                        "{resident.medicalConditions || "No critical medical conditions recorded."}"
                      </p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Care Team
                    </h4>
                    <div className="space-y-3">
                      {resident.assignedEmployees?.map((emp, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm" name={emp.employeeName} className="bg-indigo-100 text-indigo-600 font-bold text-[10px]" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{emp.employeeName}</span>
                          </div>
                          <Chip size="sm" variant="flat" color="secondary" className="h-5 text-[10px] font-bold uppercase">Primary</Chip>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Family & Actions */}
                <div className="md:col-span-5 bg-slate-100/50 dark:bg-slate-900/50 p-6 space-y-8 overflow-y-auto">
                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-500" /> Emergency contacts
                    </h4>
                    <div className="space-y-4">
                      {resident.familyMembers?.map((fam, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-emerald-50 dark:border-emerald-900/20 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{fam.relationship}</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fam.familyMemberName}</p>
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-normal">
                              <Phone className="w-3 h-3" />
                              <span>{fam.phoneNumber || "+20 XXX XXX XXXX"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-normal">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{fam.email || "family@example.com"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Actions Area */}
                  <section className="pt-4 space-y-3">
                    <Button
                      fullWidth
                      color="primary"
                      variant="shadow"
                      className="font-bold h-12 rounded-xl text-xs uppercase tracking-widest shadow-blue-500/20"
                      startContent={<ChevronRight className="w-4 h-4 rotate-180" />}
                      onPress={() => {
                        onClose();
                        navigate(`/teamleader/reports?elderlyId=${resident.id}`);
                      }}
                    >
                      Audit Care Reports
                    </Button>
                    

                    <Button
                      fullWidth
                      color="success"
                      variant="flat"
                      className="font-bold h-12 rounded-xl text-xs uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800"
                      startContent={<ChefHat className="w-4 h-4" />}
                      onPress={handleGenerateDiet}
                    >
                      AI Dietary Advisor
                    </Button>
                  </section>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
    

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
    </>
  );
}
