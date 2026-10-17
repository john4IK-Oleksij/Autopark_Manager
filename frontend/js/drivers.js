import { api, ApiError } from "./api.js";

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

let drivers = [];
let companies = [];
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
    appendCell(row, driver.full_name);
    appendCell(row, driver.phone);
    appendCell(row, driver.license_number);
    appendCell(row, companies.find((company) => company.id === driver.company_id)?.name
      ?? `Перевізник #${driver.company_id}`);
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

void loadDrivers();
