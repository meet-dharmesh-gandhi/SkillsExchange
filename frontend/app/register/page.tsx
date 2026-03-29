"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
	const { register } = useAuth();
	const { showToast } = useToast();
	const router = useRouter();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	function validateEmail(e: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!name || !email || !password) {
			showToast("Please fill in all fields", "error");
			return;
		}
		if (!validateEmail(email)) {
			showToast("Please enter a valid email address", "error");
			return;
		}
		if (password.length < 3) {
			showToast("Password must be at least 3 characters", "error");
			return;
		}
		setLoading(true);
		try {
			await register(name, email, password);
			showToast("Account created successfully!", "success");
			router.push("/dashboard");
		} catch (err) {
			const message = err instanceof ApiError ? err.message : "Registration failed";
			showToast(message, "error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-xl font-bold text-white">
						SE
					</div>
					<h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
					<p className="mt-1 text-sm text-slate-500">Join SkillsExchange and start learning</p>
				</div>

				<div className="card">
					<form onSubmit={handleSubmit} className="flex flex-col gap-3">
						<div>
							<label className="mb-1 block text-xs font-medium text-slate-600">Full Name</label>
							<input
								placeholder="John Doe"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
							<input
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
							<input
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						<button type="submit" disabled={loading} className="mt-2">
							{loading ? "Creating account..." : "Sign Up"}
						</button>
					</form>
				</div>

				<p className="mt-4 text-center text-sm text-slate-500">
					Already have an account?{" "}
					<Link href="/login" className="font-medium text-teal-700">
						Log in
					</Link>
				</p>
			</div>
		</div>
	);
}
