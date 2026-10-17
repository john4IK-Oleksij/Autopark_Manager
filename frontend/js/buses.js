import { api, ApiError } from "./api.js";

const busesState = document.querySelector("#buses-state");
const busesTable = document.querySelector("#buses-table-wrap");
const busesRows = document.querySelector("#buses-rows");
const busCount = document.querySelector("#bus-count");
const notice = document.querySelector("#bus-notice");
const searchInput = document.querySelector("#bus-search");
const companyFilter = document.querySelector("#company-filter");
const dialog = document.querySelector("#bus-dialog");
const form = document.querySelector("#bus-form");
const dialogError = document.querySelector("#dialog-error");
const saveButton = document.querySelector("#save-bus");

let buses = [];
let companies = [];
let editingId = null;

function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = String(value);
  row.append(cell);
}

function getVisibleBuses() {
  const query = searchInput.value.trim().toLocaleLowerCase("uk");
  const companyId = companyFilter.value;
  return buses.filter((bus) => {
    const company = companies.find((item) => item.id === bus.company_id);
    const searchable = `${bus.plate_number} ${bus.model} ${company?.name ?? ""}`
      .toLocaleLowerCase("uk");
    return (!query || searchable.includes(query))
      && (!companyId || bus.company_id === Number(companyId));
  });
}

function renderBuses() {
  busesRows.replaceChildren();
  const visibleBuses = getVisibleBuses();
  for (const bus of visibleBuses) {
    const row = document.createElement("tr");
    appendCell(row, bus.plate_number);
    appendCell(row, bus.model);
    appendCell(row, bus.seats);
    appendCell(row, companies.find((company) => company.id === bus.company_id)?.name
      ?? `Перевізник #${bus.company_id}`);

    const actions = row.insertCell();
    for (const [label, action, variant] of [
      ["Змінити", "edit", ""],
      ["Видалити", "delete", "button-danger"],
    ]) {
      const button = document.createElement("button");
      button.className = variant ? `button table-action ${variant}` : "button table-action";
      button.type = "button";
      button.dataset.action = action;
      button.dataset.id = String(bus.id);
      button.textContent = label;
      actions.append(button);
    }
    busesRows.append(row);
  }

  busCount.textContent = `(${visibleBuses.length}${visibleBuses.length !== buses.length
    ? ` з ${buses.length}`
    : ""})`;
  busesTable.hidden = visibleBuses.length === 0;
  busesState.hidden = visibleBuses.length > 0;
  if (visibleBuses.length === 0) {
    busesState.dataset.state = buses.length === 0 ? "empty" : "filtered-empty";
    busesState.textContent = buses.length === 0
      ? "Поки немає автобусів. Додайте перший запис."
      : "За цими фільтрами автобусів не знайдено.";
  }
}

function renderCompanyOptions() {
  const currentFilter = companyFilter.value;
  companyFilter.replaceChildren(new Option("Усі перевізники", ""));
  const formCompany = form.elements.company_id;
  formCompany.replaceChildren(new Option("Оберіть перевізника", ""));
  for (const company of companies) {
    companyFilter.add(new Option(company.name, String(company.id)));
    formCompany.add(new Option(company.name, String(company.id)));
  }
  if (companies.some((company) => String(company.id) === currentFilter)) {
    companyFilter.value = currentFilter;
  }
}

function showError(error) {
  busesState.hidden = false;
  busesState.dataset.state = "error";
  busesState.textContent = error instanceof ApiError
    ? error.message
    : "Не вдалося завантажити дані. Спробуйте ще раз.";
}

async function loadData() {
  busesState.hidden = false;
  busesState.dataset.state = "loading";
  busesState.textContent = "Завантажуємо автобуси…";
  busesTable.hidden = true;
  try {
    [buses, companies] = await Promise.all([
      api.get("/buses"),
      api.get("/companies"),
    ]);
    renderCompanyOptions();
    renderBuses();
  } catch (error) {
    showError(error);
  }
}

function showNotice(message, variant = "success") {
  notice.hidden = false;
  notice.dataset.variant = variant;
  notice.textContent = message;
}

function getErrorMessage(error, action) {
  if (!(error instanceof ApiError)) {
    return "Не вдалося виконати запит. Спробуйте ще раз.";
  }
  if (error.status === 409) {
    return action === "delete"
      ? "Не можна видалити автобус, поки до нього прив'язані записи."
      : "Автобус із таким номерним знаком уже існує.";
  }
  if (error.status === 404) {
    return error.message.includes("Company")
      ? "Оберіть перевізника, який існує."
      : "Автобус не знайдено. Оновіть список і спробуйте ще раз.";
  }
  return error.message;
}

function openDialog(bus = null) {
  editingId = bus?.id ?? null;
  document.querySelector("#dialog-title").textContent = bus ? "Редагувати автобус" : "Новий автобус";
  dialogError.hidden = true;
  dialogError.textContent = "";
  form.elements.plate_number.value = bus?.plate_number ?? "";
  form.elements.model.value = bus?.model ?? "";
  form.elements.seats.value = bus?.seats ?? "";
  form.elements.company_id.value = bus ? String(bus.company_id) : "";
  saveButton.disabled = companies.length === 0;
  if (companies.length === 0) {
    dialogError.hidden = false;
    dialogError.textContent = "Спершу створіть перевізника, щоб додати автобус.";
  }
  dialog.showModal();
  form.elements.plate_number.focus();
}

async function deleteBus(bus) {
  if (!window.confirm(`Видалити автобус ${bus.plate_number}?`)) return;
  try {
    await api.delete(`/buses/${bus.id}`);
    showNotice("Автобус видалено.");
    await loadData();
  } catch (error) {
    showNotice(getErrorMessage(error, "delete"), "danger");
    await loadData();
  }
}

document.querySelector("#create-bus").addEventListener("click", () => openDialog());
searchInput.addEventListener("input", renderBuses);
companyFilter.addEventListener("change", renderBuses);
document.querySelector("#reset-filters").addEventListener("click", () => {
  searchInput.value = "";
  companyFilter.value = "";
  renderBuses();
});

busesRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const bus = buses.find((item) => item.id === Number(button.dataset.id));
  if (!bus) return;
  if (button.dataset.action === "edit") openDialog(bus);
  if (button.dataset.action === "delete") void deleteBus(bus);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (companies.length === 0 || !form.reportValidity()) return;

  const values = new FormData(form);
  const payload = {
    plate_number: String(values.get("plate_number")).trim(),
    model: String(values.get("model")).trim(),
    seats: Number(values.get("seats")),
    company_id: Number(values.get("company_id")),
  };
  const path = editingId === null ? "/buses" : `/buses/${editingId}`;
  const isUpdate = editingId !== null;
  saveButton.disabled = true;
  dialogError.hidden = true;
  try {
    if (isUpdate) await api.put(path, payload);
    else await api.post(path, payload);
    dialog.close();
    showNotice(isUpdate ? "Автобус оновлено." : "Автобус створено.");
    await loadData();
  } catch (error) {
    dialogError.textContent = getErrorMessage(error, "save");
    dialogError.hidden = false;
  } finally {
    saveButton.disabled = companies.length === 0;
  }
});

function closeDialog() {
  dialog.close();
  dialogError.hidden = true;
  editingId = null;
}

document.querySelector("#close-dialog").addEventListener("click", closeDialog);
document.querySelector("#cancel-dialog").addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

void loadData();
