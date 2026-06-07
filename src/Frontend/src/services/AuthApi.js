import axios from "axios";

class ApiServices {

    #token;
    setToken(token) {
        this.#token = token;
    }

    #getAuthHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        };
    }

    // Maps a role string to its API route prefix
    // e.g. "Admin" → "Admin", "Employee" | "TeamLeader" → "Employee", "FamilyMember" → "Family"
    #roleToPrefix(role) {
        if (!role) return "Employee"; // safe default
        if (role === "Admin") return "Admin";
        if (role === "FamilyMember") return "Family";
        if (role === "TeamLeader") return "TeamLeader";
        return "Employee"; // Employee
    }

    // ── Sign up / Sign in ────────────────────────────────────────────────

    // signUp function
    async familySignUp(registerData) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "auth/register/family", registerData);
        return response;
    }


    // signIn function
    async signIn(loginData) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Auth/login", loginData);
        return response;
    }

    // ── Password ─────────────────────────────────────────────────────────

    // Forgot Password
    async forgotPassword(email) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Auth/forgot-password", { email });
        return response;
    }

    // Reset Password
    async resetPassword(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Auth/reset-password", data);
        return response;
    }

    // Change Password (Authenticated - shared across all roles)
    async changePassword(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Auth/change-password", data, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // ── Profile (shared across all roles) ────────────────────────────────

    // GET  /api/{prefix}/profile
    // @param {string} role - "Admin" | "Employee" | "TeamLeader" | "FamilyMember"
    async getProfile(role) {
        const prefix = this.#roleToPrefix(role);
        const response = await axios.get(import.meta.env.VITE_BASE_URL + `${prefix}/profile`, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

    // PUT  /api/{prefix}/profile
    // @param {string} role       - "Admin" | "Employee" | "TeamLeader" | "FamilyMember"
    // @param {object} profileData - the updated profile payload
    async updateProfile(role, profileData) {
        const prefix = this.#roleToPrefix(role);
        const response = await axios.put(import.meta.env.VITE_BASE_URL + `${prefix}/profile`, profileData, {
            headers: this.#getAuthHeaders()
        });
        return response;
    }

}


export const apiServices = new ApiServices();

