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

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
	oracledb.initOracleClient();
});
