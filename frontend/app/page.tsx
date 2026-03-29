"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/loader/Loader";

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
			<Loader />
		</div>
	);
}
