import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL + "Admin/";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const adminVisitsApiServices = {
    // Get all visits with optional query parameters (FromDate, ToDate, Status)
    getAllVisits: async (params = {}) => {
        try {
            const response = await axios.get(`${BASE_URL}visits`, {
                ...getAuthHeaders(),
                params: {
                    PageNumber: 1,
                    PageSize: 1000,
                    ...params
                }
            });
            return response;
        } catch (error) {
            console.error("Error fetching all visits:", error);
            throw error;
        }
    }
};
