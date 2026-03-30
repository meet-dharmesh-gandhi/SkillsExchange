type OracleLikeError = {
	errorNum?: number;
	message?: string;
};

export function parseOracleError(error: unknown) {
	const oracleError = error as OracleLikeError;
	if (
		oracleError &&
		typeof oracleError.errorNum === "number" &&
		oracleError.errorNum >= 20000 &&
		oracleError.errorNum <= 20999
	) {
		const msg = (oracleError.message ?? "Validation error").replace(/^ORA-\d+:\s*/, "");
		return { status: 400, message: msg };
	}

	return { status: 500, message: oracleError?.message || "Internal server error" };
}
