// src/components/MonthPicker.jsx
"use client";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import { parse, format } from "date-fns";

registerLocale("es", es);

export default function MonthPicker({ value, onChange, className }) {
    const dateValue = value ? parse(value, "yyyy-MM", new Date()) : new Date();

    const handleChange = (date) => {
        if (date) onChange(format(date, "yyyy-MM"));
    };

    return (
        <div className={`relative ${className ?? ""}`}>
            <DatePicker
                selected={dateValue}
                onChange={handleChange}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                locale="es"
                className="bg-gray-800 text-white p-2.5 rounded-xl border border-gray-700 font-medium focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer w-full text-center capitalize text-base min-h-11"
                calendarClassName="custom-calendar-dark"
                popperClassName="custom-popper"
                popperPlacement="bottom-end"
            />
        </div>
    );
}