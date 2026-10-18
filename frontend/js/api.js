const API_BASE_URL = "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(message, status, issues = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError("Не вдалося з’єднатися з API. Перевірте, чи запущений сервер.", 0);
    }
    throw error;
  }

  const contentType = response.headers.get("content-type") ?? "";
  let body = null;
  if (response.status !== 204 && contentType.includes("application/json")) {
    const text = await response.text();
    body = text ? JSON.parse(text) : null;
  }

  if (!response.ok) {
    const detail = body?.detail;
    const issues = Array.isArray(detail) ? detail : [];
    let message = `Запит завершився помилкою (${response.status}).`;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      const fields = detail
        .map((issue) => {
          const location = Array.isArray(issue.loc) ? issue.loc.join(".") : "дані";
          return `${location}: ${issue.msg}`;
        })
        .join("; ");
      message = fields ? `Перевірте введені дані: ${fields}` : message;
    }
    throw new ApiError(message, response.status, issues);
  }

  return body;
}

export const api = {
  get(path) {
    return request(path);
  },
  post(path, body) {
    return request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  put(path, body) {
    return request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  delete(path) {
    return request(path, { method: "DELETE" });
  },
};
