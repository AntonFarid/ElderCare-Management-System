import axios from "axios";

class ApiServices {

    #token;
    setToken(token) {
        this.#token = token;
    }


    // signUp function
    async familySignUp(registerData) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "auth/register/family", registerData);
        return response;
    }

    // Get all elderly (public, for sign-up form - no auth required)
    async getAllElderly() {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + "Auth/elderly-list");
        return response;
    }


    // signIn function
    async signIn(loginData) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Auth/login", loginData);
        return response;
    }

    // Change Password (Authenticated - shared across all roles)
    async changePassword(data) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Auth/change-password", data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        return response;
    }




}


export const apiServices = new ApiServices();
