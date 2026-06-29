const i18n = {
  ru: {
    uploadButton: "???????? ???",
    heroTitle: "????, ??????????? ? ??????? ??? Approximately Up",
    heroText: "?????? ???????? ????????: ?????, ?????????, ?????? ???? ? ???????? ?????????? ??? ???????? ????? ? ????????.",
    modsCountLabel: "?????",
    currentBuildLabel: "??????? ????",
    searchLabel: "?????",
    searchPlaceholder: "????????, ????, ???????...",
    compatTitle: "?????????????",
    compatText: "? ??????? ???? ??????? ?????? ????, MelonLoader ? ?????? ????? ??????????.",
    statusOk: "????????",
    statusWarn: "?????????",
    statusBad: "??????",
    uploadTitle: "???????? ???",
    fieldName: "????????",
    fieldNamePlaceholder: "????????, Planet Runtime Editor",
    fieldCategory: "?????????",
    fieldGameVersion: "?????? ????",
    fieldFile: "???? ????",
    fieldDescription: "????????",
    fieldDescriptionPlaceholder: "??? ?????? ??? ? ??? ??? ??????????",
    saveDraft: "????????? ????????",
    download: "???????",
    details: "?????????",
    screenshots: "?????????",
    backToCatalog: "? ????? ? ????????",
    notFoundTitle: "?????? ?? ???????",
    notFoundText: "???????? ?????? ?????? ??? ?????????.",
    gameBuildInfo: "???? ????",
    loaderInfo: "??????",
    statusInfo: "??????",
    statsAria: "?????????? ????????",
    filtersAria: "???????",
    modsListAria: "?????? ?????",
    closeAria: "???????"
  },
  en: {
    uploadButton: "Upload mod",
    heroTitle: "Mods, tools and planets for Approximately Up",
    heroText: "A first working catalog prototype: search, categories, game builds and download cards already work directly in the browser.",
    modsCountLabel: "mods",
    currentBuildLabel: "current build",
    searchLabel: "Search",
    searchPlaceholder: "Editor, menu, planets...",
    compatTitle: "Compatibility",
    compatText: "Each mod shows the supported game build, MelonLoader version and post-update status.",
    statusOk: "Works",
    statusWarn: "Check",
    statusBad: "Broken",
    uploadTitle: "Upload mod",
    fieldName: "Name",
    fieldNamePlaceholder: "For example, Planet Runtime Editor",
    fieldCategory: "Category",
    fieldGameVersion: "Game version",
    fieldFile: "Mod file",
    fieldDescription: "Description",
    fieldDescriptionPlaceholder: "What the mod does and how to install it",
    saveDraft: "Save draft",
    download: "Download",
    details: "Details",
    screenshots: "Screenshots",
    backToCatalog: "? Back to catalog",
    notFoundTitle: "Nothing found",
    notFoundText: "Try another search or category.",
    gameBuildInfo: "Game build",
    loaderInfo: "Loader",
    statusInfo: "Status",
    statsAria: "Catalog statistics",
    filtersAria: "Filters",
    modsListAria: "Mods list",
    closeAria: "Close"
  }
};

const mods = [
  {
    id: "planet-runtime-editor",
    name: "Planet Runtime Editor",
    category: "Tools",
    version: "0.8.5",
    gameBuild: "23954373",
    loader: "MelonLoader 0.7.x",
    status: "warn",
    summary: {
      ru: "???????? ?????????, ???????, ??????????, ?????? ?????? ? host-only ????????????? ??? ????????????.",
      en: "Runtime editor for coordinates, radius, gravity, planet colors and host-only multiplayer synchronization."
    },
    longDescription: {
      ru: "????????? ???????? ??? ????????? ??????. ??? ????? ??? ??????, ????????????? ? ????? ? ????????????? ????????? ? ????? ?? ????????. ????? ?????????? ???? ??? ????? ????????? ????? ????? ? ????????????.",
      en: "A detailed page for the planet runtime editor. The mod is useful for testing, world experiments, and syncing host-side changes to clients. After game updates it should be checked before multiplayer use."
    },
    screenshots: ["Runtime editor", "Planet controls", "Host sync"],
    file: "https://raw.githubusercontent.com/cucumber666777/approximately-up-mods/main/downloads/PlanetRuntimeEditor_v0.8.5_host_sync.zip"
  },
  {
    id: "approximately-up-mod",
    name: "ApproximatelyUpMOD",
    category: "Gameplay",
    version: "2.6.x",
    gameBuild: "23954373",
    loader: "MelonLoader 0.7.x",
    status: "warn",
    summary: {
      ru: "??????? ???? ???????? ???????: ????????????, ???????? ??????????, ????????????? ? ????????? ??????.",
      en: "Main utility menu with safety tools, engine power tweaks, building changes and service buttons."
    },
    longDescription: {
      ru: "????????? ???????? ???????? ???-????. ? ??? ??????? ???????? ?????? ? ????????? ??????? ??? ???????? ???????????? ? ????????? ????. ??? ??????? ??? ????????? ????????, ?????? ??? ?????????? Approximately Up ????? ?????? ????????? ???????.",
      en: "A detailed page for the main mod menu. It collects useful buttons and service tools for fast testing and game tweaking. The mod is marked as check because Approximately Up updates can break individual features."
    },
    screenshots: ["Safety tools", "Gameplay tweaks", "Service buttons"],
    file: "https://raw.githubusercontent.com/cucumber666777/approximately-up-mods/main/downloads/ApproximatelyUpMOD_tools_suite_20260612_182240.zip"
  }
];

