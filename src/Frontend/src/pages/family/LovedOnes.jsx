import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Avatar,
    Chip,
    Button,
    Skeleton,
    Divider,
} from "@heroui/react";
import {
    Heart,
    MapPin,
    Calendar,
    User,
    ArrowRight,
    ShieldCheck,
    Activity,
    Thermometer,
} from "lucide-react";
import { familyApiServices } from "../../services/Family/FamilyApi";
import { addToast } from "@heroui/toast";
import { Link } from 'react-router-dom';

export default function LovedOnes() {
    const [lovedOnes, setLovedOnes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reportsData, setReportsData] = useState({}); // Stores the latest report for each resident

    const fetchLovedOnesAndReports = async () => {
        setIsLoading(true);
        try {
            const response = await familyApiServices.getLinkedElderly();
            if (response.data.succeeded) {
                const elders = response.data.data || [];
                setLovedOnes(elders);
                
                // Fetch latest report for each resident to get real metrics
                const reportPromises = elders.map(async (elder) => {
                    try {
                        const reportRes = await familyApiServices.getApprovedReports(elder.id, { PageSize: 1 });
                        if (reportRes.data.succeeded && reportRes.data.data.data?.length > 0) {
                            return {
                                id: elder.id,
                                latestReport: reportRes.data.data.data[0]
                            };
                        }
                    } catch (e) {
                        console.error(`Failed to fetch report for ${elder.id}`, e);
                    }
                    return { id: elder.id, latestReport: null };
                });

                const results = await Promise.all(reportPromises);
                const reportsMap = results.reduce((acc, curr) => {
                    acc[curr.id] = curr.latestReport;
                    return acc;
                }, {});
                setReportsData(reportsMap);
            }
        } catch (error) {
            console.error("Error fetching loved ones:", error);
            addToast({
                title: "Error",
                description: "Failed to load your loved ones. Please try again.",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLovedOnesAndReports();
    }, []);

    const getMetricIcon = (type = "") => {
        const t = type.toLowerCase();
        if (t.includes('heart')) return <Heart className="w-4 h-4 text-rose-500" />;
        if (t.includes('temp') || t.includes('heat')) return <Thermometer className="w-4 h-4 text-orange-500" />;
        if (t.includes('glucose') || t.includes('sugar')) return <Activity className="w-4 h-4 text-purple-500" />;
        return <Activity className="w-4 h-4 text-blue-500" />;
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 md:p-6">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-64 rounded-lg" />
                    <Skeleton className="h-4 w-96 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4 space-y-4">
                            <div className="flex gap-4">
                                <Skeleton className="rounded-full w-16 h-16" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                                </div>
                            </div>
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 md:p-6">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-500 rounded-2xl shadow-sm">
                            <Heart className="w-7 h-7 fill-current" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                            My Loved Ones
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg ml-1">
                        Review the latest health metrics and care reports for your family members.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="px-6 py-2 border-r border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{lovedOnes.length}</p>
                    </div>
                    <div className="px-6 py-2 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reports</p>
                        <Chip size="sm" color="primary" variant="flat" className="mt-1">Synchronized</Chip>
                    </div>
                </div>
            </div>

            {lovedOnes.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {lovedOnes.map((elder) => {
                        const latestReport = reportsData[elder.id];
                        const metrics = latestReport?.healthMetrics?.slice(0, 3) || [];
                        
                        return (
                            <Card 
                                key={elder.id} 
                                className="border-none shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white dark:bg-gray-800"
                            >
                                <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-blue-600" />
                                
                                <CardBody className="p-6">
                                    <div className="flex items-start justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar
                                                    src={elder.imageUrl}
                                                    name={`${elder.firstName} ${elder.lastName}`}
                                                    className="w-20 h-20 text-xl font-bold bg-blue-50 text-blue-500 border-2 border-white dark:border-gray-700 shadow-sm"
                                                    showFallback
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                                    <ShieldCheck className="w-3 h-3 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                                    {elder.firstName} {elder.lastName}
                                                </h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Chip size="sm" variant="flat" color="primary" className="font-semibold px-2">
                                                        Age: {elder.age}
                                                    </Chip>
                                                    <div className="flex items-center gap-1 text-gray-400">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium">Room {elder.roomNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Divider className="my-4 opacity-50" />

                                    {/* Real-time Dynamic Metrics Section */}
                                    <div className="my-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Latest Metrics</p>
                                            <Chip size="sm" variant="dot" color="primary" className="border-none text-[9px] h-4 font-bold uppercase opacity-70">Last Report</Chip>
                                        </div>
                                        {metrics.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {metrics.map((m, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                                        <div className="flex items-center gap-3">
                                                            {getMetricIcon(m.metricType)}
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{m.metricType}</span>
                                                        </div>
                                                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                                                            {m.metricValue} <span className="text-[10px] font-normal text-gray-400">{m.unit}</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center">
                                                <p className="text-xs font-bold text-gray-400 uppercase italic">N/A Metrics Found in Recent Reports</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Activity className="w-4 h-4 text-blue-500" />
                                                <span>Medical Status</span>
                                            </div>
                                            <span className="font-bold text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                                                {elder.medicalConditions || "Standard Care"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-8 grid grid-cols-2 gap-3">
                                        <Button 
                                            as={Link}
                                            to={`/family/dailyupdates?elderlyId=${elder.id}`}
                                            variant="light" 
                                            className="font-bold text-gray-600 hover:text-gray-900 border border-gray-100 hover:bg-gray-50"
                                            startContent={<Calendar className="w-4 h-4" />}
                                        >
                                            History
                                        </Button>
                                        <Button 
                                            as={Link}
                                            to={`/family/loved-ones/${elder.id}`}
                                            color="primary"
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                                            endContent={<ArrowRight className="w-4 h-4" />}
                                        >
                                            Full Scope
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="p-20 text-center flex flex-col items-center gap-4 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[40px]">
                    <div className="p-8 bg-white rounded-full shadow-sm">
                        <User className="w-20 h-20 text-gray-200" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">No linked members found</h2>
                        <p className="text-gray-500 max-w-sm">
                            Contact local administration to link your loved one's care profile to your account.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
