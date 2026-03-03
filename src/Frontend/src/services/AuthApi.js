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


    // signIn function
    async signIn(loginData) {
        const response = await axios.post(import.meta.env.VITE_BASE_URL + "Auth/login", loginData);
        return response;
    }

    //   // Change Password function (Authenticated)
    //     async changePassword(passwords) {
    //         const response = await axios.patch(import.meta.env.VITE_BASE_URL + "/users/change-password", passwords, {
    //             headers: {
    //                 token: this.#token
    //             }
    //         });
    //         return response;
    //     }




}


export const apiServices = new ApiServices();
