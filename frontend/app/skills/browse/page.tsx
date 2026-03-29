"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import Loader from "@/components/loader/Loader";

type Skill = { skill_id: number; skill_name: string };

export default function BrowseSkillsPage() {
	const { user, loading } = useAuth();
	const { showToast } = useToast();
	const router = useRouter();

	const [skills, setSkills] = useState<Skill[]>([]);
	const [search, setSearch] = useState("");
	const [requesting, setRequesting] = useState<number | null>(null);
	const [dataLoading, setDataLoading] = useState(true);

	useEffect(() => {
		if (!loading && !user) router.replace("/login");
	}, [user, loading, router]);

	useEffect(() => {
		fetchSkills();
	}, []);

	async function fetchSkills() {
		setDataLoading(true);
		try {
			const data = await apiGet("/skills");
			setSkills(data);
		} catch {
			/* empty */
		} finally {
			setDataLoading(false);
		}
	}

	async function handleRequest(skillId: number) {
		if (!user) return;
		setRequesting(skillId);
		try {
			await apiPost("/request-skill", { user_id: user.user_id, skill_id: skillId });
			showToast("Your request is pending!", "success");
		} catch (err) {
			showToast(err instanceof ApiError ? err.message : "Request failed", "error");
		} finally {
			setRequesting(null);
		}
	}

	if (loading || dataLoading) {
		return (
			<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
				<Loader />
			</div>
		);
	}

	if (!user) return null;

	const filtered = skills.filter((s) =>
		s.skill_name.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="page-container">
			<div className="page-header">
				<h1>Skill Marketplace</h1>
				<p>Browse available skills and request to learn</p>
			</div>

			<div className="mb-6">
				<input
					placeholder="Search skills..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-md"
				/>
			</div>

			{filtered.length === 0 ? (
				<div className="empty-state card">
					<p>{search ? "No skills match your search." : "No skills available yet."}</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filtered.map((s) => (
						<div key={s.skill_id} className="card flex items-center justify-between">
							<span className="text-sm font-semibold text-slate-800">
								{s.skill_name}
							</span>
							<button
								className="btn-sm"
								disabled={requesting === s.skill_id}
								onClick={() => handleRequest(s.skill_id)}
							>
								{requesting === s.skill_id ? "..." : "Learn this"}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
