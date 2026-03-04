import axios from "axios";

class EldersApiServices {

    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    // Get all elderly
    async getAllElderly(params) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Admin/elderly", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Get elderly by ID
    async getElderlyById(id) {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `Admin/elderly/${id}`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Create a new elderly
    async createElderly(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Admin/elderly", data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Update elderly by ID
    async updateElderly(id, data) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + `Admin/elderly/${id}`, data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // Delete an elderly by ID
    async deleteElderly(id) {
        const response = await axios.delete(import.meta.env.VITE_BASE_URL + `Admin/elderly/${id}`, {
            headers: this.#getAuthHeaders()
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

    // Assign employee to elderly (POST)
    async assignEmployeeToElderly(params) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Admin/assignments/employee-elderly", null, {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Update employee-elderly primary assignment
    async updateEmployeeElderlyPrimary(params) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + "Admin/assignments/employee-elderly/primary", null, {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Remove employee-elderly assignment (DELETE)
    async removeEmployeeAssignment(params) {
        const response = await axios.delete(import.meta.env.VITE_BASE_URL + "Admin/assignments/employee-elderly", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Assign family member to elderly (POST)
    async assignFamilyToElderly(params) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Admin/assignments/family", null, {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Update family assignment
    async updateFamilyAssignment(params) {
        const response = await axios.put(import.meta.env.VITE_BASE_URL + "Admin/assignments/family", null, {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }

    // Remove family assignment (DELETE)
    async removeFamilyAssignment(params) {
        const response = await axios.delete(import.meta.env.VITE_BASE_URL + "Admin/assignments/family", {
            headers: this.#getAuthHeaders(),
            params
        });
        return response;
    }
}

export const eldersApiServices = new EldersApiServices();
