import { api, ApiError } from "./api.js";

const resources = [
  { key: "companies", endpoint: "/companies" },
  { key: "buses", endpoint: "/buses" },
  { key: "routes", endpoint: "/routes" },
  { key: "drivers", endpoint: "/drivers?limit=1&offset=0" },
];

const apiStatus = document.querySelector("#api-status");
const apiStatusMessage = apiStatus.querySelector(".status-message");
const overviewMessage = document.querySelector("#overview-message");
const refreshButton = document.querySelector("#refresh-button");

function setApiStatus(state, message) {
  apiStatus.dataset.state = state;
  apiStatusMessage.textContent = message;
}

function setLoading() {
  overviewMessage.dataset.state = "loading";
  overviewMessage.textContent = "Завантажуємо дані…";
  for (const resource of resources) {
    const card = document.querySelector(`[data-resource="${resource.key}"]`);
    card.dataset.state = "loading";
    card.querySelector("[data-count]").textContent = "…";
    card.querySelector("[data-note]").textContent = "Завантажуємо";
  }
}

function getCount(resource, data) {
  if (resource.key === "drivers") {
    return data.total;
  }
  if (Array.isArray(data)) {
    return data.length;
  }
  throw new ApiError("API повернуло відповідь неочікуваного формату.", 502);
}

async function loadOverview() {
  refreshButton.disabled = true;
  setLoading();

  const [health, ...results] = await Promise.allSettled([
    api.get("/health"),
    ...resources.map(async (resource) => ({
      resource,
      count: getCount(resource, await api.get(resource.endpoint)),
    })),
  ]);
  const failures = [];

  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") {
      const { resource, count } = result.value;
      const card = document.querySelector(`[data-resource="${resource.key}"]`);
      card.dataset.state = count === 0 ? "empty" : "loaded";
      card.querySelector("[data-count]").textContent = String(count);
      card.querySelector("[data-note]").textContent = count === 0
        ? "Поки немає записів"
        : "Записів у системі";
    } else {
      const error = result.reason;
      const resource = resources[index];
      const card = document.querySelector(`[data-resource="${resource.key}"]`);
      card.dataset.state = "error";
      card.querySelector("[data-count]").textContent = "—";
      card.querySelector("[data-note]").textContent = error instanceof ApiError
        ? error.message
        : "Не вдалося завантажити дані";
      failures.push(error);
    }
  }

  if (health.status === "fulfilled" && health.value?.status === "ok") {
    setApiStatus("online", "API підключено");
  } else {
    setApiStatus("error", "API недоступне");
  }

  overviewMessage.dataset.state = failures.length ? "error" : "loaded";
  overviewMessage.textContent = failures.length
    ? "Не всі дані вдалося завантажити. Спробуйте оновити."
    : "Дані завантажено з API.";
  refreshButton.disabled = false;
}

refreshButton.addEventListener("click", loadOverview);
loadOverview();
