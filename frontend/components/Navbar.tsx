"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Navbar() {
	const { user, logout } = useAuth();
	const [skillsOpen, setSkillsOpen] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	if (!user) return null;

	const initial = user.name?.charAt(0)?.toUpperCase() || "U";

	return (
		<nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
				{/* Logo */}
				<Link href="/dashboard" className="flex items-center gap-2 no-underline">
					<span className="rounded-lg bg-teal-700 px-2 py-1 text-sm font-bold text-white">
						SE
					</span>
					<span className="text-lg font-semibold text-slate-900">SkillsExchange</span>
				</Link>

				{/* Desktop links */}
				<div className="hidden items-center gap-1 md:flex">
					<Link
						href="/dashboard"
						className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-100"
					>
						Dashboard
					</Link>

					{/* Skills dropdown */}
					<div className="relative">
						<button
							onClick={() => setSkillsOpen(!skillsOpen)}
							className="rounded-lg bg-transparent px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
						>
							Skills ▾
						</button>
						{skillsOpen && (
							<div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
								<Link
									href="/skills/my-skills"
									onClick={() => setSkillsOpen(false)}
									className="block px-4 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50"
								>
									My Skills
								</Link>
								<Link
									href="/skills/browse"
									onClick={() => setSkillsOpen(false)}
									className="block px-4 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50"
								>
									Find Skills
								</Link>
							</div>
						)}
					</div>

					<Link
						href="/matches"
						className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-100"
					>
						Matches
					</Link>
					<Link
						href="/sessions"
						className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-100"
					>
						Sessions
					</Link>
				</div>

				{/* User area */}
				<div className="hidden items-center gap-3 md:flex">
					<Link
						href="/profile/edit"
						className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-100"
					>
						<span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
							{initial}
						</span>
						<span className="font-medium">{user.name}</span>
					</Link>
					<button
						onClick={logout}
						className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
					>
						Logout
					</button>
				</div>

				{/* Mobile burger */}
				<button
					onClick={() => setMobileOpen(!mobileOpen)}
					className="rounded-lg bg-transparent p-2 text-slate-700 md:hidden"
				>
					☰
				</button>
			</div>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
					<div className="flex flex-col gap-1">
						<Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Dashboard</Link>
						<Link href="/skills/my-skills" className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50" onClick={() => setMobileOpen(false)}>My Skills</Link>
						<Link href="/skills/browse" className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Find Skills</Link>
						<Link href="/matches" className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Matches</Link>
						<Link href="/sessions" className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Sessions</Link>
						<Link href="/profile/edit" className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Profile</Link>
						<button onClick={() => { logout(); setMobileOpen(false); }} className="rounded-lg bg-slate-100 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-200">Logout</button>
					</div>
				</div>
			)}
		</nav>
	);
}
