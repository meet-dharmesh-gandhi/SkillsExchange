const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const apiRoutes = require("./routes/api");
const oracledb = require("oracledb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

app.use("/", apiRoutes);

app.get("/health", (req, res) => {
	res.status(200);
	res.send("Server is healthy!");
});

// Global error-handling middleware for uncaught Oracle errors
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err);
	if (err && err.errorNum && err.errorNum >= 20000 && err.errorNum <= 20999) {
		const msg = err.message.replace(/^ORA-\d+:\s*/, "");
		return res.status(400).json({ error: msg });
	}
	res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
	oracledb.initOracleClient();
});
