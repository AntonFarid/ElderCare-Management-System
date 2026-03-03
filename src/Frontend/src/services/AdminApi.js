import axios from "axios";

class AdminApiServices {

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

    // Delete a user by ID
    async deleteUser(id) {
        const response = await axios.delete(import.meta.env.VITE_BASE_URL + `Admin/users/${id}`, {
            headers: this.#getAuthHeaders()
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

    // Update a user by ID
    async updateUser(id, userData) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + `Admin/users/${id}`, userData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Get all users
    async getAllUsers() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/users", {
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

    // Get all elderly
    async getAllElderly(params) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/elderly", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Get all employee-elderly assignments
    async getAllEmployeeElderlyAssignments(params) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/assignments/employee-elderly", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

}

export const adminApiServices = new AdminApiServices();
