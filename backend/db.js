const oracledb = require("oracledb");
const dotenv = require("dotenv");

dotenv.config();

const dbConfig = {
	user: process.env.ORACLE_USER,
	password: process.env.ORACLE_PASSWORD,
	connectString: process.env.ORACLE_CONNECT_STRING,
};

async function execute(sql, binds = {}, options = {}) {
	let connection;

	try {
		oracledb.initOracleClient();
		connection = await oracledb.getConnection(dbConfig);
		return await connection.execute(sql, binds, {
			autoCommit: true,
			outFormat: oracledb.OUT_FORMAT_OBJECT,
			...options,
		});
	} finally {
		if (connection) {
			await connection.close();
		}
	}
}

module.exports = {
	execute,
	oracledb,
};
