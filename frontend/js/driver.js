import { api, ApiError } from "./api.js";

const state = document.querySelector("#driver-state");
const retryButton = document.querySelector("#retry-driver");
const content = document.querySelector("#driver-content");
const nameHeading = document.querySelector("#driver-name");
const phoneField = document.querySelector("#driver-phone");
const licenseField = document.querySelector("#driver-license");
const companyField = document.querySelector("#driver-company");
const routesCount = document.querySelector("#routes-count");
const routesState = document.querySelector("#routes-state");
const routesWrap = document.querySelector("#routes-table-wrap");
const routesRows = document.querySelector("#routes-rows");
const actionMessage = document.querySelector("#action-message");
const assignForm = document.querySelector("#assign-form");
const assignSelect = document.querySelector("#assign-route");
const assignSubmit = document.querySelector("#assign-submit");
const assignHint = document.querySelector("#assign-hint");

const rawId = new URLSearchParams(window.location.search).get("id");
const driverId = /^[1-9]\d*$/.test(rawId ?? "") ? Number(rawId) : null;

let driver = null;
let assignedRoutes = [];
let companyRoutes = [];
let busy = false;

function isDriver(value) {
  return value !== null
    && typeof value === "object"
    && Number.isInteger(value.id)
    && typeof value.full_name === "string"
    && typeof value.phone === "string"
    && typeof value.license_number === "string"
    && Number.isInteger(value.company_id);
}

function isRouteList(value) {
  return Array.isArray(value)
    && value.every((route) => Number.isInteger(route.id)
      && Number.isInteger(route.number)
      && typeof route.title === "string"
      && Number.isInteger(route.distance_km)
      && Number.isInteger(route.company_id));
}

function isCompanyList(value) {
  return Array.isArray(value)
    && value.every((company) => Number.isInteger(company.id)
      && typeof company.name === "string");
}

function pluralizeRoutes(count) {
  const isSingular = count % 10 === 1 && count % 100 !== 11;
  return `${count} ${isSingular ? "маршруту" : "маршрутів"}`;
}

function assignmentMessage(error) {
  if (!(error instanceof ApiError)) return "Не вдалося виконати дію. Спробуйте ще раз.";
  switch (error.status) {
    case 404:
      return "Водія, маршрут або призначення не знайдено. Оновіть сторінку.";
    case 409:
      return "Це призначення вже існує або змінилося. Дані оновлено.";
    case 422:
      return "Водій і маршрут мають належати одному перевізнику.";
    default:
      return error.message;
  }
}

function showMessage(text, kind) {
  actionMessage.hidden = false;
  actionMessage.dataset.state = kind;
  actionMessage.textContent = text;
}

function showFatal(text, canRetry) {
  content.hidden = true;
  state.hidden = false;
  state.dataset.state = "error";
  state.textContent = text;
  retryButton.hidden = !canRetry;
}

function renderRoutes() {
  routesRows.replaceChildren();
  routesCount.textContent = `— допущений до ${pluralizeRoutes(assignedRoutes.length)}`;

  for (const route of assignedRoutes) {
    const row = document.createElement("tr");
    for (const value of [route.number, route.title, `${route.distance_km} км`]) {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.append(cell);
    }
    const actions = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-danger table-action";
    button.textContent = "Зняти";
    button.setAttribute("aria-label", `Зняти з маршруту ${route.number}`);
    button.disabled = busy;
    button.addEventListener("click", () => void unassign(route));
    actions.append(button);
    row.append(actions);
    routesRows.append(row);
  }

  routesWrap.hidden = assignedRoutes.length === 0;
  routesState.hidden = assignedRoutes.length > 0;
  routesState.dataset.state = "empty";
  routesState.textContent = "Водія ще не призначено на жоден маршрут.";

  const assignedIds = new Set(assignedRoutes.map((route) => route.id));
  const available = companyRoutes.filter((route) => !assignedIds.has(route.id));
  assignSelect.replaceChildren();
  const placeholder = new Option(
    available.length > 0 ? "Оберіть маршрут" : "Немає доступних маршрутів",
    "",
  );
  assignSelect.append(placeholder);
  for (const route of available) {
    assignSelect.append(new Option(`№${route.number} — ${route.title} (${route.distance_km} км)`, String(route.id)));
  }
  assignSelect.disabled = busy || available.length === 0;
  assignSubmit.disabled = busy || available.length === 0;
  assignHint.textContent = companyRoutes.length === 0
    ? "У перевізника цього водія ще немає маршрутів."
    : "Показано лише маршрути того самого перевізника.";
}

