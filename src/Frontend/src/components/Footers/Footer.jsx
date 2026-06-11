// src/components/layout/Family/FamilyFooter.jsx
import React from 'react';
import { HeartHandshake, Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function FamilyFooter() {
    const currentYear = new Date().getFullYear();
    const location = useLocation();

    // Determine dashboard path and quick links based on active path prefix
    let dashboardPath = '/family/home';
    const quickLinks = [];

    if (location.pathname.startsWith('/admin')) {
        dashboardPath = '/admin/dashboard';
        quickLinks.push(
            { name: 'Dashboard', path: '/admin/dashboard' },
            { name: 'Users Management', path: '/admin/users' },
            { name: 'Elders Management', path: '/admin/elders' },
            { name: 'Profile', path: '/admin/profile' }
        );
    } else if (location.pathname.startsWith('/teamleader')) {
        dashboardPath = '/teamleader/dashboard';
        quickLinks.push(
            { name: 'Dashboard', path: '/teamleader/dashboard' },
            { name: 'Residents Directory', path: '/teamleader/residents' },
            { name: 'Employees Directory', path: '/teamleader/employees' },
            { name: 'Profile', path: '/teamleader/profile' }
        );
    } else if (location.pathname.startsWith('/employee')) {
        dashboardPath = '/employee/dashboard';
        quickLinks.push(
            { name: 'Dashboard', path: '/employee/dashboard' },
            { name: 'Residents List', path: '/employee/residents' },
            { name: 'Tasks List', path: '/employee/tasks' },
            { name: 'Profile', path: '/employee/profile' }
        );
    } else {
        // Default to Family
        dashboardPath = '/family/home';
        quickLinks.push(
            { name: 'Home', path: '/family/home' },
            { name: 'Loved Ones', path: '/family/loved-ones' },
            { name: 'Daily Updates', path: '/family/dailyupdates' },
            { name: 'Profile', path: '/family/profile' }
        );
    }

    const legalLinks = [
        { name: 'Privacy Policy', path: dashboardPath },
        { name: 'Terms of Service', path: dashboardPath },
        { name: 'Cookie Settings', path: dashboardPath },
    ];

    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        {/* Logo and Name (Links to current role dashboard) */}
                        <Link to={dashboardPath} className="flex items-center gap-3 mb-4 hover:opacity-90 transition-opacity">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                                <HeartHandshake className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Sanad</h2>
                        </Link>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Caring with compassion. Providing a safe and comfortable home environment with specialized medical care for your loved ones.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-gray-900 font-semibold mb-4 text-sm uppercase tracking-wider">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-gray-900 font-semibold mb-4 text-sm uppercase tracking-wider">
                            Legal
                        </h3>
                        <ul className="space-y-3">
                            {legalLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Us Section */}
                    <div>
                        <h3 className="text-gray-900 font-semibold mb-4 text-sm uppercase tracking-wider">
                            Contact Us
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                                    123 Care Avenue,<br />
                                    Wellness District, NY 10012
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <a href="tel:1-800-SANAD-CARE" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                                    1-800-SANAD-CARE
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <a href="mailto:support@sanad.com" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                                    support@sanad.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Copyright */}
                        <p className="text-gray-500 text-sm">
                            © {currentYear} Sanad Senior Care Management. All rights reserved.
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center gap-3">
                            <a
                                href="#"
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-600 flex items-center justify-center transition-all group"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </a>

                            <a
                                href="#"
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-400 flex items-center justify-center transition-all group"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </a>

                            <a
                                href="#"
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-pink-600 flex items-center justify-center transition-all group"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </a>

                            <a
                                href="#"
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-700 flex items-center justify-center transition-all group"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}