"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiGet, apiPost } from "@/lib/api";

export type User = {
	user_id: number;
	name: string;
	email: string;
	rating_avg: number | null;
};

type AuthContextType = {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string) => Promise<void>;
	logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function bootstrapAuth() {
			const stored = localStorage.getItem("se_user");
			if (!stored) {
				setLoading(false);
				return;
			}

			try {
				const cachedUser = JSON.parse(stored) as User;
				setUser(cachedUser);

				// Refresh from DB so rating_avg and other dynamic fields are fresh on reload.
				const freshUser = (await apiGet(`/user/${cachedUser.user_id}`)) as User;
				setUser(freshUser);
				localStorage.setItem("se_user", JSON.stringify(freshUser));
			} catch {
				localStorage.removeItem("se_user");
				setUser(null);
			} finally {
				setLoading(false);
			}
		}

		void bootstrapAuth();
	}, []);

	function persist(u: User) {
		setUser(u);
		localStorage.setItem("se_user", JSON.stringify(u));
	}

	async function login(email: string, password: string) {
		const data = await apiPost("/login", { email, password });
		persist(data as User);
	}

	async function register(name: string, email: string, password: string) {
		const data = await apiPost("/register", { name, email, password });
		persist(data as User);
	}

	function logout() {
		setUser(null);
		localStorage.removeItem("se_user");
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be inside AuthProvider");
	return ctx;
}
