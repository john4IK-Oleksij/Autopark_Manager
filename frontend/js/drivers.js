import { api, ApiError } from "./api.js";
import { confirmAction, decorateAction, PHONE_MESSAGE, PHONE_PATTERN, showBanner } from "./ui.js";

const driversState = document.querySelector("#drivers-state");
const driversTable = document.querySelector("#drivers-table-wrap");
const driversRows = document.querySelector("#drivers-rows");
const driversTotal = document.querySelector("#drivers-total");
const driversSummary = document.querySelector("#drivers-summary");
const pagination = document.querySelector("#driver-pagination");
const previousButton = document.querySelector("#previous-page");
const nextButton = document.querySelector("#next-page");
const retryButton = document.querySelector("#retry-drivers");
const refreshButton = document.querySelector("#refresh-drivers");
const searchInput = document.querySelector("#driver-search");
const pageSizeSelect = document.querySelector("#page-size");
const pageIndicator = document.querySelector("#page-indicator");
const notice = document.querySelector("#driver-notice");
const dialog = document.querySelector("#driver-dialog");
const form = document.querySelector("#driver-form");
const dialogError = document.querySelector("#dialog-error");
const saveButton = document.querySelector("#save-driver");

const FIELD_RULES = {
  full_name: { label: "ПІБ", min: 3, max: 120 },
  phone: { label: "Телефон", min: 7, max: 20, pattern: PHONE_PATTERN, patternMessage: PHONE_MESSAGE },
  license_number: {
    label: "Номер посвідчення",
    min: 5,
    max: 20,
    pattern: /\d/,
    patternMessage: "Номер посвідчення має містити хоча б одну цифру.",
  },
};

let drivers = [];
let companies = [];
let editingId = null;
let saving = false;
let total = 0;
let limit = Number(pageSizeSelect.value);
let offset = 0;
let loading = false;

function isDriverPage(value) {
  return value !== null
    && typeof value === "object"
    && Array.isArray(value.items)
    && Number.isInteger(value.total)
    && Number.isInteger(value.limit)
    && Number.isInteger(value.offset)
    && value.items.every((driver) => Number.isInteger(driver.id)
      && typeof driver.full_name === "string"
      && typeof driver.phone === "string"
      && typeof driver.license_number === "string"
      && Number.isInteger(driver.company_id));
}

function isCompanyList(value) {
  return Array.isArray(value)
    && value.every((company) => Number.isInteger(company.id)
      && typeof company.name === "string");
}

function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = String(value);
  row.append(cell);
}

function appendNameCell(row, driver) {
  const cell = document.createElement("td");
  const link = document.createElement("a");
  link.className = "table__link";
  link.href = `driver.html?id=${driver.id}`;
  link.textContent = driver.full_name;
  cell.append(link);
  row.append(cell);
}

function appendActionsCell(row, driver) {
  const cell = row.insertCell();

  const assign = document.createElement("a");
  assign.className = "button button--compact";
  assign.href = `driver.html?id=${driver.id}#assign-form`;
  assign.textContent = "Призначити";
  cell.append(assign);

  for (const [label, action, variant] of [
    ["Змінити", "edit", ""],
    ["Видалити", "delete", "button--danger"],
  ]) {
    const button = document.createElement("button");
    button.className = variant ? `button button--compact ${variant}` : "button button--compact";
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = String(driver.id);
    decorateAction(button, label, action === "edit" ? "edit" : "delete");
    cell.append(button);
  }
}

function getVisibleDrivers() {
  const query = searchInput.value.trim().toLocaleLowerCase("uk");
  if (!query) return drivers;

  return drivers.filter((driver) => {
    const company = companies.find((item) => item.id === driver.company_id);
    const searchable = [
      driver.full_name,
      driver.phone,
      driver.license_number,
      company?.name ?? "",
    ].join(" ").toLocaleLowerCase("uk");
    return searchable.includes(query);
  });
}

