const express = require("express");
const { execute, oracledb } = require("../db");

const router = express.Router();

// ── Helper: parse Oracle RAISE_APPLICATION_ERROR messages ──
function parseOracleError(error) {
	if (error && error.errorNum && error.errorNum >= 20000 && error.errorNum <= 20999) {
		// Strip the "ORA-200XX: " prefix from the message
		const msg = error.message.replace(/^ORA-\d+:\s*/, "");
		return { status: 400, message: msg };
	}
	return { status: 500, message: error.message || "Internal server error" };
}

// ════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════

router.post("/register", async (req, res) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ error: "Name, email and password are required" });
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

		const userId = result.outBinds.user_id[0];

		// Return the full user object so frontend can auto-login
		res.status(201).json({
			message: "User registered",
			user_id: userId,
			name,
			email,
			rating_avg: 0,
		});
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}
		const result = await execute(
			`SELECT user_id AS "user_id", name AS "name", email AS "email", rating_avg AS "rating_avg"
			 FROM users
			 WHERE email = :email AND password = :password`,
			{ email, password },
			{ autoCommit: false },
		);

		if (result.rows.length === 0) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		res.status(200).json(result.rows[0]);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

// ════════════════════════════════════════════════
//  USER PROFILE
// ════════════════════════════════════════════════

