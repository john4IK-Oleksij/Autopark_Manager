import { api, ApiError } from "./api.js";
import { confirmAction, decorateAction, LETTER_PATTERN, PHONE_MESSAGE, PHONE_PATTERN, showBanner } from "./ui.js";

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
  button.className = variant ? `button button--compact ${variant}` : "button button--compact";
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = String(id);
  decorateAction(button, label, action.startsWith("edit") ? "edit" : "delete");
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
      ["Видалити", "delete-company", company.id, "button--danger"],
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
      ["Видалити", "delete-route", route.id, "button--danger"],
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
  if (variant === "success") {
    notice.hidden = true;
    showBanner(message);
    return;
  }
  notice.hidden = false;
  notice.dataset.variant = variant;
  notice.textContent = message;
}

function getErrorMessage(error, resource) {
  if (!(error instanceof ApiError)) {
    return "Не вдалося виконати запит. Спробуйте ще раз.";
  }
  if (error.status === 409) return error.message;
  if (error.status === 404) {
    return resource === "route" && error.message.includes("Перевізника")
      ? "Оберіть перевізника, який існує."
      : "Запис не знайдено. Оновіть список і спробуйте ще раз.";
  }
  return error.message;
}

const FIELD_RULES = {
  name: {
    label: "Назва перевізника",
    min: 2,
    max: 120,
    pattern: LETTER_PATTERN,
    patternMessage: "Назва перевізника не може складатися лише з цифр чи символів.",
  },
  phone: { label: "Телефон", min: 7, max: 20, pattern: PHONE_PATTERN, patternMessage: PHONE_MESSAGE },
  title: {
    label: "Назва маршруту",
    min: 3,
    max: 120,
    pattern: LETTER_PATTERN,
    patternMessage: "Назва маршруту не може складатися лише з цифр чи символів.",
  },
};
const NUMBER_RULES = {
  number: { label: "Номер маршруту", min: 1, max: 2147483647 },
  distance_km: { label: "Відстань", min: 1, max: 5000 },
};

function setFieldError(name, message) {
  const target = form.querySelector(`[data-error-for="${name}"]`);
  if (!target) return false;
  target.textContent = message;
  target.hidden = !message;
  form.elements[name].setAttribute("aria-invalid", message ? "true" : "false");
  return true;
}

function clearErrors() {
  form.querySelectorAll("[data-error-for]").forEach((item) => setFieldError(item.dataset.errorFor, ""));
  dialogError.hidden = true;
  dialogError.textContent = "";
}

function validateForm(values) {
  let firstInvalid = null;
  const fail = (name, message) => {
    setFieldError(name, message);
    firstInvalid ??= name;
  };
  for (const [name, rule] of Object.entries(FIELD_RULES)) {
    if (!(name in values)) continue;
    const text = String(values[name]).trim();
    const length = text.length;
    if (length < rule.min || length > rule.max) {
      fail(name, `${rule.label}: від ${rule.min} до ${rule.max} символів.`);
    } else if (rule.pattern && !rule.pattern.test(text)) {
      fail(name, rule.patternMessage);
    }
  }
  for (const [name, rule] of Object.entries(NUMBER_RULES)) {
    if (!(name in values)) continue;
    const value = Number(values[name]);
    if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
      fail(name, `${rule.label}: ціле число від ${rule.min} до ${rule.max}.`);
    }
  }
  if ("company_id" in values && !values.company_id) fail("company_id", "Оберіть перевізника.");
  return firstInvalid;
}

function showSaveError(error, resource) {
  if (error instanceof ApiError && error.status === 422 && error.issues.length > 0) {
    let unmatched = false;
    for (const issue of error.issues) {
      const field = Array.isArray(issue.loc) ? issue.loc[issue.loc.length - 1] : null;
      if (!setFieldError(field, issue.msg)) unmatched = true;
    }
    if (!unmatched) return;
  }
  dialogError.textContent = getErrorMessage(error, resource);
  dialogError.hidden = false;
}

function makeField(labelText, name, type, value, { required = true, min, max, options } = {}) {
  const wrapper = document.createElement("label");
  wrapper.className = "form__field";
  const label = document.createElement("span");
  label.className = "form__label";
  label.textContent = labelText;
  const fieldError = document.createElement("span");
  fieldError.className = "form__error";
  fieldError.dataset.errorFor = name;
  fieldError.hidden = true;

  const input = options ? document.createElement("select") : document.createElement("input");
  input.className = "form__control";
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
  wrapper.append(label, input, fieldError);
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
  const record = (isCompany ? companies : routes).find(
    (item) => item.id === id
  );
  const label = isCompany
    ? record?.name
    : `маршрут №${record?.number}`;
  if (isCompany) {
    try {
      const [buses, routes, firstDriversPage] = await Promise.all([
        api.get("/buses"),
        api.get("/routes"),
        api.get("/drivers?limit=100&offset=0"),
      ]);
      const companyBuses = buses.filter(
        (bus) => bus.company_id === id
      );
      const companyRoutes = routes.filter(
        (route) => route.company_id === id
      );
      let companyDrivers = firstDriversPage.items.filter(
        (driver) => driver.company_id === id
      );
      const total = firstDriversPage.total;
      const limit = firstDriversPage.limit;
      for (let offset = limit; offset < total; offset += limit) {
        const page = await api.get(
          `/drivers?limit=${limit}&offset=${offset}`
        );
        companyDrivers = companyDrivers.concat(
          page.items.filter((driver) => driver.company_id === id)
        );
      }
      if (
        companyBuses.length ||
        companyDrivers.length ||
        companyRoutes.length
      ) {
        const details = [];
        if (companyBuses.length) {
          details.push(`автобусів: ${companyBuses.length}`);
        }
        if (companyDrivers.length) {
          details.push(`водіїв: ${companyDrivers.length}`);
        }
        if (companyRoutes.length) {
          details.push(`маршрутів: ${companyRoutes.length}`);
        }
        showNotice(
          `Не можна видалити перевізника: ${details.join(", ")}. Спочатку видаліть або перепризначте пов’язані записи.`,
          "danger"
        );
        return;
      }
    } catch (error) {
      showNotice(
        "Не вдалося перевірити пов’язані записи. Видалення скасовано.",
        "danger"
      );
      return;
    }
  }
  if (!(await confirmAction(`Видалити ${label ?? "цей запис"}?`))) {
    return;
  }
  try {
    await api.delete(
      `/${isCompany ? "companies" : "routes"}/${id}`
    );
    showNotice(
      isCompany ? "Перевізника видалено." : "Маршрут видалено."
    );
    if (isCompany) {
      await loadCompanies();
      await loadRoutes();
    } else {
      await loadRoutes();
    }
  } catch (error) {
    showNotice(getErrorMessage(error, resource), "danger");
    if (isCompany) {
      await loadCompanies();
    } else {
      await loadRoutes();
    }
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
  if (!editing) return;

  const values = Object.fromEntries(new FormData(form).entries());
  clearErrors();
  const invalid = validateForm(values);
  if (invalid) {
    form.elements[invalid].focus();
    return;
  }
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
    showSaveError(error, editing.resource);
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

function applyView() {
  const view = window.location.hash.slice(1);
  document.querySelector("#companies").hidden = view === "routes";
  document.querySelector("#routes").hidden = view === "companies";
}

window.addEventListener("hashchange", applyView);
applyView();
void Promise.all([loadCompanies(), loadRoutes()]);
