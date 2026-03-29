"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading) {
			router.replace(user ? "/dashboard" : "/login");
		}
	}, [user, loading, router]);

	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
			<div className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-2xl font-bold text-white">
					SE
				</div>
				<p className="text-sm text-slate-400">Loading...</p>
			</div>
		</div>
	);
}
