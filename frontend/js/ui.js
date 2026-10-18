const BANNER_VISIBLE_MS = 4000;
export const PHONE_PATTERN = /^\+?[0-9 ()-]+$/;
export const PHONE_MESSAGE = "Телефон може містити лише цифри, пробіли, дужки, дефіс і «+» на початку.";
export const LETTER_PATTERN = /\p{L}/u;
let banner;
let hideTimer;

export function decorateAction(button, label, kind) {
  button.classList.add("button--action");
  if (kind === "edit") button.classList.add("button--edit");

  const icon = document.createElement("span");
  icon.className = "button__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = kind === "edit" ? "✎" : "✕";

  const text = document.createElement("span");
  text.className = "button__label";
  text.textContent = label;

  button.replaceChildren(icon, text);
  button.setAttribute("aria-label", label);
  button.title = label;
}

export function confirmAction(message, confirmLabel = "Видалити", keepLabel = "Залишити") {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "dialog confirm";
    dialog.setAttribute("aria-label", "Підтвердження дії");

    const text = document.createElement("p");
    text.className = "confirm__text";
    text.textContent = message;

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "button";
    cancel.textContent = keepLabel;

    const accept = document.createElement("button");
    accept.type = "button";
    accept.className = "button button--danger";
    accept.textContent = confirmLabel;

    const actions = document.createElement("div");
    actions.className = "confirm__actions";
    actions.append(cancel, accept);
    dialog.append(text, actions);

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      resolve(value);
    };
    cancel.addEventListener("click", () => finish(false));
    accept.addEventListener("click", () => finish(true));
    dialog.addEventListener("cancel", () => finish(false));
    dialog.addEventListener("close", () => finish(false));

    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}

export function showBanner(message) {
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "banner";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.hidden = true;
    document.body.prepend(banner);
  }

  clearTimeout(hideTimer);
  const icon = document.createElement("span");
  icon.className = "banner__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "✓";
  const text = document.createElement("span");
  text.textContent = message;
  banner.replaceChildren(icon, text);

  banner.hidden = false;
  void banner.offsetWidth;
  banner.classList.add("banner--visible");

  hideTimer = setTimeout(() => {
    banner.classList.remove("banner--visible");
    hideTimer = setTimeout(() => { banner.hidden = true; }, 250);
  }, BANNER_VISIBLE_MS);
}
