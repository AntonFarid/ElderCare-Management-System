import React from 'react';
import { FileTextIcon } from "lucide-react";

export default function Reports() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3 mb-2">
                <FileTextIcon className="w-8 h-8 text-blue-500" />
                Admin Reports
            </h1>
            <p className="text-gray-500">Welcome to the Admin Reports. Use the navigation bar to manage residents, reports, and your schedule.</p>
        </div>
    );
}
