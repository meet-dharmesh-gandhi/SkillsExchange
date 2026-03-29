"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import Link from "next/link";

type SessionItem = {
	session_id: number;
	match_id: number;
	scheduled_time: string;
	status: string;
	user1_id: number;
	user2_id: number;
	user1_name: string;
	user2_name: string;
	skill1_name: string;
	skill2_name: string;
};

export default function SessionsPage() {
	const { user, loading } = useAuth();
	const { showToast } = useToast();
	const router = useRouter();
	const [sessions, setSessions] = useState<SessionItem[]>([]);
	const [rateSession, setRateSession] = useState<SessionItem | null>(null);

	useEffect(() => {
		if (!loading && !user) router.replace("/login");
	}, [user, loading, router]);

	async function fetchSessions() {
		if (!user) return;
		try {
			const data = await apiGet(`/sessions/${user.user_id}`);
			setSessions(data);
		} catch {
			/* empty */
		}
	}

	useEffect(() => {
		if (user) fetchSessions();
	}, [user]);

	async function handleAction(sessionId: number, action: "accept" | "decline" | "complete") {
		try {
			await apiPut(`/session/${sessionId}/${action}`, {});
			showToast(
				`Session ${action === "accept" ? "accepted" : action === "decline" ? "declined" : "completed"}!`,
				"success",
			);
			fetchSessions();
		} catch (err) {
			showToast(err instanceof ApiError ? err.message : "Action failed", "error");
		}
	}

	if (loading || !user) return null;

	const pending = sessions.filter((s) => s.status === "pending");
	const upcoming = sessions.filter((s) => s.status === "upcoming");
	const completed = sessions.filter((s) => s.status === "complete");
	const cancelled = sessions.filter((s) => s.status === "cancel");

	function renderSession(s: SessionItem, showActions: boolean, showRate: boolean) {
		const otherName = s.user1_id === user!.user_id ? s.user2_name : s.user1_name;
		const otherId = s.user1_id === user!.user_id ? s.user2_id : s.user1_id;
		const time = new Date(s.scheduled_time).toLocaleString();
		// Whether this user is the one who needs to accept (they didn't create it)
		const canAcceptDecline = showActions && s.status === "pending";

		return (
			<div key={s.session_id} className="card flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
							{otherName?.charAt(0)?.toUpperCase()}
						</span>
						<div>
							<h3 className="text-sm font-semibold text-slate-800">
								Session with {otherName}
							</h3>
							<p className="text-xs text-slate-400">{time} (1 hour)</p>
						</div>
					</div>
					<span
						className={`badge ${
							s.status === "upcoming"
								? "badge-emerald"
								: s.status === "pending"
									? "badge-amber"
									: s.status === "complete"
										? "badge-teal"
										: "badge-rose"
						}`}
					>
						{s.status}
					</span>
				</div>

				<div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
					<span className="font-medium">Skills:</span> {s.skill1_name} ↔ {s.skill2_name}
				</div>

				<div className="flex gap-2">
					{canAcceptDecline && (
						<>
							<button
								className="btn-sm flex-1"
								onClick={() => handleAction(s.session_id, "accept")}
							>
								Accept
							</button>
							<button
								className="btn-danger btn-sm flex-1"
								onClick={() => handleAction(s.session_id, "decline")}
							>
								Decline
							</button>
						</>
					)}
					{s.status === "upcoming" && (
						<button
							className="btn-sm flex-1"
							onClick={() => handleAction(s.session_id, "complete")}
						>
							Mark Complete
						</button>
					)}
					{showRate && (
						<button className="btn-sm flex-1" onClick={() => setRateSession(s)}>
							⭐ Rate
						</button>
					)}
					<Link href={`/profile/${otherId}`} className="flex-1">
						<button className="btn-secondary btn-sm w-full">View Profile</button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="page-container">
			<div className="page-header flex items-center justify-between">
				<div>
					<h1>Sessions</h1>
					<p>Manage your skill exchange sessions</p>
				</div>
				<Link href="/sessions/schedule">
					<button>+ Schedule Session</button>
				</Link>
			</div>

			{sessions.length === 0 ? (
				<div className="empty-state card">
					<p>No sessions yet. Match with users and schedule your first session!</p>
				</div>
			) : (
				<div className="flex flex-col gap-8">
					{pending.length > 0 && (
						<div>
							<h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-700">
								Pending ({pending.length})
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								{pending.map((s) => renderSession(s, true, false))}
							</div>
						</div>
					)}

					{upcoming.length > 0 && (
						<div>
							<h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-emerald-700">
								Upcoming ({upcoming.length})
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								{upcoming.map((s) => renderSession(s, false, false))}
							</div>
						</div>
					)}

					{completed.length > 0 && (
						<div>
							<h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-teal-700">
								Completed ({completed.length})
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								{completed.map((s) => renderSession(s, false, true))}
							</div>
						</div>
					)}

					{cancelled.length > 0 && (
						<div>
							<h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
								Cancelled ({cancelled.length})
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								{cancelled.map((s) => renderSession(s, false, false))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Rate modal inline */}
			{rateSession && (
				<RateModal
					session={rateSession}
					userId={user.user_id}
					onClose={() => setRateSession(null)}
					onSuccess={() => {
						setRateSession(null);
						fetchSessions();
					}}
				/>
			)}
		</div>
	);
}

// ── Rate Modal (inline component) ──────────────

function RateModal({
	session,
	userId,
	onClose,
	onSuccess,
}: {
	session: SessionItem;
	userId: number;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const { showToast } = useToast();
	const [rating, setRating] = useState(5);
	const [review, setReview] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const ratedId = session.user1_id === userId ? session.user2_id : session.user1_id;
	const ratedName = session.user1_id === userId ? session.user2_name : session.user1_name;

	async function handleSubmit() {
		setSubmitting(true);
		try {
			const { apiPost } = await import("@/lib/api");
			await apiPost("/rate-user", {
				session_id: session.session_id,
				rater_id: userId,
				rated_id: ratedId,
				rating,
				review: review || null,
			});
			showToast("Rating submitted!", "success");
			onSuccess();
		} catch (err) {
			const { ApiError } = await import("@/lib/api");
			showToast(err instanceof ApiError ? err.message : "Rating failed", "error");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<h2 className="mb-4 text-lg font-bold">Rate {ratedName}</h2>

				<div className="mb-4">
					<label className="mb-1 block text-xs font-medium text-slate-600">Rating</label>
					<div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
								aria-pressed={star <= rating}
								onClick={() => setRating(star)}
								className={`rounded-md bg-transparent! p-1 text-2xl transition-colors hover:bg-transparent! ${star <= rating ? "text-amber-400!" : "text-slate-300!"}`}
							>
								★
							</button>
						))}
					</div>
				</div>

				<div className="mb-4">
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Review (optional)
					</label>
					<textarea
						placeholder="Write a brief review..."
						value={review}
						onChange={(e) => setReview(e.target.value)}
						rows={3}
					/>
				</div>

				<div className="flex gap-2">
					<button className="btn-secondary flex-1" onClick={onClose}>
						Cancel
					</button>
					<button className="flex-1" onClick={handleSubmit} disabled={submitting}>
						{submitting ? "Submitting..." : "Submit Rating"}
					</button>
				</div>
			</div>
		</div>
	);
}
