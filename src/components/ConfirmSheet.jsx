// src/components/ConfirmSheet.jsx
"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const VARIANTS = {
    danger: "bg-red-900/40 text-red-400 border border-red-900/50 hover:bg-red-900/60",
    warning: "bg-orange-600 text-white hover:bg-orange-500",
    primary: "bg-blue-600 text-white hover:bg-blue-500",
    ghost: "text-gray-400 hover:text-white",
};

export default function ConfirmSheet({ open, title, description, actions = [] }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                const cancel = actions.find((a) => a.variant === "ghost");
                cancel?.onClick?.();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, actions]);

    if (!open) return null;

    return createPortal(
        <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center overscroll-contain"
            onClick={() => {
                const cancel = actions.find((a) => a.variant === "ghost");
                cancel?.onClick?.();
            }}
        >
            <div
                className="w-full md:max-w-sm bg-gray-800 rounded-t-[28px] md:rounded-2xl border-t md:border border-gray-700 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3
                    id="confirm-title"
                    className="text-lg font-bold text-white mb-2 text-center"
                >
                    {title}
                </h3>
                {description && (
                    <p className="text-gray-300 text-sm text-center mb-6">{description}</p>
                )}
                <div className="flex flex-col gap-2">
                    {actions.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            className={`w-full py-3 rounded-xl font-bold transition active:scale-[0.97] min-h-12 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[action.variant] || VARIANTS.ghost
                                }`}
                        >
                            {action.label}
                            {action.hint && (
                                <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                                    {action.hint}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}