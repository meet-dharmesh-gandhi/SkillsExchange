"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import { apiPut, ApiError } from "@/lib/api";

export default function ProfileEditPage() {
	const { user, loading, logout } = useAuth();
	const { showToast } = useToast();
	const router = useRouter();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!loading && !user) router.replace("/login");
	}, [user, loading, router]);

	useEffect(() => {
		if (user) {
			setName(user.name);
			setEmail(user.email);
		}
	}, [user]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!name || !email || !currentPassword) {
			showToast("Name, email and current password are required", "error");
			return;
		}
		setSubmitting(true);
		try {
			await apiPut(`/user/${user!.user_id}`, {
				name,
				email,
				currentPassword,
				newPassword: newPassword || undefined,
			});
			showToast("Profile updated! Please log in again.", "success");
			// Update local storage with new info
			const updatedUser = { ...user!, name, email };
			localStorage.setItem("se_user", JSON.stringify(updatedUser));
			// If password was changed, force re-login
			if (newPassword) {
				logout();
				router.push("/login");
			} else {
				router.push("/dashboard");
			}
		} catch (err) {
			showToast(err instanceof ApiError ? err.message : "Update failed", "error");
		} finally {
			setSubmitting(false);
		}
	}

	if (loading || !user) return null;

	return (
		<div className="page-container">
			<div className="page-header">
				<h1>Edit Profile</h1>
				<p>Update your account information</p>
			</div>

			<div className="card mx-auto max-w-lg">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
						<input value={name} onChange={(e) => setName(e.target.value)} required />
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					<hr className="border-slate-200" />

					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">
							Current Password <span className="text-rose-500">*</span>
						</label>
						<input
							type="password"
							placeholder="Required to save changes"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							required
						/>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">
							New Password <span className="text-slate-400">(optional)</span>
						</label>
						<input
							type="password"
							placeholder="Leave blank to keep current"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</div>

					<div className="flex gap-2">
						<button
							type="button"
							className="btn-secondary flex-1"
							onClick={() => router.back()}
						>
							Cancel
						</button>
						<button type="submit" className="flex-1" disabled={submitting}>
							{submitting ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
