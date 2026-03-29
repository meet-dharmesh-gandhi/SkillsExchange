"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/components/Toast";
import Link from "next/link";

type Match = {
	match_id: number;
	user1_id: number; user2_id: number;
	skill1_id: number; skill2_id: number;
	status: string;
	user1_name: string; user1_rating: number | null;
	user2_name: string; user2_rating: number | null;
	skill1_name: string; skill2_name: string;
};

function renderStars(rating: number | null) {
	if (!rating) return "No ratings";
	const full = Math.round(rating);
	return "★".repeat(full) + "☆".repeat(5 - full) + ` (${Number(rating).toFixed(1)})`;
}

export default function MatchesPage() {
	const { user, loading } = useAuth();
	const { showToast } = useToast();
	const router = useRouter();
	const [matches, setMatches] = useState<Match[]>([]);
	const [runningMatch, setRunningMatch] = useState(false);

	useEffect(() => {
		if (!loading && !user) router.replace("/login");
	}, [user, loading, router]);

	async function fetchMatches() {
		if (!user) return;
		try {
			const data = await apiGet(`/matches/${user.user_id}`);
			setMatches(data);
		} catch { /* empty */ }
	}

	useEffect(() => {
		if (user) fetchMatches();
	}, [user]);

	async function runMatchProcedure() {
		setRunningMatch(true);
		try {
			await apiPost("/match-users", {});
			showToast("Matching complete! Refreshing...", "success");
			await fetchMatches();
		} catch {
			showToast("Matching failed", "error");
		} finally {
			setRunningMatch(false);
		}
	}

	if (loading || !user) return null;

	return (
		<div className="page-container">
			<div className="page-header flex items-center justify-between">
				<div>
					<h1>Your Matches</h1>
					<p>Users matched for skill exchange</p>
				</div>
				<button onClick={runMatchProcedure} disabled={runningMatch}>
					{runningMatch ? "Matching..." : "🔄 Run Matching"}
				</button>
			</div>

			{matches.length === 0 ? (
				<div className="empty-state card">
					<p>No matches yet. Request skills and click &quot;Run Matching&quot; to find partners!</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{matches.map((m) => {
						const isUser1 = m.user1_id === user.user_id;
						const otherName = isUser1 ? m.user2_name : m.user1_name;
						const otherRating = isUser1 ? m.user2_rating : m.user1_rating;
						const otherId = isUser1 ? m.user2_id : m.user1_id;
						const theyTeach = isUser1 ? m.skill1_name : m.skill2_name;
						const youTeach = isUser1 ? m.skill2_name : m.skill1_name;

						return (
							<div key={m.match_id} className="card flex flex-col gap-3">
								<div className="flex items-center gap-3">
									<span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
										{otherName?.charAt(0)?.toUpperCase()}
									</span>
									<div>
										<h3 className="text-base font-semibold text-slate-800">{otherName}</h3>
										<p className="stars text-xs">{renderStars(otherRating)}</p>
									</div>
								</div>

								<div className="rounded-lg bg-slate-50 p-3">
									<div className="mb-1 flex items-center gap-2">
										<span className="text-xs text-slate-500">They teach you:</span>
										<span className="badge badge-teal">{theyTeach}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-slate-500">You teach them:</span>
										<span className="badge badge-amber">{youTeach}</span>
									</div>
								</div>

								<div className="flex gap-2">
									<Link href={`/sessions/schedule?matchId=${m.match_id}`} className="flex-1">
										<button className="btn-sm w-full">Schedule Session</button>
									</Link>
									<Link href={`/profile/${otherId}`} className="flex-1">
										<button className="btn-secondary btn-sm w-full">View Profile</button>
									</Link>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
