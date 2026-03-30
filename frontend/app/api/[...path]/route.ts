import { NextRequest, NextResponse } from "next/server";

import { execute, oracledb } from "@/lib/server/db";
import { parseOracleError } from "@/lib/server/oracleError";

export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{ path: string[] }>;
};

async function getSegments(context: RouteContext): Promise<string[]> {
	const resolved = await context.params;
	return Array.isArray(resolved.path) ? resolved.path : [];
}

async function readBody(request: NextRequest) {
	try {
		return await request.json();
	} catch {
		return {};
	}
}

function jsonError(message: string, status: number) {
	return NextResponse.json({ error: message }, { status });
}

function toNumber(value: string) {
	return Number(value);
}

async function routeRequest(request: NextRequest, context: RouteContext) {
	const segments = await getSegments(context);
	const method = request.method.toUpperCase();

	if (method === "GET" && segments.length === 1 && segments[0] === "health") {
		return new NextResponse("Server is healthy!", { status: 200 });
	}

	if (method === "POST" && segments.length === 1 && segments[0] === "register") {
		const body = await readBody(request);
		const { name, email, password } = body as {
			name?: string;
			email?: string;
			password?: string;
		};

		if (!name || !email || !password) {
			return jsonError("Name, email and password are required", 400);
		}

		const result = await execute(
			`INSERT INTO users (name, email, password)
			 VALUES (:name, :email, :password)
			 RETURNING user_id INTO :user_id`,
			{
				name,
				email,
				password,
				user_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
			},
		);

		const userId = (result as { outBinds: { user_id: number[] } }).outBinds.user_id[0];

		return NextResponse.json(
			{
				message: "User registered",
				user_id: userId,
				name,
				email,
				rating_avg: 0,
			},
			{ status: 201 },
		);
	}

	if (method === "POST" && segments.length === 1 && segments[0] === "login") {
		const body = await readBody(request);
		const { email, password } = body as { email?: string; password?: string };

		if (!email || !password) {
			return jsonError("Email and password are required", 400);
		}

		const result = await execute(
			`SELECT user_id AS "user_id", name AS "name", email AS "email", rating_avg AS "rating_avg"
			 FROM users
			 WHERE email = :email AND password = :password`,
			{ email, password },
			{ autoCommit: false },
		);

		const rows = (result as { rows: unknown[] }).rows;
		if (rows.length === 0) {
			return jsonError("Invalid credentials", 401);
		}

		return NextResponse.json(rows[0], { status: 200 });
	}

	if (segments.length === 2 && segments[0] === "user") {
		const userId = toNumber(segments[1]);

		if (method === "GET") {
			const result = await execute(
				`SELECT user_id AS "user_id", name AS "name", email AS "email", rating_avg AS "rating_avg"
				 FROM users WHERE user_id = :userId`,
				{ userId },
				{ autoCommit: false },
			);

			const rows = (result as { rows: unknown[] }).rows;
			if (rows.length === 0) {
				return jsonError("User not found", 404);
			}

			return NextResponse.json(rows[0], { status: 200 });
		}

		if (method === "PUT") {
			const body = await readBody(request);
			const { name, email, currentPassword, newPassword } = body as {
				name?: string;
				email?: string;
				currentPassword?: string;
				newPassword?: string;
			};

			const check = await execute(
				`SELECT user_id AS "user_id" FROM users WHERE user_id = :userId AND password = :currentPassword`,
				{ userId, currentPassword },
				{ autoCommit: false },
			);

			const checkRows = (check as { rows: unknown[] }).rows;
			if (checkRows.length === 0) {
				return jsonError("Current password is incorrect", 401);
			}

			const password = newPassword || currentPassword;
			await execute(
				`UPDATE users SET name = :name, email = :email, password = :password WHERE user_id = :userId`,
				{ name, email, password, userId },
			);

			return NextResponse.json({ message: "Profile updated" }, { status: 200 });
		}
	}

	if (method === "GET" && segments.length === 1 && segments[0] === "skills") {
		const result = await execute(
			`SELECT skill_id AS "skill_id", skill_name AS "skill_name" FROM skills ORDER BY skill_name`,
			{},
			{ autoCommit: false },
		);
		return NextResponse.json((result as { rows: unknown[] }).rows, { status: 200 });
	}

	if (method === "POST" && segments.length === 1 && segments[0] === "add-new-skill") {
		const body = await readBody(request);
		const { skill_name } = body as { skill_name?: string };

		if (!skill_name) {
			return jsonError("Skill name is required", 400);
		}

		const result = await execute(
			`INSERT INTO skills (skill_name)
			 VALUES (:skill_name)
			 RETURNING skill_id INTO :skill_id`,
			{
				skill_name,
				skill_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
			},
		);

		return NextResponse.json(
			{
				message: "New skill created",
				skill_id: (result as { outBinds: { skill_id: number[] } }).outBinds.skill_id[0],
			},
			{ status: 201 },
		);
	}

	if (method === "GET" && segments.length === 2 && segments[0] === "user-skills") {
		const userId = toNumber(segments[1]);
		const result = await execute(
			`SELECT us.id AS "id", us.skill_id AS "skill_id", s.skill_name AS "skill_name",
			        us.proficiency_level AS "proficiency_level"
			 FROM user_skills us
			 JOIN skills s ON us.skill_id = s.skill_id
			 WHERE us.user_id = :userId
			 ORDER BY s.skill_name`,
			{ userId },
			{ autoCommit: false },
		);

		return NextResponse.json((result as { rows: unknown[] }).rows, { status: 200 });
	}

	if (method === "POST" && segments.length === 1 && segments[0] === "add-skill") {
		const body = await readBody(request);
		const { user_id, skill_id, proficiency } = body as {
			user_id: number;
			skill_id: number;
			proficiency: string;
		};

		await execute(
			`INSERT INTO user_skills (id, user_id, skill_id, proficiency_level)
			 VALUES (user_skills_seq.NEXTVAL, :user_id, :skill_id, :proficiency)`,
			{ user_id, skill_id, proficiency },
		);

		return NextResponse.json({ message: "Skill added" }, { status: 201 });
	}

	if (segments.length === 2 && segments[0] === "user-skill") {
		const id = toNumber(segments[1]);

		if (method === "PUT") {
			const body = await readBody(request);
			const { proficiency_level } = body as { proficiency_level: string };

			await execute(
				`UPDATE user_skills SET proficiency_level = :proficiency_level WHERE id = :id`,
				{ proficiency_level, id },
			);

			return NextResponse.json({ message: "Skill updated" }, { status: 200 });
		}

		if (method === "DELETE") {
			await execute(`DELETE FROM user_skills WHERE id = :id`, { id });
			return NextResponse.json({ message: "Skill removed" }, { status: 200 });
		}
	}

	if (method === "GET" && segments.length === 2 && segments[0] === "user-requests") {
		const userId = toNumber(segments[1]);
		const result = await execute(
			`SELECT ur.request_id AS "request_id", ur.skill_id AS "skill_id",
			        s.skill_name AS "skill_name", ur.status AS "status"
			 FROM user_requests ur
			 JOIN skills s ON ur.skill_id = s.skill_id
			 WHERE ur.user_id = :userId
			 ORDER BY ur.request_id DESC`,
			{ userId },
			{ autoCommit: false },
		);

		return NextResponse.json((result as { rows: unknown[] }).rows, { status: 200 });
	}

	if (method === "POST" && segments.length === 1 && segments[0] === "request-skill") {
		const body = await readBody(request);
		const { user_id, skill_id } = body as { user_id: number; skill_id: number };

		await execute(
			`INSERT INTO user_requests (request_id, user_id, skill_id, status)
			 VALUES (user_requests_seq.NEXTVAL, :user_id, :skill_id, 'pending')`,
			{ user_id, skill_id },
		);

		return NextResponse.json({ message: "Skill requested" }, { status: 201 });
	}

	if (method === "POST" && segments.length === 1 && segments[0] === "match-users") {
		await execute(`BEGIN match_users; END;`);
		return NextResponse.json({ message: "Matching complete" }, { status: 200 });
	}

	if (method === "GET" && segments.length === 2 && segments[0] === "matches") {
		const userId = toNumber(segments[1]);
		const result = await execute(
			`SELECT m.match_id AS "match_id",
			        m.user1_id AS "user1_id", m.user2_id AS "user2_id",
			        m.skill1_id AS "skill1_id", m.skill2_id AS "skill2_id",
			        m.status AS "status",
			        u1.name AS "user1_name", u1.rating_avg AS "user1_rating",
			        u2.name AS "user2_name", u2.rating_avg AS "user2_rating",
			        s1.skill_name AS "skill1_name",
			        s2.skill_name AS "skill2_name"
			 FROM matches m
			 JOIN users u1 ON m.user1_id = u1.user_id
			 JOIN users u2 ON m.user2_id = u2.user_id
			 JOIN skills s1 ON m.skill1_id = s1.skill_id
			 JOIN skills s2 ON m.skill2_id = s2.skill_id
			 WHERE m.user1_id = :userId OR m.user2_id = :userId`,
			{ userId },
			{ autoCommit: false },
		);

		return NextResponse.json((result as { rows: unknown[] }).rows, { status: 200 });
	}

	if (method === "POST" && segments.length === 1 && segments[0] === "schedule-session") {
		const body = await readBody(request);
		const { match_id, requester_id, time } = body as {
			match_id?: number;
			requester_id?: number;
			time?: string;
		};

		const scheduledTime = new Date(time ?? "");
		if (Number.isNaN(scheduledTime.getTime())) {
			return jsonError("Invalid time", 400);
		}

		if (!match_id || !requester_id) {
			return jsonError("match_id and requester_id are required", 400);
		}

		await execute(
			`INSERT INTO sessions (session_id, match_id, requester_id, scheduled_time, status)
			 VALUES (sessions_seq.NEXTVAL, :match_id, :requester_id, :scheduled_time, 'pending')`,
			{ match_id, requester_id, scheduled_time: scheduledTime },
		);

		return NextResponse.json({ message: "Session scheduled" }, { status: 201 });
	}

	if (method === "GET" && segments.length === 2 && segments[0] === "sessions") {
		const userId = toNumber(segments[1]);
		const result = await execute(
			`SELECT s.session_id AS "session_id", s.match_id AS "match_id",
			        s.requester_id AS "requester_id", s.scheduled_time AS "scheduled_time", s.status AS "status",
			        m.user1_id AS "user1_id", m.user2_id AS "user2_id",
			        u1.name AS "user1_name", u2.name AS "user2_name",
			        sk1.skill_name AS "skill1_name", sk2.skill_name AS "skill2_name",
			        r.rating AS "my_rating",
			        CASE WHEN r.rating_id IS NULL THEN 0 ELSE 1 END AS "has_rated"
			 FROM sessions s
			 JOIN matches m ON s.match_id = m.match_id
			 JOIN users u1 ON m.user1_id = u1.user_id
			 JOIN users u2 ON m.user2_id = u2.user_id
			 JOIN skills sk1 ON m.skill1_id = sk1.skill_id
			 JOIN skills sk2 ON m.skill2_id = sk2.skill_id
			 LEFT JOIN ratings r ON r.session_id = s.session_id AND r.rater_id = :userId
			 WHERE m.user1_id = :userId OR m.user2_id = :userId
			 ORDER BY s.scheduled_time DESC`,
			{ userId },
			{ autoCommit: false },
		);

		return NextResponse.json((result as { rows: unknown[] }).rows, { status: 200 });
	}

	if (method === "PUT" && segments.length === 3 && segments[0] === "session") {
		const sessionId = toNumber(segments[1]);
		const action = segments[2];

		if (action === "accept") {
			await execute(
				`UPDATE sessions SET status = 'upcoming' WHERE session_id = :sessionId AND status = 'pending'`,
				{ sessionId },
			);
			return NextResponse.json({ message: "Session accepted" }, { status: 200 });
		}

		if (action === "decline") {
			await execute(
				`UPDATE sessions SET status = 'cancel' WHERE session_id = :sessionId AND status = 'pending'`,
				{ sessionId },
			);
			return NextResponse.json({ message: "Session declined" }, { status: 200 });
		}

		if (action === "complete") {
			await execute(
				`UPDATE sessions SET status = 'complete' WHERE session_id = :sessionId AND status = 'upcoming'`,
				{ sessionId },
			);
			return NextResponse.json({ message: "Session completed" }, { status: 200 });
		}
	}

	if (method === "POST" && segments.length === 1 && segments[0] === "rate-user") {
		const body = await readBody(request);
		const { session_id, rater_id, rated_id, rating, review } = body as {
			session_id: number;
			rater_id: number;
			rated_id: number;
			rating: number;
			review?: string;
		};

		const duplicateCheck = await execute(
			`SELECT COUNT(*) AS "count"
			 FROM ratings
			 WHERE session_id = :session_id AND rater_id = :rater_id`,
			{ session_id: Number(session_id), rater_id: Number(rater_id) },
			{ autoCommit: false },
		);

		const duplicateCount =
			(duplicateCheck as { rows: Array<{ count: number }> }).rows[0]?.count ?? 0;

		if (duplicateCount > 0) {
			return jsonError("Rating already submitted for this session", 400);
		}

		await execute(
			`INSERT INTO ratings (rating_id, session_id, rater_id, rated_id, rating, review)
			 VALUES (ratings_seq.NEXTVAL, :session_id, :rater_id, :rated_id, :rating, :review)`,
			{ session_id, rater_id, rated_id, rating, review: review || null },
		);

		const ratingResult = await execute(
			`SELECT rating_avg AS "rating_avg" FROM users WHERE user_id = :rated_id`,
			{ rated_id },
			{ autoCommit: false },
		);

		const ratingAvg =
			(ratingResult as { rows: Array<{ rating_avg: number }> }).rows[0]?.rating_avg || 0;

		return NextResponse.json(
			{
				message: "Rating submitted",
				rating_avg: ratingAvg,
			},
			{ status: 201 },
		);
	}

	if (method === "GET" && segments.length === 2 && segments[0] === "ratings") {
		const userId = toNumber(segments[1]);
		const result = await execute(
			`SELECT r.rating_id AS "rating_id", r.session_id AS "session_id",
			        r.rater_id AS "rater_id", r.rated_id AS "rated_id",
			        r.rating AS "rating", r.review AS "review",
			        u.name AS "rater_name"
			 FROM ratings r
			 JOIN users u ON r.rater_id = u.user_id
			 WHERE r.rated_id = :userId
			 ORDER BY r.rating_id DESC`,
			{ userId },
			{ autoCommit: false },
		);

		return NextResponse.json((result as { rows: unknown[] }).rows, { status: 200 });
	}

	if (method === "GET" && segments.length === 2 && segments[0] === "search") {
		const q = request.nextUrl.searchParams.get("q") ?? "";

		if (segments[1] === "skills") {
			const result = await execute(
				`SELECT skill_id AS "skill_id", skill_name AS "skill_name"
				 FROM skills
				 WHERE LOWER(skill_name) LIKE '%' || LOWER(:q) || '%'
				 ORDER BY skill_name`,
				{ q },
				{ autoCommit: false },
			);

			return NextResponse.json((result as { rows: unknown[] }).rows, { status: 200 });
		}

		if (segments[1] === "users") {
			const result = await execute(
				`SELECT user_id AS "user_id", name AS "name", email AS "email", rating_avg AS "rating_avg"
				 FROM users
				 WHERE LOWER(name) LIKE '%' || LOWER(:q) || '%'
				 ORDER BY name`,
				{ q },
				{ autoCommit: false },
			);

			return NextResponse.json((result as { rows: unknown[] }).rows, { status: 200 });
		}
	}

	return jsonError("Not found", 404);
}

async function handle(request: NextRequest, context: RouteContext) {
	try {
		return await routeRequest(request, context);
	} catch (error) {
		const parsed = parseOracleError(error);
		return NextResponse.json({ error: parsed.message }, { status: parsed.status });
	}
}

export async function GET(request: NextRequest, context: RouteContext) {
	return handle(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
	return handle(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
	return handle(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
	return handle(request, context);
}
