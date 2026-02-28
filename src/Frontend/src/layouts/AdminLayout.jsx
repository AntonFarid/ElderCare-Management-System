// src/layouts/FamilyLayout.jsx
import React from 'react'
import AdminNavBar from '../components/NavBars/AdminNavBar'
import Footer from '../components/Footers/Footer'
import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <AdminNavBar />

            <main className="flex-1 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet />
                </div>
            </main>
            <Footer />


        </div>
    )
}