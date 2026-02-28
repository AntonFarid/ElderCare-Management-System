import React from 'react'
import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className='min-h-screen flex justify-center items-center'>
        <div className="border-2 border-gray-400 px-4 py-8 rounded-2xl min-w-100 shadow-xl">
      
      
        <Outlet />
    </div></div>
  )
}
