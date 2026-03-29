"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import Loader from "@/components/loader/Loader";

type UserSkill = { id: number; skill_id: number; skill_name: string; proficiency_level: string };
type UserRequest = { request_id: number; skill_id: number; skill_name: string; status: string };
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

export default function DashboardPage() {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [skills, setSkills] = useState<UserSkill[]>([]);
	const [requests, setRequests] = useState<UserRequest[]>([]);
	const [sessions, setSessions] = useState<SessionItem[]>([]);
	const [dataLoading, setDataLoading] = useState(true);

	useEffect(() => {
		if (!loading && !user) router.replace("/login");
	}, [user, loading, router]);

	const fetchDashboardData = useCallback(async () => {
		if (!user) return;
		setDataLoading(true);
		try {
			await Promise.allSettled([
				apiGet(`/user-skills/${user.user_id}`).then(setSkills),
				apiGet(`/user-requests/${user.user_id}`).then(setRequests),
				apiGet(`/sessions/${user.user_id}`).then(setSessions),
			]);
		} finally {
			setDataLoading(false);
		}
	}, [user]);

	useEffect(() => {
		if (user) void fetchDashboardData();
	}, [user, fetchDashboardData]);

	if (loading || dataLoading) {
		return (
			<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
				<Loader />
			</div>
		);
	}

	if (!user) return null;

	const pendingRequests = requests.filter((r) => r.status === "pending");
	const upcomingSessions = sessions.filter(
		(s) => s.status === "upcoming" || s.status === "pending",
	);

	return (
		<div className="page-container">
			<div className="page-header">
				<h1>Welcome, {user.name} 👋</h1>
				<p>Here&apos;s your activity overview</p>
			</div>

			{/* Quick stats */}
			<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="card flex flex-col items-center py-6">
					<span className="text-3xl font-bold text-teal-700">{skills.length}</span>
					<span className="mt-1 text-sm text-slate-500">Skills Offered</span>
				</div>
				<div className="card flex flex-col items-center py-6">
					<span className="text-3xl font-bold text-amber-600">
						{pendingRequests.length}
					</span>
					<span className="mt-1 text-sm text-slate-500">Pending Requests</span>
				</div>
				<div className="card flex flex-col items-center py-6">
					<span className="text-3xl font-bold text-blue-600">
						{upcomingSessions.length}
					</span>
					<span className="mt-1 text-sm text-slate-500">Upcoming Sessions</span>
				</div>
				<div className="card flex flex-col items-center py-6">
					<span className="text-3xl font-bold text-slate-700 stars">
						{user.rating_avg ? Number(user.rating_avg).toFixed(1) : "—"}
					</span>
					<span className="mt-1 text-sm text-slate-500">Your Rating</span>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Recent Skills */}
				<div className="card">
					<div className="mb-3 flex items-center justify-between">
						<h2>My Skills</h2>
						<Link
							href="/skills/my-skills"
							className="text-xs font-medium text-teal-700"
						>
							View all →
						</Link>
					</div>
					{skills.length === 0 ? (
						<p className="text-sm text-slate-400">No skills added yet.</p>
					) : (
						<div className="flex flex-col gap-2">
							{skills.slice(0, 5).map((s) => (
								<div
									key={s.id}
									className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
								>
									<span className="text-sm font-medium text-slate-700">
										{s.skill_name}
									</span>
									<span className="badge badge-teal">{s.proficiency_level}</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Upcoming Sessions */}
				<div className="card">
					<div className="mb-3 flex items-center justify-between">
						<h2>Upcoming Sessions</h2>
						<Link href="/sessions" className="text-xs font-medium text-teal-700">
							View all →
						</Link>
					</div>
					{upcomingSessions.length === 0 ? (
						<p className="text-sm text-slate-400">No upcoming sessions.</p>
					) : (
						<div className="flex flex-col gap-2">
							{upcomingSessions.slice(0, 5).map((s) => {
								const otherName =
									s.user1_id === user.user_id ? s.user2_name : s.user1_name;
								const time = new Date(s.scheduled_time).toLocaleString();
								return (
									<div
										key={s.session_id}
										className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
									>
										<div>
											<span className="text-sm font-medium text-slate-700">
												with {otherName}
											</span>
											<p className="text-xs text-slate-400">{time}</p>
										</div>
										<span
											className={`badge ${s.status === "upcoming" ? "badge-emerald" : "badge-amber"}`}
										>
											{s.status}
										</span>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Pending Requests */}
				<div className="card">
					<div className="mb-3 flex items-center justify-between">
						<h2>Pending Requests</h2>
						<Link href="/skills/browse" className="text-xs font-medium text-teal-700">
							Browse skills →
						</Link>
					</div>
					{pendingRequests.length === 0 ? (
						<p className="text-sm text-slate-400">No pending requests.</p>
					) : (
						<div className="flex flex-col gap-2">
							{pendingRequests.slice(0, 5).map((r) => (
								<div
									key={r.request_id}
									className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
								>
									<span className="text-sm font-medium text-slate-700">
										{r.skill_name}
									</span>
									<span className="badge badge-amber">pending</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Quick actions */}
				<div className="card flex flex-col gap-3">
					<h2>Quick Actions</h2>
					<Link href="/skills/my-skills">
						<button className="w-full">+ Add a Skill</button>
					</Link>
					<Link href="/skills/browse">
						<button className="btn-secondary w-full">Browse Skill Marketplace</button>
					</Link>
					<Link href="/matches">
						<button className="btn-secondary w-full">View Matches</button>
					</Link>
				</div>
			</div>
		</div>
	);
}
