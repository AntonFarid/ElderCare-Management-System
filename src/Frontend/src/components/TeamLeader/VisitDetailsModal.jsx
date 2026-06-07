import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  User as UserComponent,
  Input,
  Textarea,
  Divider
} from "@heroui/react";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  StickyNote, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText
} from "lucide-react";

export default function VisitDetailsModal({ 
    isOpen, 
    onOpenChange, 
    visit, 
    onApprove, 
    onReject,
    isProcessing 
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  if (!visit) return null;

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
    let combined;
    if (timeStr) {
        combined = `${dateStr.split('T')[0].split(' ')[0]}T${timeStr}`;
    } else {
        combined = dateStr.includes(' ') || dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
    }
    return new Date(combined).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size="2xl"
        classNames={{
            base: "bg-white dark:bg-gray-900 rounded-[40px] overflow-hidden shadow-2xl",
            header: "border-b border-gray-50 dark:border-gray-800 p-8",
            footer: "border-t border-gray-50 dark:border-gray-800 p-8"
        }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">Visit Authorization</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Reference #{visit.id}</p>
                </div>
            </div>
          </ModalHeader>
          <ModalBody className="p-8 space-y-8">
            {/* Split View: Resident & Family */}
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Resident Detail</p>
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800">
                        <UserComponent
                            name={visit.elderlyName || visit.ElderlyName}
                            description={
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Room {visit.roomNumber || visit.RoomNumber || 'N/A'}</span>
                                </div>
                            }
                            avatarProps={{ radius: "lg", size: "lg", className: "bg-emerald-100 text-emerald-600 font-bold" }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Kinship Identification</p>
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800">
                        <UserComponent
                            name={visit.familyMemberName || visit.FamilyMemberName}
                            description={<span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Verified Family Account</span>}
                            avatarProps={{ radius: "lg", size: "lg", className: "bg-blue-100 text-blue-600 font-bold" }}
                        />
                    </div>
                </div>
            </div>

            {/* Schedule Info */}
            <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Visit Parameters</p>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-2xl flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase">
                            <Calendar className="w-3.5 h-3.5" /> Date
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {formatDate(visit.requestedDate || visit.RequestedDate)}
                        </p>
                    </div>
                    <div className="bg-purple-50/30 dark:bg-purple-900/10 p-4 rounded-2xl flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-purple-500 uppercase">
                            <Clock className="w-3.5 h-3.5" /> Time
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {formatTime(visit.requestedDate || visit.RequestedDate, visit.requestedTime || visit.RequestedTime || visit.startTime || visit.StartTime)}
                        </p>
                    </div>
                    <div className="bg-amber-50/30 dark:bg-amber-900/10 p-4 rounded-2xl flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                            <StickyNote className="w-3.5 h-3.5" /> Duration
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {visit.durationMinutes || visit.DurationMinutes || 60} Minutes
                        </p>
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            {(visit.notes || visit.Notes) && (
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Request Justification / Notes</p>
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                            "{visit.notes || visit.Notes}"
                        </p>
                    </div>
                </div>
            )}

            {showRejectionInput && (
                <div className="animate-in slide-in-from-top-4 duration-300 space-y-4">
                    <Textarea 
                        label="Rejection Reason"
                        placeholder="Please specify why this visit is being denied..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        variant="flat"
                        classNames={{
                            inputWrapper: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 rounded-2xl"
                        }}
                    />
                    <div className="flex gap-3">
                        <Button 
                            className="flex-1 bg-red-600 text-white font-bold h-12 rounded-2xl shadow-lg shadow-red-500/20"
                            onPress={() => onReject(visit.id, rejectionReason)}
                            isLoading={isProcessing}
                        >
                            Confirm Denial
                        </Button>
                        <Button 
                            variant="flat"
                            className="h-12 rounded-2xl font-bold"
                            onPress={() => setShowRejectionInput(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
          </ModalBody>
          <ModalFooter className="flex gap-4">
            {!showRejectionInput && (
                <>
                    <Button 
                        variant="flat" 
                        color="danger" 
                        className="flex-1 h-14 rounded-3xl font-black uppercase tracking-widest text-[10px]"
                        onPress={() => setShowRejectionInput(true)}
                    >
                        <XCircle className="w-4 h-4 mr-2" /> Deny Access
                    </Button>
                    <Button 
                        color="primary" 
                        className="flex-1 h-14 rounded-3xl font-black uppercase tracking-widest text-[10px] bg-blue-600 shadow-xl shadow-blue-500/20"
                        onPress={() => onApprove(visit.id)}
                        isLoading={isProcessing}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Visit
                    </Button>
                </>
            )}
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
