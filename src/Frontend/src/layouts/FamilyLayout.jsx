// src/layouts/FamilyLayout.jsx
import React from 'react'
import NavBar from '../components/NavBars/NavBar'
import Footer from '../components/Footers/Footer'
import { Outlet } from 'react-router-dom'

export default function FamilyLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}