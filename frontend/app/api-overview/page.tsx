"use client";

import { FormEvent, useMemo, useState } from "react";

type ApiResult = {
	status: number;
	data: unknown;
	error?: string;
};

const initialResult: ApiResult = {
	status: 0,
	data: null,
};

export default function Home() {
	const apiBaseUrl = useMemo(() => "/api", []);

	const [result, setResult] = useState<ApiResult>(initialResult);
	const [loading, setLoading] = useState(false);

	const [registerForm, setRegisterForm] = useState({
		name: "",
		email: "",
		password: "",
	});
	const [loginForm, setLoginForm] = useState({ email: "", password: "" });
	const [addSkillForm, setAddSkillForm] = useState({
		user_id: "",
		skill_id: "",
		proficiency: "",
	});
	const [newSkillForm, setNewSkillForm] = useState({
		skill_name: "",
	});
	const [requestSkillForm, setRequestSkillForm] = useState({
		user_id: "",
		skill_id: "",
	});
	const [scheduleForm, setScheduleForm] = useState({
		match_id: "",
		time: "",
	});
	const [rateForm, setRateForm] = useState({
		session_id: "",
		rater_id: "",
		rated_id: "",
		rating: "",
		review: "",
	});
	const [matchUserId, setMatchUserId] = useState("");

	async function callApi(path: string, options?: RequestInit) {
		setLoading(true);
		try {
			const response = await fetch(`${apiBaseUrl}${path}`, {
				headers: { "Content-Type": "application/json" },
				...options,
			});

			const text = await response.text();
			const data = text ? JSON.parse(text) : null;

			setResult({
				status: response.status,
				data,
				error: response.ok ? undefined : "Request failed",
			});
		} catch (error) {
			setResult({
				status: 0,
				data: null,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setLoading(false);
		}
	}

	function toNum(value: string) {
		return Number(value);
	}

	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top,#f2f7ff_0%,#f8f9fb_45%,#edf3f1_100%)] px-4 py-8 text-slate-800">
			<div className="mx-auto w-full max-w-6xl">
				<header className="mb-8 rounded-2xl border border-slate-200 bg-white/85 p-6 backdrop-blur-sm">
					<p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
						SkillsExchange
					</p>
					<h1 className="text-3xl font-semibold text-slate-900">API Test Console</h1>
					<p className="mt-2 text-sm text-slate-600">
						Use this page to test all backend endpoints from the browser.
					</p>
					<p className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1 text-xs text-white">
						Base URL: {apiBaseUrl}
					</p>
				</header>

				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<section className="card">
						<h2>POST /register</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								void callApi("/register", {
									method: "POST",
									body: JSON.stringify(registerForm),
								});
							}}
						>
							<input
								placeholder="Name"
								value={registerForm.name}
								onChange={(e) =>
									setRegisterForm({ ...registerForm, name: e.target.value })
								}
							/>
							<input
								placeholder="Email"
								value={registerForm.email}
								onChange={(e) =>
									setRegisterForm({ ...registerForm, email: e.target.value })
								}
							/>
							<input
								type="password"
								placeholder="Password"
								value={registerForm.password}
								onChange={(e) =>
									setRegisterForm({ ...registerForm, password: e.target.value })
								}
							/>
							<button type="submit">Send</button>
						</form>
					</section>

					<section className="card">
						<h2>POST /login</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								void callApi("/login", {
									method: "POST",
									body: JSON.stringify(loginForm),
								});
							}}
						>
							<input
								placeholder="Email"
								value={loginForm.email}
								onChange={(e) =>
									setLoginForm({ ...loginForm, email: e.target.value })
								}
							/>
							<input
								type="password"
								placeholder="Password"
								value={loginForm.password}
								onChange={(e) =>
									setLoginForm({ ...loginForm, password: e.target.value })
								}
							/>
							<button type="submit">Send</button>
						</form>
					</section>

					<section className="card">
						<h2>POST /add-skill</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								void callApi("/add-skill", {
									method: "POST",
									body: JSON.stringify({
										user_id: toNum(addSkillForm.user_id),
										skill_id: toNum(addSkillForm.skill_id),
										proficiency: addSkillForm.proficiency,
									}),
								});
							}}
						>
							<input
								placeholder="User ID"
								value={addSkillForm.user_id}
								onChange={(e) =>
									setAddSkillForm({ ...addSkillForm, user_id: e.target.value })
								}
							/>
							<input
								placeholder="Skill ID"
								value={addSkillForm.skill_id}
								onChange={(e) =>
									setAddSkillForm({ ...addSkillForm, skill_id: e.target.value })
								}
							/>
							<input
								placeholder="Proficiency"
								value={addSkillForm.proficiency}
								onChange={(e) =>
									setAddSkillForm({
										...addSkillForm,
										proficiency: e.target.value,
									})
								}
							/>
							<button type="submit">Send</button>
						</form>
					</section>

					<section className="card">
						<h2>POST /add-new-skill</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								void callApi("/add-new-skill", {
									method: "POST",
									body: JSON.stringify({
										skill_name: newSkillForm.skill_name,
									}),
								});
							}}
						>
							<input
								placeholder="Skill Name"
								value={newSkillForm.skill_name}
								onChange={(e) => setNewSkillForm({ skill_name: e.target.value })}
							/>
							<button type="submit">Send</button>
						</form>
					</section>

					<section className="card">
						<h2>POST /request-skill</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								void callApi("/request-skill", {
									method: "POST",
									body: JSON.stringify({
										user_id: toNum(requestSkillForm.user_id),
										skill_id: toNum(requestSkillForm.skill_id),
									}),
								});
							}}
						>
							<input
								placeholder="User ID"
								value={requestSkillForm.user_id}
								onChange={(e) =>
									setRequestSkillForm({
										...requestSkillForm,
										user_id: e.target.value,
									})
								}
							/>
							<input
								placeholder="Skill ID"
								value={requestSkillForm.skill_id}
								onChange={(e) =>
									setRequestSkillForm({
										...requestSkillForm,
										skill_id: e.target.value,
									})
								}
							/>
							<button type="submit">Send</button>
						</form>
					</section>

					<section className="card">
						<h2>POST /match-users</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								void callApi("/match-users", {
									method: "POST",
									body: JSON.stringify({}),
								});
							}}
						>
							<button type="submit">Run Procedure</button>
						</form>
					</section>

					<section className="card">
						<h2>POST /schedule-session</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								void callApi("/schedule-session", {
									method: "POST",
									body: JSON.stringify({
										match_id: toNum(scheduleForm.match_id),
										time: scheduleForm.time,
									}),
								});
							}}
						>
							<input
								placeholder="Match ID"
								value={scheduleForm.match_id}
								onChange={(e) =>
									setScheduleForm({ ...scheduleForm, match_id: e.target.value })
								}
							/>
							<input
								type="datetime-local"
								value={scheduleForm.time}
								onChange={(e) =>
									setScheduleForm({ ...scheduleForm, time: e.target.value })
								}
							/>
							<button type="submit">Send</button>
						</form>
					</section>

					<section className="card">
						<h2>POST /rate-user</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								void callApi("/rate-user", {
									method: "POST",
									body: JSON.stringify({
										session_id: toNum(rateForm.session_id),
										rater_id: toNum(rateForm.rater_id),
										rated_id: toNum(rateForm.rated_id),
										rating: toNum(rateForm.rating),
										review: rateForm.review,
									}),
								});
							}}
						>
							<input
								placeholder="Session ID"
								value={rateForm.session_id}
								onChange={(e) =>
									setRateForm({ ...rateForm, session_id: e.target.value })
								}
							/>
							<input
								placeholder="Rater ID"
								value={rateForm.rater_id}
								onChange={(e) =>
									setRateForm({ ...rateForm, rater_id: e.target.value })
								}
							/>
							<input
								placeholder="Rated ID"
								value={rateForm.rated_id}
								onChange={(e) =>
									setRateForm({ ...rateForm, rated_id: e.target.value })
								}
							/>
							<input
								placeholder="Rating (1-5)"
								value={rateForm.rating}
								onChange={(e) =>
									setRateForm({ ...rateForm, rating: e.target.value })
								}
							/>
							<input
								placeholder="Review"
								value={rateForm.review}
								onChange={(e) =>
									setRateForm({ ...rateForm, review: e.target.value })
								}
							/>
							<button type="submit">Send</button>
						</form>
					</section>

					<section className="card">
						<h2>GET /matches/:userId</h2>
						<form
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								if (!matchUserId) {
									return;
								}
								void callApi(`/matches/${matchUserId}`, { method: "GET" });
							}}
						>
							<input
								placeholder="User ID"
								value={matchUserId}
								onChange={(e) => setMatchUserId(e.target.value)}
							/>
							<button type="submit">Fetch</button>
						</form>
					</section>
				</div>

				<section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-slate-100">
					<div className="mb-3 flex items-center justify-between">
						<h3 className="text-sm uppercase tracking-[0.15em] text-teal-300">
							Response
						</h3>
						<span className="text-xs text-slate-400">
							{loading
								? "Loading..."
								: result.status
									? `HTTP ${result.status}`
									: "Idle"}
						</span>
					</div>
					{result.error ? (
						<p className="mb-2 text-sm text-rose-300">{result.error}</p>
					) : null}
					<pre className="max-h-70 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-200">
						{JSON.stringify(result.data, null, 2)}
					</pre>
				</section>
			</div>
		</main>
	);
}
