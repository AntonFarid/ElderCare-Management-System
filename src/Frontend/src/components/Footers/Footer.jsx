// src/components/layout/Family/FamilyFooter.jsx
import React from 'react';
import { HeartHandshake, Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FamilyFooter() {
    const currentYear = new Date().getFullYear();

    const supportLinks = [
        { name: 'Help Center', path: '/help' },
        { name: 'Contact Support', path: '/contact' },
        { name: 'FAQs', path: '/faq' },
    ];

    const communityLinks = [
        { name: 'Community Guidelines', path: '/community-guidelines' },
        { name: 'Family Forum', path: '/forum' },
        { name: 'Events Calendar', path: '/events' },
    ];

    const legalLinks = [
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
        { name: 'Cookie Settings', path: '/cookies' },
    ];

    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        {/* Logo and Name */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                                <HeartHandshake className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Sanad</h2>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Caring with compassion. Providing a safe and comfortable home environment with specialized medical care for your loved ones.
                        </p>
                    </div>


                    {/* Community Links */}
                    <div>
                        <h3 className="text-gray-900 font-semibold mb-4 text-sm uppercase tracking-wider">
                            Community
                        </h3>
                        <ul className="space-y-3">
                            {communityLinks.map((link) => (
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
                                <a href="tel:1-800-SANAD" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                                    1-800-SANAD
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

                            {/* Social Icons */}
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
                    </div >
                </div >
            </div >
        </footer >
    );
}