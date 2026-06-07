import axios from "axios";

class AdminDashboardApiServices {
    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    // Get admin dashboard data
    async getDashboardData() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/dashboard", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get system statistics
    async getSystemStatistics() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/statistics", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get activity summary
    async getActivitySummary(date = null) {
        const params = {};
        if (date) params.date = date;
        
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/activity-summary", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }
}

export const adminDashboardApiServices = new AdminDashboardApiServices();
