import axios from "axios";

class TeamLeaderApiServices {

    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    // ── Profile ───────────────────────────────────────────────────────────
    // GET  /api/TeamLeader/profile  → use AuthApi.getProfile('TeamLeader')
    // PUT  /api/TeamLeader/profile  → use AuthApi.updateProfile('TeamLeader', data)

    // ── Elderly ───────────────────────────────────────────────────────────

    // GET /api/TeamLeader/elderly
    async getElderly() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/elderly", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // ── Reports ───────────────────────────────────────────────────────────

    // GET /api/TeamLeader/reports/pending
    async getPendingReports(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/reports/pending", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // GET /api/TeamLeader/reports/{reportId}
    async getReportById(reportId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `TeamLeader/reports/${reportId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // POST /api/TeamLeader/reports/approve
    async approveReport(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "TeamLeader/reports/approve", data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // POST /api/TeamLeader/reports/reject
    async rejectReport(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "TeamLeader/reports/reject", data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // GET /api/TeamLeader/reports/summary
    async getReportsSummary() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/reports/summary", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // GET /api/TeamLeader/reports/approval-history
    async getApprovalHistory(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/reports/approval-history", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // ── Employees ─────────────────────────────────────────────────────────

    // GET /api/TeamLeader/employees
    async getEmployees(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/employees", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // GET /api/TeamLeader/employees/{employeeId}
    async getEmployeeById(employeeId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `TeamLeader/employees/${employeeId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // GET /api/TeamLeader/employees/{employeeId}/performance
    async getEmployeePerformance(employeeId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `TeamLeader/employees/${employeeId}/performance`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // GET /api/TeamLeader/employees/performance-summary
    async getPerformanceSummary(date, endDate) {
        const params = {};
        if (date) params.date = date;
        if (endDate) params.endDate = endDate;
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/employees/performance-summary", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // ── Attendance ────────────────────────────────────────────────────────

    // GET /api/TeamLeader/attendance
    async getAttendance(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/attendance", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // GET /api/TeamLeader/attendance/summary
    async getAttendanceSummary() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/attendance/summary", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // GET /api/TeamLeader/attendance/current-status
    async getAttendanceCurrentStatus() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/attendance/current-status", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // ── Elderly/Residents ──────────────────────────────────────────────────
    
    // GET /api/TeamLeader/elderly
    async getAllElderly() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/elderly", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // ── Schedules ─────────────────────────────────────────────────────────

    // GET /api/TeamLeader/schedules
    async getSchedules(startDate, endDate, employeeId) {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (employeeId) params.employeeId = employeeId;
        
        return await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/schedules", {
            headers: this.#getAuthHeaders(),
            params
        });
    }

    // POST /api/TeamLeader/schedules
    async createSchedule(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "TeamLeader/schedules", data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // PUT /api/TeamLeader/schedules/{scheduleId}
    async updateSchedule(scheduleId, data) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + `TeamLeader/schedules/${scheduleId}`, data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // DELETE /api/TeamLeader/schedules/{scheduleId}
    async deleteSchedule(scheduleId) {
        const response = await axios.delete(import.meta.env.VITE_BASE_URL + `TeamLeader/schedules/${scheduleId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // GET /api/TeamLeader/schedules/today-summary
    async getTodayScheduleSummary() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/schedules/today-summary", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // ── Visits ────────────────────────────────────────────────────────────

    // GET /api/TeamLeader/visits/pending
    async getPendingVisits() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/visits/pending", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // GET /api/TeamLeader/visits/{visitId}
    async getVisitById(visitId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `TeamLeader/visits/${visitId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // POST /api/TeamLeader/visits/approve
    async approveVisit(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "TeamLeader/visits/approve", data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // POST /api/TeamLeader/visits/reject
    async rejectVisit(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "TeamLeader/visits/reject", data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // GET /api/TeamLeader/visits/summary
    async getVisitsSummary() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "TeamLeader/visits/summary", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }
    // ── Gemini AI Services ────────────────────────────────────────────────

    // POST /api/GeminiTest/test-patterns
    async getHealthPatterns(elderlyId) {
        // Ensuring we send the numeric ID precisely
        const id = parseInt(elderlyId);
        return await axios.post(import.meta.env.VITE_BASE_URL + "GeminiTest/test-patterns", { elderlyId: id }, {
            headers: this.#getAuthHeaders()
        });
    }

    // GET /api/GeminiTest/diagnose
    async getResidentDiagnosis(elderlyId) {
        const id = parseInt(elderlyId);
        return await axios.get(import.meta.env.VITE_BASE_URL + "GeminiTest/diagnose", {
            headers: this.#getAuthHeaders(),
            params: { elderlyId: id }
        });
    }

    // GET /api/TeamLeader/elderly/{elderlyId}/diet-recommendation
    async getDietRecommendation(elderlyId) {
        const id = parseInt(elderlyId);
        return await axios.get(import.meta.env.VITE_BASE_URL + `TeamLeader/elderly/${id}/diet-recommendation`, {
            headers: this.#getAuthHeaders()
        });
    }
}

export const teamLeaderApiServices = new TeamLeaderApiServices();
