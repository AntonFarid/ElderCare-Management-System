import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Spinner,
    Input,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    useDisclosure,
    Avatar,
} from "@heroui/react";
import {
    Search as SearchIcon,
    Users,
    HeartPulse,
    Eye,
    RefreshCw,
    UserCircle,
    Home,
    FileText,
    ChevronRight,
    Search,
    AlertCircle,
    User,
    Calendar,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";
import ResidentDetailsModal from "../../components/TeamLeader/ResidentDetailsModal";

export default function TeamLeaderResidents() {
    const navigate = useNavigate();
    const [residents, setResidents] = useState([]);
    const [filteredResidents, setFilteredResidents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedResident, setSelectedResident] = useState(null);

    const fetchResidents = async () => {
        setIsLoading(true);
        try {
            const response = await teamLeaderApiServices.getAllElderly();
            if (response.data.succeeded) {
                setResidents(response.data.data || []);
                setFilteredResidents(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching residents:", error);
            addToast({
                title: "Error",
                description: "Failed to load elderly residents",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResidents();
    }, []);

    // Handle Local Search Filtering
    useEffect(() => {
        if (!searchTerm) {
            setFilteredResidents(residents);
        } else {
            const lowercasedSearch = searchTerm.toLowerCase();
            const filtered = residents.filter(res => 
                (res.fullName && res.fullName.toLowerCase().includes(lowercasedSearch)) ||
                (res.roomNumber && res.roomNumber.toLowerCase().includes(lowercasedSearch)) ||
                (res.medicalConditions && res.medicalConditions.toLowerCase().includes(lowercasedSearch))
            );
            setFilteredResidents(filtered);
        }
    }, [searchTerm, residents]);

    const handleViewResident = (res) => {
        navigate(`/teamleader/residents/${res.id}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-4 lg:p-6 bg-slate-50/50 min-h-screen">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 mt-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                         <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Users className="w-7 h-7 text-white" />
                         </div>
                         <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
                            Resident Directory
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                        High-precision monitoring of elderly resident health and care assignments.
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Sync button removed as requested */}
                </div>
            </div>

            {/* Performance/Status Overview (Quick Stats) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                 <Card className="border-none shadow-sm bg-white overflow-hidden group">
                     <CardBody className="p-6 flex flex-row items-center gap-4 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <User className="w-16 h-16" />
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Residents</p>
                            <p className="text-2xl font-bold text-slate-900">{residents.length}</p>
                        </div>
                     </CardBody>
                 </Card>
                 <Card className="border-none shadow-sm bg-white overflow-hidden group">
                     <CardBody className="p-6 flex flex-row items-center gap-4 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Home className="w-16 h-16 text-emerald-500" />
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                            <Home className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Housing</p>
                            <p className="text-2xl font-bold text-slate-900">{residents.filter(r => r.roomNumber).length}</p>
                        </div>
                     </CardBody>
                 </Card>
                 <Card className="border-none shadow-sm bg-white overflow-hidden group">
                     <CardBody className="p-6 flex flex-row items-center gap-4 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <HeartPulse className="w-16 h-16 text-rose-500" />
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                            <HeartPulse className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Care Rate</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-2xl font-bold text-slate-900">98.4</p>
                                <p className="text-xs font-medium text-rose-500">%</p>
                            </div>
                        </div>
                     </CardBody>
                 </Card>
                 <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden group">
                     <CardBody className="p-6 flex flex-row items-center gap-4 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <FileText className="w-16 h-16" />
                        </div>
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">New Admissions</p>
                            <p className="text-2xl font-bold">{Math.floor(residents.length / 5)}</p>
                        </div>
                     </CardBody>
                 </Card>
            </div>

            {/* Filter Engine */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white dark:bg-slate-800 rounded-[28px] overflow-hidden">
                <CardBody className="p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="w-full max-w-xl relative group">
                        <Input
                            placeholder="Explore by name, room, or clinical symptoms..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            startContent={<Search className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />}
                            variant="faded"
                            isClearable
                            classNames={{
                                inputWrapper: "h-14 bg-slate-50 shadow-inner rounded-2xl group-hover:bg-slate-100 transition-colors"
                            }}
                            onClear={() => setSearchTerm("")}
                            size="md"
                        />
                    </div>
                    <div className="flex items-center gap-4 px-6 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        <Users className="w-5 h-5 text-indigo-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Directory Population</span>
                            <span className="text-sm font-bold text-indigo-700">{filteredResidents.length} Members</span>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Main Data Perspective */}
            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
                    <Spinner size="lg" color="primary" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse uppercase tracking-[0.2em]">Aggregating Resident Profiles...</p>
                </div>
            ) : filteredResidents.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-[40px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <Table 
                      aria-label="Residents population table" 
                      removeWrapper
                      classNames={{
                        th: "bg-slate-50/80 dark:bg-slate-900 text-slate-400 font-bold text-[10px] uppercase tracking-widest py-5 border-b border-slate-100 dark:border-slate-800",
                        td: "py-5 px-3 border-b border-light-100 dark:border-slate-800/50",
                        tr: "hover:bg-indigo-50/20 dark:hover:bg-slate-900/30 transition-colors"
                      }}
                    >
                        <TableHeader>
                            <TableColumn>INDIVIDUAL PROFILE</TableColumn>
                            <TableColumn>HOUSING</TableColumn>
                            <TableColumn>MEDICAL STATUS</TableColumn>
                            <TableColumn>FAMILY NETWORK</TableColumn>
                            <TableColumn align="center">MGMT CONTROLS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {filteredResidents.map((res) => (
                                <TableRow key={res.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
                                                <Avatar size="sm" name={res.fullName} className="bg-white text-indigo-600 font-bold text-[10px]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{res.fullName}</span>
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{res.age} Years · ID-REF {res.id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-100 rounded-lg">
                                                <Home className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-xs">RM {res.roomNumber || "N/A"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 max-w-[280px]">
                                            <div className="flex items-center gap-2">
                                                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                                                <span className="text-xs font-medium text-slate-600 truncate italic" title={res.medicalConditions}>
                                                    {res.medicalConditions || "Standard Care Record"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {res.assignedEmployees?.slice(0, 2).map((emp, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 py-0.5 px-2 bg-indigo-50 rounded-full border border-indigo-100">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight">{emp.employeeName.split(' ')[0]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {res.familyMembers && res.familyMembers.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-700">{res.familyMembers[0].familyMemberName}</span>
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase italic opacity-70">
                                                    {res.familyMembers[0].relationship} Relationship
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 py-1 px-3 bg-slate-50 rounded-xl border border-slate-100 w-fit">
                                                <AlertCircle className="w-3 h-3 text-slate-400" />
                                                <span className="text-[9px] font-medium text-slate-400 uppercase">Unlinked Account</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-3">
                                            <Tooltip content="Explore Full Profile" offset={10}>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all shadow-sm rounded-xl"
                                                    onPress={() => handleViewResident(res)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="py-32 text-center flex flex-col items-center gap-4 bg-white rounded-[60px] border-2 border-dashed border-slate-100">
                    <div className="bg-slate-50 p-8 rounded-full shadow-inner">
                        <Users className="w-24 h-24 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-800 tracking-tight">Population Empty</p>
                        <p className="text-sm text-slate-500 font-normal italic">Try broading your diagnostic search or check systems status.</p>
                    </div>
                </div>
            )}

            {/* Detailed Resident Perspective Modal */}
            <ResidentDetailsModal 
                isOpen={isOpen}
                onClose={onClose}
                resident={selectedResident}
            />
        </div>
    );
}