router.get("/user/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const result = await execute(
			`SELECT user_id AS "user_id", name AS "name", email AS "email", rating_avg AS "rating_avg"
			 FROM users WHERE user_id = :userId`,
			{ userId: Number(userId) },
			{ autoCommit: false },
		);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}
		res.status(200).json(result.rows[0]);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.put("/user/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const { name, email, currentPassword, newPassword } = req.body;

		// Verify current password
		const check = await execute(
			`SELECT user_id AS "user_id" FROM users WHERE user_id = :userId AND password = :currentPassword`,
			{ userId: Number(userId), currentPassword },
			{ autoCommit: false },
		);
		if (check.rows.length === 0) {
			return res.status(401).json({ error: "Current password is incorrect" });
		}

		const password = newPassword || currentPassword;
		await execute(
			`UPDATE users SET name = :name, email = :email, password = :password WHERE user_id = :userId`,
			{ name, email, password, userId: Number(userId) },
		);

		res.status(200).json({ message: "Profile updated" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

// ════════════════════════════════════════════════
//  SKILLS
// ════════════════════════════════════════════════

router.get("/skills", async (req, res) => {
	try {
		const result = await execute(
			`SELECT skill_id AS "skill_id", skill_name AS "skill_name" FROM skills ORDER BY skill_name`,
			{},
			{ autoCommit: false },
		);
		res.status(200).json(result.rows);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.post("/add-new-skill", async (req, res) => {
	try {
		const { skill_name } = req.body;
		if (!skill_name) {
			return res.status(400).json({ error: "Skill name is required" });
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

		res.status(201).json({
			message: "New skill created",
			skill_id: result.outBinds.skill_id[0],
		});
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

// ════════════════════════════════════════════════
//  USER SKILLS (offered skills)
// ════════════════════════════════════════════════

router.get("/user-skills/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const result = await execute(
			`SELECT us.id AS "id", us.skill_id AS "skill_id", s.skill_name AS "skill_name",
			        us.proficiency_level AS "proficiency_level"
			 FROM user_skills us
			 JOIN skills s ON us.skill_id = s.skill_id
			 WHERE us.user_id = :userId
			 ORDER BY s.skill_name`,
			{ userId: Number(userId) },
			{ autoCommit: false },
		);
		res.status(200).json(result.rows);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.post("/add-skill", async (req, res) => {
	try {
		const { user_id, skill_id, proficiency } = req.body;
		await execute(
			`INSERT INTO user_skills (id, user_id, skill_id, proficiency_level)
			 VALUES (user_skills_seq.NEXTVAL, :user_id, :skill_id, :proficiency)`,
			{ user_id, skill_id, proficiency },
		);

		res.status(201).json({ message: "Skill added" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.put("/user-skill/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { proficiency_level } = req.body;
		await execute(
			`UPDATE user_skills SET proficiency_level = :proficiency_level WHERE id = :id`,
			{ proficiency_level, id: Number(id) },
		);
		res.status(200).json({ message: "Skill updated" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.delete("/user-skill/:id", async (req, res) => {
	try {
		const { id } = req.params;
		await execute(`DELETE FROM user_skills WHERE id = :id`, { id: Number(id) });
		res.status(200).json({ message: "Skill removed" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

// ════════════════════════════════════════════════
//  SKILL REQUESTS
// ════════════════════════════════════════════════

router.get("/user-requests/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const result = await execute(
			`SELECT ur.request_id AS "request_id", ur.skill_id AS "skill_id",
			        s.skill_name AS "skill_name", ur.status AS "status"
			 FROM user_requests ur
			 JOIN skills s ON ur.skill_id = s.skill_id
			 WHERE ur.user_id = :userId
			 ORDER BY ur.request_id DESC`,
			{ userId: Number(userId) },
			{ autoCommit: false },
		);
		res.status(200).json(result.rows);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.post("/request-skill", async (req, res) => {
	try {
		const { user_id, skill_id } = req.body;
		await execute(
			`INSERT INTO user_requests (request_id, user_id, skill_id, status)
			 VALUES (user_requests_seq.NEXTVAL, :user_id, :skill_id, 'pending')`,
			{ user_id, skill_id },
		);

		res.status(201).json({ message: "Skill requested" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

// ════════════════════════════════════════════════
//  MATCHES
// ════════════════════════════════════════════════

router.post("/match-users", async (req, res) => {
	try {
		await execute(`BEGIN match_users; END;`);
		res.status(200).json({ message: "Matching complete" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.get("/matches/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
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
			{ userId: Number(userId) },
			{ autoCommit: false },
		);
		res.status(200).json(result.rows);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

// ════════════════════════════════════════════════
//  SESSIONS
// ════════════════════════════════════════════════

router.post("/schedule-session", async (req, res) => {
	try {
		const { match_id, time } = req.body;
		const scheduledTime = new Date(time);

		if (Number.isNaN(scheduledTime.getTime())) {
			return res.status(400).json({ error: "Invalid time" });
		}

		await execute(
			`INSERT INTO sessions (session_id, match_id, scheduled_time, status)
			 VALUES (sessions_seq.NEXTVAL, :match_id, :scheduled_time, 'pending')`,
			{ match_id, scheduled_time: scheduledTime },
		);

		res.status(201).json({ message: "Session scheduled" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.get("/sessions/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const parsedUserId = Number(userId);
		const result = await execute(
			`SELECT s.session_id AS "session_id", s.match_id AS "match_id",
			        s.scheduled_time AS "scheduled_time", s.status AS "status",
			        m.user1_id AS "user1_id", m.user2_id AS "user2_id",
			        u1.name AS "user1_name", u2.name AS "user2_name",
			        sk1.skill_name AS "skill1_name", sk2.skill_name AS "skill2_name",
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
			{ userId: parsedUserId },
			{ autoCommit: false },
		);
		res.status(200).json(result.rows);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.put("/session/:sessionId/accept", async (req, res) => {
	try {
		const { sessionId } = req.params;
		await execute(
			`UPDATE sessions SET status = 'upcoming' WHERE session_id = :sessionId AND status = 'pending'`,
			{ sessionId: Number(sessionId) },
		);
		res.status(200).json({ message: "Session accepted" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.put("/session/:sessionId/decline", async (req, res) => {
	try {
		const { sessionId } = req.params;
		await execute(
			`UPDATE sessions SET status = 'cancel' WHERE session_id = :sessionId AND status = 'pending'`,
			{ sessionId: Number(sessionId) },
		);
		res.status(200).json({ message: "Session declined" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.put("/session/:sessionId/complete", async (req, res) => {
	try {
		const { sessionId } = req.params;
		await execute(
			`UPDATE sessions SET status = 'complete' WHERE session_id = :sessionId AND status = 'upcoming'`,
			{ sessionId: Number(sessionId) },
		);
		res.status(200).json({ message: "Session completed" });
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

// ════════════════════════════════════════════════
//  RATINGS
// ════════════════════════════════════════════════

router.post("/rate-user", async (req, res) => {
	try {
		const { session_id, rater_id, rated_id, rating, review } = req.body;

		const duplicateCheck = await execute(
			`SELECT COUNT(*) AS "count"
			 FROM ratings
			 WHERE session_id = :session_id AND rater_id = :rater_id`,
			{ session_id: Number(session_id), rater_id: Number(rater_id) },
			{ autoCommit: false },
		);

		if (duplicateCheck.rows[0]?.count > 0) {
			return res.status(400).json({ error: "Rating already submitted for this session" });
		}

		await execute(
			`INSERT INTO ratings (rating_id, session_id, rater_id, rated_id, rating, review)
			 VALUES (ratings_seq.NEXTVAL, :session_id, :rater_id, :rated_id, :rating, :review)`,
			{ session_id, rater_id, rated_id, rating, review: review || null },
		);

		// The trigger should auto-update rating_avg, but fetch it to return
		const ratingResult = await execute(
			`SELECT rating_avg AS "rating_avg" FROM users WHERE user_id = :rated_id`,
			{ rated_id },
			{ autoCommit: false },
		);

		const ratingAvg = ratingResult.rows[0]?.rating_avg || 0;

		res.status(201).json({
			message: "Rating submitted",
			rating_avg: ratingAvg,
		});
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.get("/ratings/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const result = await execute(
			`SELECT r.rating_id AS "rating_id", r.session_id AS "session_id",
			        r.rater_id AS "rater_id", r.rated_id AS "rated_id",
			        r.rating AS "rating", r.review AS "review",
			        u.name AS "rater_name"
			 FROM ratings r
			 JOIN users u ON r.rater_id = u.user_id
			 WHERE r.rated_id = :userId
			 ORDER BY r.rating_id DESC`,
			{ userId: Number(userId) },
			{ autoCommit: false },
		);
		res.status(200).json(result.rows);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

// ════════════════════════════════════════════════
//  SEARCH
// ════════════════════════════════════════════════

router.get("/search/skills", async (req, res) => {
	try {
		const { q } = req.query;
		const result = await execute(
			`SELECT skill_id AS "skill_id", skill_name AS "skill_name"
			 FROM skills
			 WHERE LOWER(skill_name) LIKE '%' || LOWER(:q) || '%'
			 ORDER BY skill_name`,
			{ q: q || "" },
			{ autoCommit: false },
		);
		res.status(200).json(result.rows);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

router.get("/search/users", async (req, res) => {
	try {
		const { q } = req.query;
		const result = await execute(
			`SELECT user_id AS "user_id", name AS "name", email AS "email", rating_avg AS "rating_avg"
			 FROM users
			 WHERE LOWER(name) LIKE '%' || LOWER(:q) || '%'
			 ORDER BY name`,
			{ q: q || "" },
			{ autoCommit: false },
		);
		res.status(200).json(result.rows);
	} catch (error) {
		const parsed = parseOracleError(error);
		res.status(parsed.status).json({ error: parsed.message });
	}
});

module.exports = router;
