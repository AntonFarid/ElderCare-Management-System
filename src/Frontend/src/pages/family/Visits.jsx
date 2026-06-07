import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Spinner,
  useDisclosure,
  Divider
} from "@heroui/react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  User, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { familyApiServices } from "../../services/Family/FamilyApi";
import VisitModal from "../../components/Family/VisitModal";
import { addToast } from "@heroui/toast";

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedVisitId, setSelectedVisitId] = useState(null);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setIsLoading(true);
    try {
      const response = await familyApiServices.getVisits();
      if (response.data.succeeded) {
        // Handle paginated response
        const visitsList = response.data.data.data || response.data.data;
        setVisits(Array.isArray(visitsList) ? visitsList : []);
      }
    } catch (error) {
      console.error("Failed to fetch visits:", error);
      addToast({ title: "Error", description: "Failed to load visits schedule", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id) => {
    setSelectedVisitId(id);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedVisitId(null);
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled visit?")) return;

    try {
      const res = await familyApiServices.deleteVisit(id);
      if (res.data.succeeded) {
        addToast({ title: "Cancelled", description: "Visit has been successfully cancelled", color: "success" });
        fetchVisits();
      }
    } catch (error) {
      console.error("Failed to delete visit:", error);
      addToast({ title: "Error", description: "Failed to cancel visit", color: "danger" });
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr, timeStr) => {
    if (!dateStr && !timeStr) return "N/A";
    // If we have a timeStr (separate field), use it. Otherwise try to extract from dateStr.
    let combined;
    if (timeStr) {
        combined = `${dateStr.split('T')[0].split(' ')[0]}T${timeStr}`;
    } else {
        combined = dateStr.includes(' ') || dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
    }
    return new Date(combined).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
            Visits <span className="text-blue-600">&</span> Schedules
          </h1>
          <p className="text-gray-400 mt-3 font-bold uppercase text-[10px] tracking-[0.2em]">Coordinate clinical artifact observations</p>
        </div>
        <Button 
          color="primary" 
          startContent={<Plus className="w-4 h-4" />}
          className="bg-blue-600 shadow-xl shadow-blue-100 font-bold uppercase text-[10px] tracking-widest h-14 px-10 rounded-full"
          onPress={handleCreate}
        >
          Schedule Visit
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] animate-pulse">Syncing Protocols...</p>
        </div>
      ) : visits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {visits.map((visit) => (
            <Card key={visit.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden group">
              <CardBody className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
                        {visit.ElderlyName || "Resident Visit"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip size="sm" variant="flat" color={isFuture(visit.requestedDate || visit.RequestedDate, visit.requestedTime || visit.RequestedTime) ? "primary" : "default"} className="font-bold text-[9px] uppercase tracking-widest border-none h-5">
                          {isFuture(visit.requestedDate || visit.RequestedDate, visit.requestedTime || visit.RequestedTime) ? "Upcoming" : "Past"}
                        </Chip>
                        <Chip 
                          size="sm" 
                          variant="dot" 
                          color={
                            (visit.status || visit.Status) === 'Approved' ? 'success' : 
                            (visit.status || visit.Status) === 'Pending' ? 'warning' : 'danger'
                          } 
                          className="font-bold text-[9px] uppercase tracking-widest border-none h-5"
                        >
                          {visit.status || visit.Status || "Pending"}
                        </Chip>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {visit.status === 'Pending' && (
                      <>
                        <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-blue-500" onPress={() => handleEdit(visit.id)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-red-500" onPress={() => handleDelete(visit.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {formatDate(visit.requestedDate || visit.RequestedDate)} at {formatTime(visit.requestedDate || visit.RequestedDate, visit.requestedTime || visit.RequestedTime)}
                    </span>
                  </div>
                  {visit.roomNumber && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Room {visit.roomNumber}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span className="text-xs text-gray-500 italic max-w-sm">
                      {visit.notes || "No additional context provided for this visit."}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-none bg-gray-50 dark:bg-gray-800/20 rounded-[40px] py-32">
          <CardBody className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-200 shadow-sm">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em]">No visits scheduled</h3>
              <p className="text-xs text-gray-300 italic max-w-xs leading-relaxed">Schedule a synchronization event to observe clinical progress in person.</p>
            </div>
            <Button 
                variant="flat" 
                className="mt-4 font-bold uppercase tracking-widest text-[10px] px-8 h-12 rounded-full"
                onPress={handleCreate}
            >
                Schedule First Visit
            </Button>
          </CardBody>
        </Card>
      )}

      <VisitModal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        visitId={selectedVisitId}
        onSuccess={fetchVisits}
      />
    </div>
  );
}
