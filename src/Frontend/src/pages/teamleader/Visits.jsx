import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User as UserComponent,
  Tabs,
  Tab
} from "@heroui/react";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  StickyNote,
  AlertCircle,
  LayoutDashboard,
  Eye,
  History,
  MessageSquare
} from "lucide-react";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";
import VisitDetailsModal from "../../components/TeamLeader/VisitDetailsModal";

export default function TeamLeaderVisits() {
  const [pendingVisits, setPendingVisits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("pending");

  // Fetch previous visits from summary endpoint if available
  const [previousVisits, setPreviousVisits] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, summaryRes, elderlyRes] = await Promise.all([
        teamLeaderApiServices.getPendingVisits(),
        teamLeaderApiServices.getVisitsSummary(),
        teamLeaderApiServices.getAllElderly()
      ]);

      let visitsList = [];
      if (pendingRes.data.succeeded) {
        visitsList = pendingRes.data.data.data || pendingRes.data.data;
      }

      let summaryData = null;
      let recentVisitsList = [];
      
      if (summaryRes.data.succeeded) {
        summaryData = summaryRes.data.data;
        recentVisitsList = summaryData.recentRequests || summaryData.RecentRequests || [];
      }

      // Create a map of elderlyId -> RoomNumber for lookup
      if (elderlyRes.data.succeeded && Array.isArray(elderlyRes.data.data)) {
        const elderlyMap = {};
        elderlyRes.data.data.forEach(e => {
          elderlyMap[e.id] = e.roomNumber || e.RoomNumber;
        });

        // Enrich visits with room numbers
        visitsList = visitsList.map(v => ({
          ...v,
          roomNumber: v.roomNumber || v.RoomNumber || elderlyMap[v.elderlyId] || elderlyMap[v.ElderlyId] || 'N/A'
        }));
        
        // Enrich previous visits with room numbers
        recentVisitsList = recentVisitsList.map(v => ({
          ...v,
          roomNumber: v.roomNumber || v.RoomNumber || elderlyMap[v.elderlyId] || elderlyMap[v.ElderlyId] || 'N/A'
        }));
      }

      setPendingVisits(Array.isArray(visitsList) ? visitsList : []);
      
      // Filter out pending visits from previous visits if they are included in recent requests
      setPreviousVisits(Array.isArray(recentVisitsList) ? recentVisitsList.filter(v => v.status !== "Pending" && v.Status !== "Pending") : []);

      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (error) {
      console.error("Failed to fetch visits data:", error);
      addToast({ title: "Error", description: "Failed to load visits", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (visitId, action) => {
    setIsActioning(visitId);
    try {
      const payload = { visitId, rejectionReason: action === 'reject' ? 'Rejected by Team Leader' : undefined };
      const res = action === 'approve'
        ? await teamLeaderApiServices.approveVisit(payload)
        : await teamLeaderApiServices.rejectVisit(payload);

      if (res.data.succeeded) {
        addToast({
          title: action === 'approve' ? "Approved" : "Rejected",
          description: `Visit request has been ${action}d.`,
          color: action === 'approve' ? "success" : "warning"
        });
        fetchData();
      }
    } catch (error) {
      console.error(`Failed to ${action} visit:`, error);
      addToast({ title: "Error", description: `Failed to ${action} visit request`, color: "danger" });
    } finally {
      setIsActioning(null);
    }
  };

  const isFuture = (dateStr, timeStr) => {
    const d = dateStr || "";
    const t = timeStr || "";
    if (!d) return false;
    const combined = t ? `${d.split('T')[0].split(' ')[0]}T${t}` : d;
    return new Date(combined) > new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const cleanDate = dateStr.split('T')[0].split(' ')[0];
    return new Date(cleanDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr, timeStr) => {
    if (!dateStr && !timeStr) return "N/A";
    let combined;
    if (timeStr) {
      combined = `${dateStr.split('T')[0].split(' ')[0]}T${timeStr}`;
    } else {
      combined = dateStr.includes(' ') || dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
    }
    return new Date(combined).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
            Visits <span className="text-blue-600">Requests</span>
          </h1>
          <p className="text-gray-400 mt-3 font-bold uppercase text-[10px] tracking-[0.2em]">Management of clinical observation synchronization</p>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex gap-4">
          <Card className="border-none shadow-sm bg-blue-50/50 dark:bg-blue-900/10 px-6 py-4 rounded-3xl">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Pending Requests</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
              {summary?.totalPending || summary?.TotalPending || pendingVisits.length}
            </p>
          </Card>
          <Card className="border-none shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10 px-6 py-4 rounded-3xl">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Approved Today</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {summary?.approvedToday || summary?.ApprovedToday || 0}
            </p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        aria-label="Visit Management Tabs"
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        color="primary"
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-blue-600",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-blue-600 font-bold uppercase tracking-widest text-[10px]"
        }}
      >
        <Tab
          key="pending"
          title={
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Pending Requests</span>
              <Chip size="sm" variant="flat" color="warning" className="ml-2 font-bold text-[10px]">
                {pendingVisits.length}
              </Chip>
            </div>
          }
        />
        <Tab
          key="previous"
          title={
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>Previous Visits</span>
            </div>
          }
        />
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <Card className="lg:col-span-12 border-none shadow-xl bg-white dark:bg-gray-900 rounded-[40px] overflow-hidden">
          <CardHeader className="p-8 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${selectedTab === 'pending' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'}`}>
                {selectedTab === 'pending' ? <LayoutDashboard className="w-6 h-6" /> : <History className="w-6 h-6" />}
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">
                {selectedTab === 'pending' ? 'Access Control Protocol' : 'Historical Visit Log'}
              </h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">Syncing Data...</p>
              </div>
            ) : selectedTab === 'pending' ? (
              pendingVisits.length > 0 ? (
                <Table
                  aria-label="Pending Visits"
                  removeWrapper
                  classNames={{
                    th: "bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-bold uppercase tracking-widest py-6 text-gray-400",
                    td: "py-6 border-b border-gray-50 dark:border-gray-800"
                  }}
                >
                  <TableHeader>
                    <TableColumn>FAMILY MEMBER</TableColumn>
                    <TableColumn>RESIDENT</TableColumn>
                    <TableColumn>DATE & TIME</TableColumn>
                    <TableColumn>NOTES</TableColumn>
                    <TableColumn align="center">STATUS ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {pendingVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <UserComponent
                            name={visit.familyMemberName || "Family Member"}
                            description={<span className="text-[10px] font-bold text-gray-300 uppercase">Kinship Verified</span>}
                            avatarProps={{ radius: "lg", size: "sm" }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-white">
                                {visit.elderlyName || visit.ElderlyName}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                Room {visit.roomNumber || visit.RoomNumber || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" /> {formatDate(visit.requestedDate || visit.RequestedDate)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                              <Clock className="w-3.5 h-3.5" /> {formatTime(visit.requestedDate || visit.RequestedDate, visit.requestedTime || visit.RequestedTime || visit.startTime || visit.StartTime)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2 max-w-xs">
                            <StickyNote className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 italic line-clamp-2">{visit.notes || "Standard clinical observation."}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 justify-center">
                            <Button
                              isIconOnly
                              variant="flat"
                              className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl w-9 h-9"
                              onPress={() => {
                                setSelectedVisit(visit);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="flat"
                              color="success"
                              size="sm"
                              className="font-bold text-[10px] tracking-widest uppercase h-9 rounded-xl px-4"
                              startContent={<CheckCircle2 className="w-3.5 h-3.5" />}
                              isLoading={isActioning === visit.id}
                              onPress={() => handleAction(visit.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="flat"
                              color="danger"
                              size="sm"
                              className="font-bold text-[10px] tracking-widest uppercase h-9 rounded-xl px-4"
                              startContent={<XCircle className="w-3.5 h-3.5" />}
                              isLoading={isActioning === visit.id}
                              onPress={() => handleAction(visit.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-200 shadow-inner">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Pending Protocols</p>
                    <p className="text-[10px] text-gray-300 italic">Access control is currently synchronized and up to date.</p>
                  </div>
                </div>
              )
            ) : (
              // Previous Visits Tab
              previousVisits.length > 0 ? (
                <Table
                  aria-label="Previous Visits"
                  removeWrapper
                  classNames={{
                    th: "bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-bold uppercase tracking-widest py-6 text-gray-400",
                    td: "py-6 border-b border-gray-50 dark:border-gray-800"
                  }}
                >
                  <TableHeader>
                    <TableColumn>FAMILY MEMBER</TableColumn>
                    <TableColumn>RESIDENT</TableColumn>
                    <TableColumn>DATE & TIME</TableColumn>
                    <TableColumn>NOTES</TableColumn>
                    <TableColumn align="center">STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {previousVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <UserComponent
                            name={visit.familyMemberName || "Family Member"}
                            description={<span className="text-[10px] font-bold text-gray-300 uppercase">Kinship Verified</span>}
                            avatarProps={{ radius: "lg", size: "sm" }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-white">
                                {visit.elderlyName || visit.ElderlyName}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                Room {visit.roomNumber || visit.RoomNumber || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" /> {formatDate(visit.requestedDate || visit.RequestedDate)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                              <Clock className="w-3.5 h-3.5" /> {formatTime(visit.requestedDate || visit.RequestedDate, visit.requestedTime || visit.RequestedTime || visit.startTime || visit.StartTime)}
                            </div>
                            <Chip size="sm" variant="flat" color={isFuture(visit.requestedDate || visit.RequestedDate, visit.requestedTime || visit.RequestedTime || visit.startTime || visit.StartTime) ? "primary" : "default"} className="font-bold text-[8px] uppercase tracking-widest border-none h-4 mt-1">
                              {isFuture(visit.requestedDate || visit.RequestedDate, visit.requestedTime || visit.RequestedTime || visit.startTime || visit.StartTime) ? "Upcoming" : "Past"}
                            </Chip>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2 max-w-xs">
                            <StickyNote className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 italic line-clamp-2">{visit.notes || "Standard clinical observation."}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Chip 
                              color={
                                (visit.status || visit.Status) === 'Approved' ? 'success' : 
                                (visit.status || visit.Status) === 'Pending' ? 'warning' : 'danger'
                              } 
                              variant="flat" 
                              className="font-bold text-[10px] uppercase tracking-widest"
                            >
                              {visit.status || visit.Status}
                            </Chip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-200 shadow-inner">
                    <History className="w-8 h-8" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Previous Visits</p>
                    <p className="text-[10px] text-gray-300 italic">Historical log is empty.</p>
                  </div>
                </div>
              )
            )}
          </CardBody>
        </Card>
      </div>

      <VisitDetailsModal
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        visit={selectedVisit}
        isProcessing={isActioning !== null}
        onApprove={async (id) => {
          await handleAction(id, 'approve');
          setIsDetailsOpen(false);
        }}
        onReject={async (id, reason) => {
          await handleAction(id, 'reject');
          setIsDetailsOpen(false);
        }}
      />
    </div>
  );
}