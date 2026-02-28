import React from 'react'
import { Navigate } from 'react-router-dom';


export default function ProtectedAuthRoutes({children}) {

    const isLoggedIn = !! localStorage.getItem("token")
  return (
    <>
    {isLoggedIn ? <Navigate to="./NotFound"/> :  children}
      
    </>
  )
}
