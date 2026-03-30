const API_BASE = "/api";

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

async function handleResponse(res: Response) {
	const text = await res.text();
	const data = text ? JSON.parse(text) : null;
	if (!res.ok) {
		throw new ApiError(data?.error || "Something went wrong", res.status);
	}
	return data;
}

export async function apiGet(path: string) {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { "Content-Type": "application/json" },
	});
	return handleResponse(res);
}

export async function apiPost(path: string, body: unknown) {
	const res = await fetch(`${API_BASE}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return handleResponse(res);
}

export async function apiPut(path: string, body: unknown) {
	const res = await fetch(`${API_BASE}${path}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return handleResponse(res);
}

export async function apiDelete(path: string) {
	const res = await fetch(`${API_BASE}${path}`, {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
	});
	return handleResponse(res);
}
