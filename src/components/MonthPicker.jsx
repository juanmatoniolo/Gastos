// src/components/MonthPicker.jsx
"use client";
import dynamic from "next/dynamic";

const DatePickerClient = dynamic(() => import("./DatePickerClient"), {
    ssr: false,
    loading: () => (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-center text-gray-500 text-base animate-pulse min-h-11">
            …
        </div>
    ),
});

export default function MonthPicker({ value, onChange, className }) {
    return (
        <div className={`relative ${className ?? ""}`}>
            <DatePickerClient value={value} onChange={onChange} />
        </div>
    );
}