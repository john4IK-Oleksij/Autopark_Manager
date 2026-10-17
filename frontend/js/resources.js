import { api, ApiError } from "./api.js";

const companiesState = document.querySelector("#companies-state");
const companiesTable = document.querySelector("#companies-table-wrap");
const companiesRows = document.querySelector("#companies-rows");
const routesState = document.querySelector("#routes-state");
const routesTable = document.querySelector("#routes-table-wrap");
const routesRows = document.querySelector("#routes-rows");
const notice = document.querySelector("#resource-notice");
const dialog = document.querySelector("#resource-dialog");
const form = document.querySelector("#resource-form");
const formFields = document.querySelector("#form-fields");
const dialogError = document.querySelector("#dialog-error");
const saveButton = document.querySelector("#save-resource");

let companies = [];
let routes = [];
let editing = null;

function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = String(value);
  row.append(cell);
}

function addAction(row, label, action, id, variant = "") {
  const cell = row.lastElementChild ?? row.insertCell();
  const button = document.createElement("button");
  button.className = variant ? `button table-action ${variant}` : "button table-action";
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = String(id);
  button.textContent = label;
  cell.append(button);
}

function addActionsCell(row, ...actions) {
  row.insertCell();
  for (const action of actions) {
    addAction(row, ...action);
  }
}

function renderCompanies() {
  companiesRows.replaceChildren();
  for (const company of companies) {
    const row = document.createElement("tr");
    appendCell(row, company.name);
    appendCell(row, company.phone);
    addActionsCell(
      row,
      ["Змінити", "edit-company", company.id],
      ["Видалити", "delete-company", company.id, "button-danger"],
    );
    companiesRows.append(row);
  }
  companiesTable.hidden = companies.length === 0;
  companiesState.hidden = companies.length > 0;
  companiesState.dataset.state = companies.length === 0 ? "empty" : "loaded";
  companiesState.textContent = companies.length === 0
    ? "Поки немає перевізників. Додайте перший запис."
    : "";
}

function renderRoutes() {
  routesRows.replaceChildren();
  for (const route of routes) {
    const row = document.createElement("tr");
    appendCell(row, route.number);
    appendCell(row, route.title);
    appendCell(row, route.distance_km);
    appendCell(row, companies.find((company) => company.id === route.company_id)?.name
      ?? `Перевізник #${route.company_id}`);
    addActionsCell(
      row,
      ["Змінити", "edit-route", route.id],
      ["Видалити", "delete-route", route.id, "button-danger"],
    );
    routesRows.append(row);
  }
  routesTable.hidden = routes.length === 0;
  routesState.hidden = routes.length > 0;
  routesState.dataset.state = routes.length === 0 ? "empty" : "loaded";
  routesState.textContent = routes.length === 0
    ? "Поки немає маршрутів. Додайте перший запис."
    : "";
}

function showLoadError(state, error) {
  state.hidden = false;
  state.dataset.state = "error";
  state.textContent = error instanceof ApiError
    ? error.message
    : "Не вдалося завантажити дані. Спробуйте ще раз.";
}

async function loadCompanies() {
  companiesState.hidden = false;
  companiesState.dataset.state = "loading";
  companiesState.textContent = "Завантажуємо перевізників…";
  companiesTable.hidden = true;
  try {
    companies = await api.get("/companies");
    renderCompanies();
    renderRoutes();
  } catch (error) {
    showLoadError(companiesState, error);
  }
}

async function loadRoutes() {
  routesState.hidden = false;
  routesState.dataset.state = "loading";
  routesState.textContent = "Завантажуємо маршрути…";
  routesTable.hidden = true;
  try {
    routes = await api.get("/routes");
    renderRoutes();
  } catch (error) {
    showLoadError(routesState, error);
  }
}

function showNotice(message, variant = "success") {
  notice.hidden = false;
  notice.dataset.variant = variant;
  notice.textContent = message;
}

function getErrorMessage(error, resource) {
  if (!(error instanceof ApiError)) {
    return "Не вдалося виконати запит. Спробуйте ще раз.";
  }
  if (error.status === 409) {
    if (resource === "company") {
      return error.message.includes("related records")
        ? "Не можна видалити перевізника, поки до нього прив'язані ресурси."
        : "Перевізник із такою назвою вже існує.";
    }
    return error.message.includes("driver assignments")
      ? "Не можна видалити маршрут, поки на нього призначені водії."
      : "Маршрут із таким номером уже існує.";
  }
  if (error.status === 404) {
    return resource === "route" && error.message.includes("Company")
      ? "Оберіть перевізника, який існує."
      : "Запис не знайдено. Оновіть список і спробуйте ще раз.";
  }
  return error.message;
}