const categories = ["All", ...new Set(mods.map((mod) => mod.category))];
let currentLang = localStorage.getItem("auModsLang") || "ru";
let selectedCategory = "All";
let selectedModId = null;

const grid = document.querySelector("#modsGrid");
const chips = document.querySelector("#categoryChips");
const search = document.querySelector("#searchInput");
const modCount = document.querySelector("#modCount");
const uploadDialog = document.querySelector("#uploadDialog");
const catalogContent = document.querySelector(".content");
const controlsSection = document.querySelector(".controls");
const detailSection = document.querySelector("#modDetail");
const backToCatalog = document.querySelector("#backToCatalog");
const detailMeta = document.querySelector("#detailMeta");
const detailTitle = document.querySelector("#detailTitle");
const detailSummary = document.querySelector("#detailSummary");
const detailDownload = document.querySelector("#detailDownload");
const detailInfo = document.querySelector("#detailInfo");
const detailScreenshots = document.querySelector("#detailScreenshots");

function t(key) {
  return i18n[currentLang][key] || i18n.en[key] || key;
}

function statusLabel(status) {
  if (status === "ok") return t("statusOk");
  if (status === "warn") return t("statusWarn");
  return t("statusBad");
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  document.querySelectorAll(".lang-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
  });
  renderMods();
  if (selectedModId) showModDetail(selectedModId, false);
}

function renderChips() {
  chips.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = `chip${category === selectedCategory ? " active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      selectedCategory = category;
      renderChips();
      renderMods();
    });
    chips.appendChild(button);
  });
}

function renderMods() {
  const query = search.value.trim().toLowerCase();
  const filtered = mods.filter((mod) => {
    const matchesCategory = selectedCategory === "All" || mod.category === selectedCategory;
    const text = `${mod.name} ${mod.category} ${mod.summary[currentLang]}`.toLowerCase();
    return matchesCategory && text.includes(query);
  });

  modCount.textContent = filtered.length;
  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `<article class="mod-card"><h3>${t("notFoundTitle")}</h3><p>${t("notFoundText")}</p></article>`;
    return;
  }

  filtered.forEach((mod) => {
    const card = document.createElement("article");
    card.className = "mod-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.innerHTML = `
      <div class="meta">
        <span class="tag">${mod.category}</span>
        <span class="tag">v${mod.version}</span>
      </div>
      <h3>${mod.name}</h3>
      <p>${mod.summary[currentLang]}</p>
      <div class="status"><i class="dot ${mod.status}"></i>${statusLabel(mod.status)}</div>
      <div class="meta">
        <span class="tag">Build ${mod.gameBuild}</span>
        <span class="tag">${mod.loader}</span>
      </div>
      <div class="card-footer">
        <button class="download details-button" type="button">${t("details")}</button>
        <a class="download" href="${mod.file}" download>${t("download")}</a>
      </div>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      showModDetail(mod.id);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showModDetail(mod.id);
      }
    });
    grid.appendChild(card);
  });
}

function showModDetail(modId, shouldScroll = true) {
  const mod = mods.find((item) => item.id === modId);
  if (!mod) return;
  selectedModId = modId;
  controlsSection.hidden = true;
  catalogContent.hidden = true;
  detailSection.hidden = false;
  detailMeta.innerHTML = `<span class="tag">${mod.category}</span><span class="tag">v${mod.version}</span>`;
  detailTitle.textContent = mod.name;
  detailSummary.textContent = mod.longDescription[currentLang] || mod.summary[currentLang];
  detailDownload.href = mod.file;
  detailDownload.textContent = t("download");
  detailInfo.innerHTML = `
    <div><strong>${t("gameBuildInfo")}</strong><span>${mod.gameBuild}</span></div>
    <div><strong>${t("loaderInfo")}</strong><span>${mod.loader}</span></div>
    <div><strong>${t("statusInfo")}</strong><span>${statusLabel(mod.status)}</span></div>
  `;
  detailScreenshots.innerHTML = `<h3>${t("screenshots")}</h3>` + mod.screenshots.map((shot, index) => `
    <div class="screenshot-card">
      <div class="screenshot-art">${index + 1}</div>
      <span>${shot}</span>
    </div>
  `).join("");
  if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function hideModDetail() {
  selectedModId = null;
  detailSection.hidden = true;
  controlsSection.hidden = false;
  catalogContent.hidden = false;
}

document.querySelectorAll(".lang-button").forEach((button) => {
  button.addEventListener("click", () => {
    currentLang = button.dataset.lang;
    localStorage.setItem("auModsLang", currentLang);
    applyLanguage();
  });
});

backToCatalog.addEventListener("click", hideModDetail);

document.querySelector("#openUpload").addEventListener("click", () => {
  if (typeof uploadDialog.showModal === "function") {
    uploadDialog.showModal();
  }
});

search.addEventListener("input", renderMods);
renderChips();
applyLanguage();
