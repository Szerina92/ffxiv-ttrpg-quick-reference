const $ = id => document.getElementById(id);

const quickReference = $("quick-reference");
const overlay = $("rule-overlay");
const tooltip = document.querySelector(".rule-tooltip");
const tooltipTitle = $("rule-tooltip-title");
const tooltipContent = $("tooltip-content");
const tooltipEntryIcon = $("tooltip-entry-icon");
const themeToggle = $("theme-toggle");
const themeColor = $("theme-color");
const closeButton = $("rule-tooltip-close");

const THEME_KEY = "ffxiv-quickref-theme";
let rulesData;
let lastTrigger;

function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.checked = isDark;
  themeColor?.setAttribute("content", isDark ? "#292a2c" : "#f4f0e7");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function initializeTheme() {
  setTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
  themeToggle.addEventListener("change", () => setTheme(themeToggle.checked ? "dark" : "light"));
}

function createPlaceholder() {
  const placeholder = document.createElement("span");
  placeholder.className = "placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  return placeholder;
}

function createIcon(path, className) {
  const wrapper = document.createElement("span");
  wrapper.className = className;

  if (!path) {
    wrapper.appendChild(createPlaceholder());
    return wrapper;
  }

  const image = new Image();
  image.src = path;
  image.alt = "";
  image.addEventListener("error", () => wrapper.replaceChildren(createPlaceholder()), { once: true });
  wrapper.appendChild(image);
  return wrapper;
}

function formatText(text) {
  return String(text).replaceAll("<blue>", '<span class="ability-blue">').replaceAll("</blue>", "</span>");
}

async function loadRules() {
  const response = await fetch("./rules.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`rules.json: HTTP ${response.status}`);
  rulesData = await response.json();
}

function createRuleButton(category, entry) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "rule-entry";
  button.dataset.categoryId = category.id;
  button.dataset.entryId = entry.id;

  const name = document.createElement("span");
  name.textContent = entry.name;
  button.append(createIcon(entry.icon, "rule-icon"), name);
  return button;
}

function renderCategories() {
  quickReference.replaceChildren();

  for (const category of rulesData.categories) {
    const section = document.createElement("section");
    section.className = "category-card";

    const title = document.createElement("h2");
    title.textContent = category.name;

    const divider = document.createElement("div");
    divider.className = "category-rule";
    divider.setAttribute("aria-hidden", "true");

    const grid = document.createElement("div");
    grid.className = "rule-grid";
    for (const entry of category.entries) grid.appendChild(createRuleButton(category, entry));

    section.append(title, divider, grid);
    quickReference.appendChild(section);
  }
}

function findEntry(categoryId, entryId) {
  const category = rulesData.categories.find(item => item.id === categoryId);
  const entry = category?.entries.find(item => item.id === entryId);
  return entry ? { category, entry } : null;
}

function renderTooltip(entry) {
  tooltipTitle.textContent = entry.name;
  tooltipEntryIcon.replaceChildren();
  if (entry.icon) tooltipEntryIcon.appendChild(createIcon(entry.icon, "tooltip-entry-icon-image"));

  tooltipContent.replaceChildren();
  const { paragraphs = [], lists = [] } = entry.tooltip ?? {};

  for (const text of paragraphs) {
    const paragraph = document.createElement("p");
    paragraph.innerHTML = formatText(text);
    tooltipContent.appendChild(paragraph);
  }

  for (const texts of lists) {
    const list = document.createElement("ul");
    list.className = "rule-list";
    for (const text of texts) {
      const item = document.createElement("li");
      item.innerHTML = formatText(text);
      list.appendChild(item);
    }
    tooltipContent.appendChild(list);
  }
}

function showRule(result) {
  renderTooltip(result.entry);
  themeToggle.closest(".theme-switcher")?.setAttribute("hidden", "");
  overlay.hidden = false;
  document.body.classList.add("modal-open");
  tooltip.focus();
}

function openRule(button) {
  const result = findEntry(button.dataset.categoryId, button.dataset.entryId);
  if (!result) return;

  lastTrigger = button;
  const state = {
    ...(history.state || {}),
    quickrefModal: true,
    categoryId: button.dataset.categoryId,
    entryId: button.dataset.entryId
  };

  if (history.state?.quickrefModal) {
    history.replaceState(state, "", location.href);
  } else {
    history.pushState(state, "", location.href);
  }

  showRule(result);
}

function hideRule() {
  overlay.hidden = true;
  document.body.classList.remove("modal-open");
  themeToggle.closest(".theme-switcher")?.removeAttribute("hidden");
  lastTrigger?.focus();
  lastTrigger = null;
}

function closeRule() {
  if (overlay.hidden) return;

  const hasModalHistory = history.state?.quickrefModal;
  hideRule();

  if (hasModalHistory) history.back();
}

function createLoadError() {
  const section = document.createElement("section");
  section.className = "category-card";

  const title = document.createElement("h2");
  title.textContent = "Quick Reference";

  const divider = document.createElement("div");
  divider.className = "category-rule";

  const message = document.createElement("p");
  message.textContent = "Could not load rules.json. Please use the included local server.";

  section.append(title, divider, message);
  return section;
}

quickReference.addEventListener("click", event => {
  const button = event.target.closest(".rule-entry");
  if (button) openRule(button);
});

overlay.addEventListener("click", event => {
  if (event.target === overlay) closeRule();
});

closeButton.addEventListener("click", closeRule);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !overlay.hidden) closeRule();
});

window.addEventListener("popstate", event => {
  if (event.state?.quickrefModal) {
    const result = findEntry(event.state.categoryId, event.state.entryId);
    if (result) {
      lastTrigger = document.querySelector(
        `[data-category-id="${CSS.escape(event.state.categoryId)}"][data-entry-id="${CSS.escape(event.state.entryId)}"]`
      );
      showRule(result);
      return;
    }
  }

  hideRule();
});

async function initialize() {
  initializeTheme();
  try {
    await loadRules();
    renderCategories();
  } catch (error) {
    console.error(error);
    quickReference.replaceChildren(createLoadError());
  }
}

initialize();
