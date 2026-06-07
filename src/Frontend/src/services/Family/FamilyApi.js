import axios from "axios";

class FamilyApiServices {

    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    // Get all elderly residents linked to the family member
    async getLinkedElderly() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Family/linked-elderly", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get detailed information for a specific elderly resident
    async getElderlyDetails(elderlyId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Family/linked-elderly/${elderlyId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get reports summary for an elderly
    async getReportsSummary(elderlyId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Family/elderly/${elderlyId}/reports/summary`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get detailed list of approved reports for an elderly
    async getApprovedReports(elderlyId, params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Family/elderly/${elderlyId}/reports`, {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Get a specific report by ID
    async getReportById(reportId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Family/reports/${reportId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get health trends for an elderly
    async getHealthTrends(elderlyId, fromDate = null, toDate = null) {
        const params = {};
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Family/elderly/${elderlyId}/health-trends`, {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Get metric-specific trends for an elderly
    async getMetricTrends(elderlyId, metricType) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Family/elderly/${elderlyId}/metric-trends/${metricType}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get notification summary
    async getNotificationSummary() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Family/notifications/summary", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get all notifications
    async getNotifications(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Family/notifications", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + `Family/notifications/${notificationId}/read`, {}, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Mark all notifications as read
    async markAllNotificationsAsRead() {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Family/notifications/read-all", {}, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get dashboard data
    async getDashboardData() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Family/dashboard", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Visits Management
    async getVisits(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Family/visits", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    async getVisitById(visitId) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Family/visits/${visitId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    async createVisit(visitData) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Family/visits", visitData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    async updateVisit(visitId, visitData) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + `Family/visits/${visitId}`, visitData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    async deleteVisit(visitId) {
        const response = await axios.delete(import.meta.env.VITE_BASE_URL + `Family/visits/${visitId}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }
}

export const familyApiServices = new FamilyApiServices();
