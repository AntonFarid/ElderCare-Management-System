import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Spinner
} from "@heroui/react";
import { Calendar as CalendarIcon, Clock, StickyNote, User, AlertCircle } from "lucide-react";
import { familyApiServices } from "../../services/Family/FamilyApi";
import { addToast } from "@heroui/toast";

export default function VisitModal({ isOpen, onOpenChange, visitId, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [residents, setResidents] = useState([]);
  const [formData, setFormData] = useState({
    elderlyId: "",
    visitDate: "",
    visitTime: "",
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchResidents();
      if (visitId) {
        fetchVisitDetail();
      } else {
        setFormData({
            elderlyId: "",
            visitDate: "",
            visitTime: "",
            notes: ""
          });
      }
    }
  }, [isOpen, visitId]);

  const fetchResidents = async () => {
    try {
      const res = await familyApiServices.getLinkedElderly();
      if (res.data.succeeded) {
        setResidents(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch residents:", error);
    }
  };

  const fetchVisitDetail = async () => {
    setIsLoading(true);
    try {
      const res = await familyApiServices.getVisitById(visitId);
      if (res.data.succeeded) {
        const visit = res.data.data;
        // The backend returns requestedDate (date part) and startTime (time part)
        setFormData({
          elderlyId: String(visit.elderlyId),
          visitDate: visit.requestedDate ? visit.requestedDate.split("T")[0] : "",
          visitTime: visit.startTime ? visit.startTime.slice(0, 5) : "",
          notes: visit.notes || ""
        });
      }
    } catch (error) {
      console.error("Failed to fetch visit detail:", error);
      addToast({ title: "Error", description: "Could not load visit details", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.elderlyId || !formData.visitDate || !formData.visitTime) {
      addToast({ title: "Warning", description: "Please fill in all required fields", color: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a local date-time string in ISO format but WITHOUT the 'Z' 
      // so the server treats it as local time, not UTC.
      const localDateTime = `${formData.visitDate}T${formData.visitTime}:00`;
      
      const payload = {
        ElderlyId: parseInt(formData.elderlyId),
        RequestedDate: formData.visitDate,
        RequestedTime: `${formData.visitTime}:00`, // Confirmed field name in DTO
        DurationMinutes: 60,
        Notes: formData.notes
      };

      if (visitId) {
        await familyApiServices.updateVisit(visitId, payload);
        addToast({ title: "Success", description: "Visit updated successfully", color: "success" });
      } else {
        await familyApiServices.createVisit(payload);
        addToast({ title: "Success", description: "Visit scheduled successfully", color: "success" });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save visit:", error);
      
      let errorMessage = "Failed to save visit. Please try again.";
      if (error.response?.data) {
        const data = error.response.data;
        if (data.errors) {
            errorMessage = Object.entries(data.errors)
                .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
                .join(" | ");
        } else if (data.message) {
            errorMessage = data.message;
        }
      }
      
      addToast({ title: "Error", description: errorMessage, color: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size="lg"
        classNames={{
            base: "bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden",
            header: "border-b border-gray-100 dark:border-gray-800 p-6",
            footer: "border-t border-gray-100 dark:border-gray-800 p-6"
        }}
    >
      <ModalContent>
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Details...</p>
          </div>
        ) : (
          <>
            <ModalHeader>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">
                {visitId ? "Edit Scheduled Visit" : "Schedule New Visit"}
              </h2>
            </ModalHeader>
            <ModalBody className="p-6 space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl flex items-start gap-3 border border-amber-100 dark:border-amber-900/20">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-tight leading-relaxed">
                  Notice: Visit requests remain in <span className="underline">Pending</span> status until verified and approved by a Team Leader.
                </p>
              </div>

              <Select
                label="Resident"
                placeholder="Who are you visiting?"
                selectedKeys={formData.elderlyId ? [formData.elderlyId] : []}
                onSelectionChange={(keys) => setFormData({ ...formData, elderlyId: [...keys][0] })}
                startContent={<User className="w-4 h-4 text-gray-400" />}
              >
                {residents.map((r) => (
                  <SelectItem key={String(r.id)} textValue={r.fullName || `${r.firstName} ${r.lastName}`}>
                    {r.fullName || `${r.firstName} ${r.lastName}`}
                  </SelectItem>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
                />
                <Input
                  type="time"
                  label="Time"
                  value={formData.visitTime}
                  onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                  startContent={<Clock className="w-4 h-4 text-gray-400" />}
                />
              </div>

              <Textarea
                label="Notes (Optional)"
                placeholder="Any specific context or purpose for this visit?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                startContent={<StickyNote className="w-4 h-4 text-gray-400 mt-2" />}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => onOpenChange(false)} className="font-bold uppercase tracking-widest text-[10px]">
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleSubmit} 
                isLoading={isSubmitting}
                className="font-bold uppercase tracking-widest text-[10px] px-8 rounded-full"
              >
                {visitId ? "Update Schedule" : "Confirm Schedule"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