function renderDrivers() {
  const visibleDrivers = getVisibleDrivers();
  driversRows.replaceChildren();

  for (const driver of visibleDrivers) {
    const row = document.createElement("tr");
    appendNameCell(row, driver);
    appendCell(row, driver.phone);
    appendCell(row, driver.license_number);
    appendCell(row, companies.find((company) => company.id === driver.company_id)?.name
      ?? `Перевізник #${driver.company_id}`);
    appendActionsCell(row, driver);
    driversRows.append(row);
  }

  const firstRecord = total === 0 ? 0 : offset + 1;
  const lastRecord = Math.min(offset + drivers.length, total);
  driversSummary.textContent = total === 0
    ? "Поки немає водіїв."
    : `Сторінка містить записи ${firstRecord}–${lastRecord} з ${total}.`
    + (searchInput.value.trim()
      ? ` Збігів на цій сторінці: ${visibleDrivers.length}.`
      : "");
  driversTotal.textContent = `(${total})`;
  driversTable.hidden = visibleDrivers.length === 0;
  driversState.hidden = visibleDrivers.length > 0;

  if (visibleDrivers.length === 0) {
    driversState.dataset.state = total === 0 ? "empty" : "filtered-empty";
    driversState.textContent = total === 0
      ? "Поки немає водіїв."
      : "На цій сторінці водіїв за таким пошуком не знайдено.";
  }

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  pageIndicator.textContent = `Сторінка ${currentPage} з ${pageCount}`;
  previousButton.disabled = loading || offset === 0;
  nextButton.disabled = loading || currentPage >= pageCount;
  pagination.hidden = total === 0;
}

function showError(error) {
  driversState.hidden = false;
  driversState.dataset.state = "error";
  driversState.textContent = error instanceof ApiError
    ? error.message
    : "Не вдалося завантажити дані. Спробуйте ще раз.";
  driversTable.hidden = true;
  pagination.hidden = true;
  driversSummary.textContent = "";
  driversTotal.textContent = "";
  retryButton.hidden = false;
  searchInput.disabled = true;
  pageSizeSelect.disabled = true;
}

function setLoading() {
  driversState.hidden = false;
  driversState.dataset.state = "loading";
  driversState.textContent = "Завантажуємо водіїв…";
  driversTable.hidden = true;
  pagination.hidden = true;
  retryButton.hidden = true;
  refreshButton.disabled = true;
  searchInput.disabled = true;
  pageSizeSelect.disabled = true;
  previousButton.disabled = true;
  nextButton.disabled = true;
}

async function loadDrivers() {
  if (loading) return;
  loading = true;
  setLoading();

  try {
    let page;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      const [pageResponse, companyResponse] = await Promise.all([
        api.get(`/drivers?${params}`),
        api.get("/companies"),
      ]);
      if (!isDriverPage(pageResponse) || !isCompanyList(companyResponse)) {
        throw new ApiError("API повернуло дані неочікуваного формату.", 502);
      }
      page = pageResponse;
      companies = companyResponse;
      renderCompanyOptions();

      if (page.total > 0 && offset >= page.total && attempt === 0) {
        offset = Math.floor((page.total - 1) / limit) * limit;
        continue;
      }
      break;
    }

    drivers = page.items;
    total = page.total;
    limit = page.limit;
    offset = page.offset;
    searchInput.disabled = false;
    pageSizeSelect.disabled = false;
    driversState.hidden = true;
    driversState.dataset.state = total === 0 ? "empty" : "loaded";
    retryButton.hidden = true;
    renderDrivers();
  } catch (error) {
    showError(error);
  } finally {
    loading = false;
    refreshButton.disabled = false;
    previousButton.disabled = offset === 0;
    nextButton.disabled = total === 0 || offset + limit >= total;
  }
}

searchInput.addEventListener("input", renderDrivers);
pageSizeSelect.addEventListener("change", () => {
  limit = Number(pageSizeSelect.value);
  offset = 0;
  void loadDrivers();
});
previousButton.addEventListener("click", () => {
  if (loading || offset === 0) return;
  offset = Math.max(0, offset - limit);
  void loadDrivers();
});
nextButton.addEventListener("click", () => {
  if (loading || offset + limit >= total) return;
  offset += limit;
  void loadDrivers();
});
retryButton.addEventListener("click", () => void loadDrivers());
refreshButton.addEventListener("click", () => void loadDrivers());

