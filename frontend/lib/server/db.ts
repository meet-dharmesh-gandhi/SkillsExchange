import oracledb from "oracledb";

const dbConfig = {
	user: process.env.ORACLE_USER,
	password: process.env.ORACLE_PASSWORD,
	connectString: process.env.ORACLE_CONNECT_STRING,
};

export { oracledb };

export async function execute<T = unknown>(
	sql: string,
	binds: oracledb.BindParameters = {} as oracledb.BindParameters,
	options: oracledb.ExecuteOptions = {},
) {
	let connection: oracledb.Connection | undefined;

	try {
		if (process.env.NODE_ENV === "development") {
			oracledb.initOracleClient();
		}
		connection = await oracledb.getConnection(dbConfig);
		return await connection.execute<T>(sql, binds, {
			autoCommit: true,
			outFormat: oracledb.OUT_FORMAT_OBJECT,
			...options,
		} as oracledb.ExecuteOptions);
	} finally {
		if (connection) {
			await connection.close();
		}
	}
}
