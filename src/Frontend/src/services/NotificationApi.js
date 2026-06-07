import axios from "axios";

class NotificationApiServices {

    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    // Get notification summary (unread count)
    async getNotificationSummary() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Notification/summary", {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get all notifications
    async getNotifications(params = {}) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Notification", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + `Notification/${notificationId}/read`, {}, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Mark all notifications as read
    async markAllNotificationsAsRead() {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Notification/read-all", {}, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }
}

export const notificationApiServices = new NotificationApiServices();
