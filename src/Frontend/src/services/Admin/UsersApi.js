import axios from "axios";

class UsersApiServices {

    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    // Get admin profile
    async getAdminProfile() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/profile", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Update admin profile
    async updateAdminProfile(profileData) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + "Admin/profile", profileData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get all users
    async getAllUsers(params) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/users", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Get user by ID
    async getUserById(id) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Admin/users/${id}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Create a new user
    async createUser(userData) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Admin/users", userData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Update a user by ID
    async updateUser(id, userData) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + `Admin/users/${id}`, userData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get system statistics
    async getStatistics() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/statistics", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get audit logs (optional filters: fromDate, toDate, entityType, entityId)
    async getAuditLogs(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/audit-logs", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Get activity summary for a specific date
    async getActivitySummary(date) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/activity-summary", {
            headers: this.#getAuthHeaders(),
            params: date ? { date } : {}
        });
        return response;
    }

    // Get dashboard data (statistics, recent activity, charts, etc.)
    async getDashboardData() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/dashboard", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Delete a user by ID
    async deleteUser(id) {
        const response = await axios.delete(import.meta.env.VITE_BASE_URL + `Admin/users/${id}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }
}


export const usersApiServices = new UsersApiServices();
