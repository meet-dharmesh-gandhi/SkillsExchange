"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, FormEvent } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import Loader from "@/components/loader/Loader";

type Match = {
	match_id: number;
	user1_id: number;
	user2_id: number;
	user1_name: string;
	user2_name: string;
	skill1_name: string;
	skill2_name: string;
};

function ScheduleForm() {
	const { user, loading } = useAuth();
	const { showToast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();
	const preselectedMatchId = searchParams.get("matchId") || "";

	const [matches, setMatches] = useState<Match[]>([]);
	const [matchId, setMatchId] = useState(preselectedMatchId);
	const [dateTime, setDateTime] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!loading && !user) router.replace("/login");
	}, [user, loading, router]);

	useEffect(() => {
		if (user) {
			apiGet(`/matches/${user.user_id}`)
				.then(setMatches)
				.catch(() => {});
		}
	}, [user]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!matchId || !dateTime) {
			showToast("Please select a match and date/time", "error");
			return;
		}
		setSubmitting(true);
		try {
			await apiPost("/schedule-session", {
				match_id: Number(matchId),
				time: new Date(dateTime).toISOString(),
			});
			showToast("Session scheduled!", "success");
			router.push("/sessions");
		} catch (err) {
			showToast(err instanceof ApiError ? err.message : "Scheduling failed", "error");
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) {
		return (
			<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
				<Loader />
			</div>
		);
	}

	if (!user) return null;

	return (
		<div className="page-container">
			<div className="page-header">
				<h1>Schedule a Session</h1>
				<p>Pick a matched user and set a date & time</p>
			</div>

			<div className="card mx-auto max-w-lg">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">
							Matched User
						</label>
						<select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
							<option value="">Select a match...</option>
							{matches.map((m) => {
								const otherName =
									m.user1_id === user.user_id ? m.user2_name : m.user1_name;
								return (
									<option key={m.match_id} value={m.match_id}>
										{otherName} — {m.skill1_name} ↔ {m.skill2_name}
									</option>
								);
							})}
						</select>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">
							Date & Time
						</label>
						<input
							type="datetime-local"
							value={dateTime}
							onChange={(e) => setDateTime(e.target.value)}
						/>
						<p className="mt-1 text-xs text-slate-400">
							Sessions are 1 hour by default
						</p>
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
							{submitting ? "Scheduling..." : "Schedule Session"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default function ScheduleSessionPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
					<Loader />
				</div>
			}
		>
			<ScheduleForm />
		</Suspense>
	);
}
