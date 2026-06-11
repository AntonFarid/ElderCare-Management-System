import axios from "axios";

class EmployeeApiServices {

    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    // Get all assigned elderly
    async getAssignedElderly() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Employee/assigned-elderly", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get assigned elderly by ID
    async getAssignedElderlyById(elderlyId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Employee/assigned-elderly/${elderlyId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get reports (with optional filters and pagination)
    async getReports(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Employee/reports", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Get a specific report by ID
    async getReportById(reportId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Employee/reports/${reportId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Create a new report
    async createReport(reportData) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Employee/reports", reportData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Update an existing report
    async updateReport(reportId, reportData) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + `Employee/reports/${reportId}`, reportData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get full schedule
    async getSchedule(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Employee/schedule", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Get today's schedule
    async getTodaySchedule() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Employee/schedule/today", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get reports summary
    async getReportsSummary() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Employee/reports/summary", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // ── Tasks ──────────────────────────────────────────────────────────────

    //     Returns the list of pending (incomplete) tasks for the logged-in employee.
    async getPendingTasks() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Employee/tasks/pending", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    //     Returns a daily task summary (totalTasks, completedTasks, pendingTasks,
    //     completionRate, tasks[]).
    async getTasksSummary(date = null) {
        const params = date ? { date } : {};
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Employee/tasks/summary", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    //     Marks the specified task as completed.
    async completeTask(taskId) {
        const response = await axios.post(
            import.meta.env.VITE_BASE_URL + `Employee/tasks/${taskId}/complete`,
            {},                               // no request body needed
            { headers: this.#getAuthHeaders() }
        );
        return response;
    }

    // Get AI diet recommendation for resident
    async getDietRecommendation(elderlyId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Employee/assigned-elderly/${elderlyId}/diet-recommendation`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

}


export const employeeApiServices = new EmployeeApiServices();
