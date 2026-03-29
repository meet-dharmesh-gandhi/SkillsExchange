"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
	const { user, logout } = useAuth();
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();

	if (!user) return null;

	const initial = user.name?.charAt(0)?.toUpperCase() || "U";
	const isActive = (href: string) =>
		pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
	const skillsActive = pathname.startsWith("/skills");
	const activeTabClass = "bg-teal-700! !text-white hover:!bg-teal-700 hover:!text-white";
	const inactiveTabClass = "bg-transparent! text-slate-700! hover:!bg-slate-100";

	return (
		<nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
				{/* Logo */}
				<Link
					href="/dashboard"
					className="flex items-center gap-2 no-underline hover:no-underline"
				>
					<span className="rounded-lg bg-teal-700 px-2 py-1 text-sm font-bold text-white">
						SE
					</span>
					<span className="text-lg font-semibold text-slate-900">SkillsExchange</span>
				</Link>

				{/* Desktop links */}
				<div className="hidden items-center gap-1 md:flex">
					<Link
						href="/dashboard"
						className={`rounded-lg px-3 py-2 text-sm font-medium no-underline hover:no-underline ${
							isActive("/dashboard") ? activeTabClass : inactiveTabClass
						}`}
					>
						Dashboard
					</Link>

					{/* Skills dropdown */}
					<div className="group relative">
						<button
							type="button"
							aria-haspopup="true"
							className={`rounded-lg px-3 py-2 text-sm font-medium ${
								skillsActive ? activeTabClass : inactiveTabClass
							}`}
						>
							Skills
						</button>
						<div className="invisible absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 opacity-0 transition duration-150 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
							<Link
								href="/skills/my-skills"
								className="block px-4 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
							>
								My Skills
							</Link>
							<Link
								href="/skills/browse"
								className="block px-4 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
							>
								Find Skills
							</Link>
						</div>
					</div>

					<Link
						href="/matches"
						className={`rounded-lg px-3 py-2 text-sm font-medium no-underline hover:no-underline ${
							isActive("/matches") ? activeTabClass : inactiveTabClass
						}`}
					>
						Matches
					</Link>
					<Link
						href="/sessions"
						className={`rounded-lg px-3 py-2 text-sm font-medium no-underline hover:no-underline ${
							isActive("/sessions") ? activeTabClass : inactiveTabClass
						}`}
					>
						Sessions
					</Link>
				</div>

				{/* User area */}
				<div className="hidden items-center gap-3 md:flex">
					<Link
						href="/profile/edit"
						className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-100 hover:no-underline"
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
						<Link
							href="/dashboard"
							className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
							onClick={() => setMobileOpen(false)}
						>
							Dashboard
						</Link>
						<Link
							href="/skills/my-skills"
							className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
							onClick={() => setMobileOpen(false)}
						>
							My Skills
						</Link>
						<Link
							href="/skills/browse"
							className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
							onClick={() => setMobileOpen(false)}
						>
							Find Skills
						</Link>
						<Link
							href="/matches"
							className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
							onClick={() => setMobileOpen(false)}
						>
							Matches
						</Link>
						<Link
							href="/sessions"
							className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
							onClick={() => setMobileOpen(false)}
						>
							Sessions
						</Link>
						<Link
							href="/profile/edit"
							className="rounded-lg px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
							onClick={() => setMobileOpen(false)}
						>
							Profile
						</Link>
						<button
							onClick={() => {
								logout();
								setMobileOpen(false);
							}}
							className="rounded-lg bg-slate-100 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-200"
						>
							Logout
						</button>
					</div>
				</div>
			)}
		</nav>
	);
}
