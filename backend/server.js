const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.get("/health", (req, res) => {
	res.status(200);
	res.send("Server is healthy!");
});

app.listen(9000, () => {
	console.log("server listening on port 3000");
});
