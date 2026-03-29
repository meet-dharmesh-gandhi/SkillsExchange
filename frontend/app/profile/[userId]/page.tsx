"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";

type UserProfile = { user_id: number; name: string; email: string; rating_avg: number | null };
type UserSkill = { id: number; skill_id: number; skill_name: string; proficiency_level: string };
type Rating = { rating_id: number; rater_name: string; rating: number; review: string | null };

function renderStars(rating: number | null) {
	if (!rating) return "No ratings yet";
	const full = Math.round(rating);
	return "★".repeat(full) + "☆".repeat(5 - full) + ` (${Number(rating).toFixed(1)})`;
}

export default function UserProfilePage() {
	const { user, loading } = useAuth();
	const router = useRouter();
	const params = useParams();
	const userId = params.userId as string;

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [skills, setSkills] = useState<UserSkill[]>([]);
	const [ratings, setRatings] = useState<Rating[]>([]);

	useEffect(() => {
		if (!loading && !user) router.replace("/login");
	}, [user, loading, router]);

	useEffect(() => {
		if (!userId) return;
		apiGet(`/user/${userId}`).then(setProfile).catch(() => {});
		apiGet(`/user-skills/${userId}`).then(setSkills).catch(() => {});
		apiGet(`/ratings/${userId}`).then(setRatings).catch(() => {});
	}, [userId]);

	if (loading || !user || !profile) return null;

	const isOwnProfile = profile.user_id === user.user_id;

	return (
		<div className="page-container">
			<div className="card mb-6 flex items-center gap-4">
				<span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-700 text-2xl font-bold text-white">
					{profile.name?.charAt(0)?.toUpperCase()}
				</span>
				<div className="flex-1">
					<h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
					<p className="text-sm text-slate-500">{profile.email}</p>
					<p className="stars mt-1 text-sm">{renderStars(profile.rating_avg)}</p>
				</div>
				{isOwnProfile && (
					<Link href="/profile/edit">
						<button className="btn-secondary btn-sm">Edit Profile</button>
					</Link>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Skills */}
				<div className="card">
					<h2 className="mb-3">Skills Offered</h2>
					{skills.length === 0 ? (
						<p className="text-sm text-slate-400">No skills listed.</p>
					) : (
						<div className="flex flex-col gap-2">
							{skills.map((s) => (
								<div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
									<span className="text-sm font-medium text-slate-700">{s.skill_name}</span>
									<span className="badge badge-teal">{s.proficiency_level}</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Reviews */}
				<div className="card">
					<h2 className="mb-3">Reviews</h2>
					{ratings.length === 0 ? (
						<p className="text-sm text-slate-400">No reviews yet.</p>
					) : (
						<div className="flex flex-col gap-3">
							{ratings.map((r) => (
								<div key={r.rating_id} className="rounded-lg bg-slate-50 p-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-slate-700">{r.rater_name}</span>
										<span className="stars text-sm">
											{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
										</span>
									</div>
									{r.review && (
										<p className="mt-1 text-xs text-slate-500">{r.review}</p>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
