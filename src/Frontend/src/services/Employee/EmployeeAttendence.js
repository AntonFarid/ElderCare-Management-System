import axios from "axios";

class EmployeeAttendanceServices {
    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    async getAttendanceStatus() {
        return await axios.get(`${import.meta.env.VITE_BASE_URL}Employee/attendance/status`, { headers: this.#getAuthHeaders() });
    }

    async clockIn() {
        return await axios.post(`${import.meta.env.VITE_BASE_URL}Employee/attendance/clock-in`, {}, { headers: this.#getAuthHeaders() });
    }

    async clockOut() {
        return await axios.post(`${import.meta.env.VITE_BASE_URL}Employee/attendance/clock-out`, {}, { headers: this.#getAuthHeaders() });
    }
}

export const employeeAttendanceServices = new EmployeeAttendanceServices();
