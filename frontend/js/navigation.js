const toggle = document.querySelector(".header__toggle");
const navigation = document.querySelector("#primary-navigation");

if (toggle instanceof HTMLButtonElement && navigation instanceof HTMLElement) {
  function setMenuOpen(isOpen) {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Закрити меню" : "Відкрити меню");
    navigation.classList.toggle("nav--open", isOpen);
  }

  toggle.addEventListener("click", () => {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (toggle.getAttribute("aria-expanded") === "true"
      && event.target instanceof Node
      && !navigation.contains(event.target)
      && !toggle.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  window.matchMedia("(min-width: 767.99px)").addEventListener("change", (event) => {
    if (event.matches) setMenuOpen(false);
  });
}