async function loadRoutes() {
  const [routesResponse, allRoutes] = await Promise.all([
    api.get(`/drivers/${driverId}/routes`),
    api.get("/routes"),
  ]);
  if (!isRouteList(routesResponse) || !isRouteList(allRoutes)) {
    throw new ApiError("API повернуло дані неочікуваного формату.", 502);
  }
  assignedRoutes = routesResponse;
  companyRoutes = allRoutes.filter((route) => route.company_id === driver.company_id);
}

async function loadAll() {
  if (driverId === null) {
    showFatal("Некоректне посилання: не вказано ID водія.", false);
    return;
  }

  state.hidden = false;
  state.dataset.state = "loading";
  state.textContent = "Завантажуємо водія…";
  retryButton.hidden = true;
  content.hidden = true;

  try {
    const [driverResponse, companies] = await Promise.all([
      api.get(`/drivers/${driverId}`),
      api.get("/companies"),
    ]);
    if (!isDriver(driverResponse) || !isCompanyList(companies)) {
      throw new ApiError("API повернуло дані неочікуваного формату.", 502);
    }
    driver = driverResponse;
    await loadRoutes();

    nameHeading.textContent = driver.full_name;
    phoneField.textContent = driver.phone;
    licenseField.textContent = driver.license_number;
    companyField.textContent = companies.find((company) => company.id === driver.company_id)?.name
      ?? `Перевізник #${driver.company_id}`;
    document.title = `${driver.full_name} — Автопарк`;
    state.hidden = true;
    content.hidden = false;
    renderRoutes();
    if (window.location.hash === "#assign-form") {
      assignForm.scrollIntoView({ block: "center" });
      assignSelect.focus();
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      showFatal("Водія не знайдено. Можливо, його вже видалено.", false);
    } else {
      showFatal(error instanceof ApiError
        ? error.message
        : "Не вдалося завантажити дані. Спробуйте ще раз.", true);
    }
  }
}

async function refreshRoutes() {
  try {
    await loadRoutes();
  } catch (error) {
    showMessage(assignmentMessage(error), "error");
  }
  renderRoutes();
}

async function unassign(route) {
  if (busy) return;
  if (!window.confirm(`Скасувати допуск водія до маршруту №${route.number}?`)) return;
  busy = true;
  actionMessage.hidden = true;
  renderRoutes();
  try {
    await api.delete(`/assignments/${driver.id}/${route.id}`);
    await refreshRoutes();
    showMessage(`Водія знято з маршруту №${route.number}.`, "success");
  } catch (error) {
    await refreshRoutes();
    showMessage(assignmentMessage(error), "error");
  } finally {
    busy = false;
    renderRoutes();
  }
}

assignForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;

  const routeId = Number(assignSelect.value);
  if (!routeId) {
    showMessage("Оберіть маршрут зі списку.", "error");
    assignSelect.focus();
    return;
  }

  const route = companyRoutes.find((item) => item.id === routeId);
  busy = true;
  actionMessage.hidden = true;
  renderRoutes();
  try {
    await api.post("/assignments", { driver_id: driver.id, route_id: routeId });
    await refreshRoutes();
    showMessage(`Водія призначено на маршрут №${route?.number ?? routeId}.`, "success");
  } catch (error) {
    await refreshRoutes();
    showMessage(assignmentMessage(error), "error");
  } finally {
    busy = false;
    renderRoutes();
  }
});

retryButton.addEventListener("click", () => void loadAll());

void loadAll();
