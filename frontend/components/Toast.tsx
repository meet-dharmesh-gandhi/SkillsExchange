"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
	id: number;
	message: string;
	type: ToastType;
};

type ToastContextType = {
	showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback((message: string, type: ToastType = "info") => {
		const id = nextId++;
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	const dismiss = (id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	const colors: Record<ToastType, string> = {
		success: "bg-emerald-600",
		error: "bg-rose-600",
		info: "bg-slate-700",
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{/* Toast container */}
			<div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
				{toasts.map((t) => (
					<div
						key={t.id}
						className={`${colors[t.type]} animate-slide-up flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm`}
					>
						<span className="flex-1">{t.message}</span>
						<button
							onClick={() => dismiss(t.id)}
							className="bg-transparent p-0 text-white/70 hover:text-white"
						>
							✕
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be inside ToastProvider");
	return ctx;
}
