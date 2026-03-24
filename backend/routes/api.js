const express = require("express");
const { execute, oracledb } = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
	try {
		const { name, email, password } = req.body;
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

		res.status(201).json({
			message: "User registered",
			user_id: result.outBinds.user_id[0],
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		const result = await execute(
			`SELECT user_id, name, email, rating_avg
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
		res.status(500).json({ error: error.message });
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
		res.status(500).json({ error: error.message });
	}
});

router.post("/add-new-skill", async (req, res) => {
	try {
		const { skill_name } = req.body;
		const result = await execute(
			`INSERT INTO skills (skill_id, skill_name)
			 VALUES (skills_seq.NEXTVAL, :skill_name)
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
		res.status(500).json({ error: error.message });
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
		res.status(500).json({ error: error.message });
	}
});

router.post("/match-users", async (req, res) => {
	try {
		await execute(`BEGIN match_users; END;`);
		res.status(200).json({ message: "Matching complete" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.post("/schedule-session", async (req, res) => {
	try {
		const { match_id, time } = req.body;
		const scheduledTime = new Date(time);

		if (Number.isNaN(scheduledTime.getTime())) {
			return res.status(400).json({ error: "Invalid time" });
		}

		await execute(
			`INSERT INTO sessions (session_id, match_id, scheduled_time, status)
			 VALUES (sessions_seq.NEXTVAL, :match_id, :scheduled_time, 'scheduled')`,
			{ match_id, scheduled_time: scheduledTime },
		);

		res.status(201).json({ message: "Session scheduled" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.post("/rate-user", async (req, res) => {
	try {
		const { session_id, rater_id, rated_id, rating, review } = req.body;

		await execute(
			`INSERT INTO ratings (rating_id, session_id, rater_id, rated_id, rating, review)
			 VALUES (ratings_seq.NEXTVAL, :session_id, :rater_id, :rated_id, :rating, :review)`,
			{ session_id, rater_id, rated_id, rating, review },
		);

		const ratingResult = await execute(
			`SELECT calculate_rating(:rated_id) AS rating_avg FROM dual`,
			{ rated_id },
			{ autoCommit: false },
		);

		const ratingAvg = ratingResult.rows[0].RATING_AVG;

		await execute(`UPDATE users SET rating_avg = :rating_avg WHERE user_id = :rated_id`, {
			rating_avg: ratingAvg,
			rated_id,
		});

		res.status(201).json({
			message: "Rating submitted",
			rating_avg: ratingAvg,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.get("/matches/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const result = await execute(
			`SELECT *
			 FROM matches
			 WHERE user1_id = :userId OR user2_id = :userId`,
			{ userId },
			{ autoCommit: false },
		);

		res.status(200).json(result.rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