function renderCompanyOptions() {
  const select = form.elements.company_id;
  const selected = select.value;
  select.replaceChildren(new Option("Оберіть перевізника", ""));
  for (const company of companies) {
    select.add(new Option(company.name, String(company.id)));
  }
  select.value = selected;
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

function setFieldError(name, message) {
  const target = form.querySelector(`[data-error-for="${name}"]`);
  if (!target) return false;
  target.textContent = message;
  target.hidden = !message;
  form.elements[name].setAttribute("aria-invalid", message ? "true" : "false");
  return true;
}

function clearErrors() {
  for (const name of [...Object.keys(FIELD_RULES), "company_id"]) setFieldError(name, "");
  dialogError.hidden = true;
  dialogError.textContent = "";
}

function readPayload() {
  const values = new FormData(form);
  return {
    full_name: String(values.get("full_name")).trim(),
    phone: String(values.get("phone")).trim(),
    license_number: String(values.get("license_number")).trim(),
    company_id: Number(values.get("company_id")),
  };
}

function validate(payload) {
  let firstInvalid = null;
  const fail = (name, message) => {
    setFieldError(name, message);
    firstInvalid ??= name;
  };

  for (const [name, rule] of Object.entries(FIELD_RULES)) {
    const length = payload[name].length;
    if (length < rule.min || length > rule.max) {
      fail(name, `${rule.label}: від ${rule.min} до ${rule.max} символів.`);
    } else if (rule.pattern && !rule.pattern.test(payload[name])) {
      fail(name, rule.patternMessage);
    }
  }
  if (!payload.company_id) fail("company_id", "Оберіть перевізника.");
  return firstInvalid;
}

function showSaveError(error) {
  if (!(error instanceof ApiError)) {
    dialogError.textContent = "Не вдалося виконати запит. Спробуйте ще раз.";
    dialogError.hidden = false;
    return;
  }
  if (error.status === 422 && error.issues.length > 0) {
    let unmatched = false;
    for (const issue of error.issues) {
      const field = Array.isArray(issue.loc) ? issue.loc[issue.loc.length - 1] : null;
      if (!setFieldError(field, issue.msg)) unmatched = true;
    }
    if (!unmatched) return;
  }
  dialogError.textContent = error.message;
  dialogError.hidden = false;
}

function openDialog(driver = null) {
  editingId = driver?.id ?? null;
  clearErrors();
  document.querySelector("#dialog-title").textContent = driver ? "Редагувати водія" : "Новий водій";
  form.elements.full_name.value = driver?.full_name ?? "";
  form.elements.phone.value = driver?.phone ?? "";
  form.elements.license_number.value = driver?.license_number ?? "";
  form.elements.company_id.value = driver ? String(driver.company_id) : "";
  saveButton.disabled = companies.length === 0;
  if (companies.length === 0) {
    dialogError.hidden = false;
    dialogError.textContent = "Спершу створіть перевізника, щоб додати водія.";
  }
  dialog.showModal();
  form.elements.full_name.focus();
}

function closeDialog() {
  dialog.close();
  clearErrors();
  editingId = null;
}

async function deleteDriver(driver) {
  if (!(await confirmAction(`Видалити водія ${driver.full_name}? Його допуски до маршрутів буде видалено.`))) return;
  try {
    await api.delete(`/drivers/${driver.id}`);
    showNotice("Водія видалено.");
  } catch (error) {
    showNotice(error instanceof ApiError ? error.message : "Не вдалося видалити водія.", "danger");
  }
  await loadDrivers();
}

document.querySelector("#create-driver").addEventListener("click", () => openDialog());
document.querySelector("#close-dialog").addEventListener("click", closeDialog);
document.querySelector("#cancel-dialog").addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

driversRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const driver = drivers.find((item) => item.id === Number(button.dataset.id));
  if (!driver) return;
  if (button.dataset.action === "edit") openDialog(driver);
  if (button.dataset.action === "delete") void deleteDriver(driver);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving || companies.length === 0) return;

  clearErrors();
  const payload = readPayload();
  const invalid = validate(payload);
  if (invalid) {
    form.elements[invalid].focus();
    return;
  }

  const isUpdate = editingId !== null;
  saving = true;
  saveButton.disabled = true;
  try {
    if (isUpdate) await api.put(`/drivers/${editingId}`, payload);
    else await api.post("/drivers", payload);
    closeDialog();
    showNotice(isUpdate ? "Дані водія оновлено." : "Водія створено.");
    await loadDrivers();
  } catch (error) {
    showSaveError(error);
  } finally {
    saving = false;
    saveButton.disabled = companies.length === 0;
  }
});

void loadDrivers();
