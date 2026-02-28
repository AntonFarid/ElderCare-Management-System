
import React, { createContext, useState } from "react";

export const AuthContext = createContext(0);

export default function AuthContextProvider({ children }) {

    const [UserToken, setUserToken] = useState(localStorage.getItem("token"));
    return <AuthContext.Provider value={{ UserToken, setUserToken }}>
        {children}
    </AuthContext.Provider>


}