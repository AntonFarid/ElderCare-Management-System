// src/layouts/EmployeeLayout.jsx
import React from 'react'
import EmployeeNavBar from '../components/NavBars/EmployeeNavBar'
import Footer from '../components/Footers/Footer'
import { Outlet } from 'react-router-dom'

export default function EmployeeLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <EmployeeNavBar />

            <main className="flex-1 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet />
                </div>
            </main>

            <Footer />
        </div>
    )
}