function makeField(labelText, name, type, value, { required = true, min, max, options } = {}) {
  const wrapper = document.createElement("label");
  wrapper.className = "form-field";
  const label = document.createElement("span");
  label.className = "form-label";
  label.textContent = labelText;

  const input = options ? document.createElement("select") : document.createElement("input");
  input.className = "form-control";
  input.name = name;
  input.required = required;
  if (options) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Оберіть перевізника";
    placeholder.disabled = true;
    placeholder.selected = !value;
    input.append(placeholder);
    for (const option of options) {
      const element = document.createElement("option");
      element.value = String(option.id);
      element.textContent = option.name;
      element.selected = Number(value) === option.id;
      input.append(element);
    }
  } else {
    input.type = type;
    input.value = value ?? "";
    if (type === "number") {
      input.step = "1";
      input.inputMode = "numeric";
    }
    if (min !== undefined) input.min = String(min);
    if (max !== undefined) input.maxLength = max;
  }
  wrapper.append(label, input);
  return wrapper;
}

function openDialog(resource, record = null) {
  editing = { resource, id: record?.id ?? null };
  const isCompany = resource === "company";
  document.querySelector("#dialog-kicker").textContent = isCompany ? "Перевізники" : "Маршрутна мережа";
  document.querySelector("#dialog-title").textContent = record
    ? `Редагувати ${isCompany ? "перевізника" : "маршрут"}`
    : `Новий ${isCompany ? "перевізник" : "маршрут"}`;
  dialogError.hidden = true;
  dialogError.textContent = "";
  formFields.replaceChildren();

  if (isCompany) {
    formFields.append(
      makeField("Назва перевізника", "name", "text", record?.name, { max: 120 }),
      makeField("Телефон", "phone", "tel", record?.phone, { max: 20 }),
    );
  } else {
    formFields.append(
      makeField("Номер маршруту", "number", "number", record?.number, { min: 1 }),
      makeField("Назва маршруту", "title", "text", record?.title, { max: 120 }),
      makeField("Відстань, км", "distance_km", "number", record?.distance_km, { min: 1 }),
      makeField("Перевізник", "company_id", "select", record?.company_id, { options: companies }),
    );
  }

  saveButton.disabled = !isCompany && companies.length === 0;
  if (!isCompany && companies.length === 0) {
    dialogError.hidden = false;
    dialogError.textContent = "Спершу створіть перевізника, щоб додати маршрут.";
  }
  dialog.showModal();
  form.querySelector("input, select")?.focus();
}

async function deleteRecord(resource, id) {
  const isCompany = resource === "company";
  const record = (isCompany ? companies : routes).find((item) => item.id === id);
  const label = isCompany ? record?.name : `маршрут №${record?.number}`;
  if (!window.confirm(`Видалити ${label ?? "цей запис"}?`)) return;

  try {
    await api.delete(`/${isCompany ? "companies" : "routes"}/${id}`);
    showNotice(isCompany ? "Перевізника видалено." : "Маршрут видалено.");
    if (isCompany) {
      await loadCompanies();
      await loadRoutes();
    } else {
      await loadRoutes();
    }
  } catch (error) {
    showNotice(getErrorMessage(error, resource), "danger");
    if (isCompany) await loadCompanies();
    else await loadRoutes();
  }
}

document.querySelectorAll("[data-create]").forEach((button) => {
  button.addEventListener("click", () => openDialog(button.dataset.create));
});

companiesRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const company = companies.find((item) => item.id === Number(button.dataset.id));
  if (!company) return;
  if (button.dataset.action === "edit-company") openDialog("company", company);
  if (button.dataset.action === "delete-company") void deleteRecord("company", company.id);
});

routesRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const route = routes.find((item) => item.id === Number(button.dataset.id));
  if (!route) return;
  if (button.dataset.action === "edit-route") openDialog("route", route);
  if (button.dataset.action === "delete-route") void deleteRecord("route", route.id);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!editing || !form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form).entries());
  const payload = editing.resource === "company"
    ? { name: values.name.trim(), phone: values.phone.trim() }
    : {
      number: Number(values.number),
      title: values.title.trim(),
      distance_km: Number(values.distance_km),
      company_id: Number(values.company_id),
    };
  const path = `/${editing.resource === "company" ? "companies" : "routes"}`;
  const isUpdate = editing.id !== null;
  saveButton.disabled = true;
  dialogError.hidden = true;
  try {
    await (isUpdate ? api.put(`${path}/${editing.id}`, payload) : api.post(path, payload));
    dialog.close();
    showNotice(editing.resource === "company"
      ? (isUpdate ? "Перевізника оновлено." : "Перевізника створено.")
      : (isUpdate ? "Маршрут оновлено." : "Маршрут створено."));
    if (editing.resource === "company") {
      await loadCompanies();
      await loadRoutes();
    } else {
      await loadRoutes();
    }
  } catch (error) {
    dialogError.textContent = getErrorMessage(error, editing.resource);
    dialogError.hidden = false;
  } finally {
    saveButton.disabled = false;
  }
});

function closeDialog() {
  dialogError.hidden = true;
  dialog.close();
  editing = null;
}

document.querySelector("#close-dialog").addEventListener("click", closeDialog);
document.querySelector("#cancel-dialog").addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

void Promise.all([loadCompanies(), loadRoutes()]);
