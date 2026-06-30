const texts = {
  ru: {
    account: "Аккаунт",
    logout: "Выйти",
    heroKicker: "Аккаунты",
    heroTitle: "Каталог модов с аккаунтами и будущей загрузкой модов",
    heroText: "Страница уже готова к Supabase: вход, профиль, черновики модов и каталог работают. Пока ключи Supabase не вставлены, сайт использует безопасный демо-режим в браузере.",
    mods: "модов",
    demoBackend: "Демо-режим: Supabase ещё не подключён. Можно проверить интерфейс без сервера.",
    liveBackend: "Supabase подключён. Аккаунты работают через настоящую базу.",
    search: "Поиск",
    searchPlaceholder: "Редактор, меню, планеты...",
    submit: "Выложить мод",
    profileTitle: "Профиль",
    guest: "Гость",
    guestText: "Войди в аккаунт, чтобы сохранять черновики и позже выкладывать моды.",
    demoUser: "Демо-пользователь",
    drafts: "Черновики",
    loginTitle: "Вход в аккаунт",
    accountHelp: "Когда Supabase будет подключён, здесь будет настоящий вход. Сейчас можно включить демо-профиль.",
    password: "Пароль",
    login: "Войти",
    signup: "Регистрация",
    demoLogin: "Войти в демо-режиме",
    demoLoginOk: "Демо-профиль включён.",
    fillAuth: "Введи email и пароль.",
    authNotReady: "Сначала вставь Supabase URL и anon key в accounts/supabase-config.js.",
    submitTitle: "Новый мод",
    submitHelp: "Пока это черновик. После подключения Supabase сюда добавим загрузку zip-файла и скриншотов.",
    modName: "Название",
    category: "Категория",
    version: "Версия",
    description: "Описание",
    saveDraft: "Сохранить черновик",
    draftSaved: "Черновик сохранён в браузере.",
    draftNeedName: "Нужно хотя бы название мода.",
    download: "Скачать",
    statusOk: "Работает",
    statusWarn: "Проверить",
    statusBad: "Сломан",
    empty: "Ничего не найдено"
  },
  en: {
    account: "Account",
    logout: "Log out",
    heroKicker: "Accounts",
    heroTitle: "A mod catalog with accounts and future uploads",
    heroText: "This page is ready for Supabase: sign-in, profile, drafts and the catalog already work. Until Supabase keys are added, the site uses a safe browser demo mode.",
    mods: "mods",
    demoBackend: "Demo mode: Supabase is not connected yet. You can test the interface without a server.",
    liveBackend: "Supabase is connected. Accounts use the real backend.",
    search: "Search",
    searchPlaceholder: "Editor, menu, planets...",
    submit: "Upload mod",
    profileTitle: "Profile",
    guest: "Guest",
    guestText: "Sign in to save drafts and later upload mods.",
    demoUser: "Demo user",
    drafts: "Drafts",
    loginTitle: "Account login",
    accountHelp: "When Supabase is connected, this becomes a real login. For now you can use the demo profile.",
    password: "Password",
    login: "Log in",
    signup: "Sign up",
    demoLogin: "Use demo profile",
    demoLoginOk: "Demo profile enabled.",
    fillAuth: "Enter email and password.",
    authNotReady: "Add Supabase URL and anon key to accounts/supabase-config.js first.",
    submitTitle: "New mod",
    submitHelp: "For now this saves a draft. After Supabase is connected we will add zip and screenshot uploads here.",
    modName: "Name",
    category: "Category",
    version: "Version",
    description: "Description",
    saveDraft: "Save draft",
    draftSaved: "Draft saved in this browser.",
    draftNeedName: "The mod needs at least a name.",
    download: "Download",
    statusOk: "Works",
    statusWarn: "Check",
    statusBad: "Broken",
    empty: "Nothing found"
  }
};

const builtInMods = [
  {
    id: "planet-runtime-editor",
    name: "Planet Runtime Editor",
    category: "Tools",
    version: "0.8.5",
    gameBuild: "23954373",
    loader: "MelonLoader 0.7.x",
    status: "warn",
    summary: {
      ru: "Редактор координат, радиуса, гравитации, цветов планет и host-only синхронизации для мультиплеера.",
      en: "Runtime editor for coordinates, radius, gravity, planet colors and host-only multiplayer synchronization."
    },
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
      ru: "Главное меню полезных функций: безопасность, мощность двигателей, строительство и служебные кнопки.",
      en: "Main utility menu with safety tools, engine power tweaks, building changes and service buttons."
    },
    file: "https://raw.githubusercontent.com/cucumber666777/approximately-up-mods/main/downloads/ApproximatelyUpMOD_tools_suite_20260612_182240.zip"
  }
];

let lang = localStorage.getItem("auModsAccountsLang") || "ru";
let selectedCategory = "All";
let sessionUser = JSON.parse(localStorage.getItem("auModsAccountsUser") || "null");
let draftMods = JSON.parse(localStorage.getItem("auModsAccountsDrafts") || "[]");
let supabaseClient = null;
let serverMods = [];
const config = window.AU_SUPABASE || {};
const hasSupabase = Boolean(config.url && config.anonKey && window.supabase);
if (hasSupabase) supabaseClient = window.supabase.createClient(config.url, config.anonKey);

const $ = (id) => document.getElementById(id);
const tr = (key) => texts[lang][key] || texts.en[key] || key;

function statusLabel(status) {
  if (status === "ok") return tr("statusOk");
  if (status === "bad") return tr("statusBad");
  return tr("statusWarn");
}

function allMods() {
  return [...builtInMods, ...serverMods, ...draftMods.map((mod) => ({ ...mod, status: "warn", file: "#" }))];
}

function categories() {
  return ["All", ...new Set(allMods().map((mod) => mod.category || "Tools"))];
}

function applyLanguage() {
  document.documentElement.lang = lang;
  $("accountButton").textContent = sessionUser ? tr("logout") : tr("account");
  $("heroKicker").textContent = tr("heroKicker");
  $("heroTitle").textContent = tr("heroTitle");
  $("heroText").textContent = tr("heroText");
  $("modCountLabel").textContent = tr("mods");
  $("backendStatus").textContent = hasSupabase ? tr("liveBackend") : tr("demoBackend");
  $("searchLabel").textContent = tr("search");
  $("searchInput").placeholder = tr("searchPlaceholder");
  $("openSubmit").textContent = tr("submit");
  $("accountTitle").textContent = tr("loginTitle");
  $("accountHelp").textContent = tr("accountHelp");
  $("passwordLabel").textContent = tr("password");
  $("loginButton").textContent = tr("login");
  $("signupButton").textContent = tr("signup");
  $("demoLoginButton").textContent = tr("demoLogin");
  $("submitTitle").textContent = tr("submitTitle");
  $("submitHelp").textContent = tr("submitHelp");
  $("modNameLabel").textContent = tr("modName");
  $("modCategoryLabel").textContent = tr("category");
  $("modVersionLabel").textContent = tr("version");
  $("modDescriptionLabel").textContent = tr("description");
  $("saveDraftButton").textContent = tr("saveDraft");
  document.querySelectorAll(".lang-button").forEach((button) => button.classList.toggle("active", button.dataset.lang === lang));
  renderProfile();
  renderChips();
  renderMods();
}

function renderProfile() {
  const profile = $("profileCard");
  const userName = sessionUser?.email || tr("guest");
  const draftCount = draftMods.length;
  profile.innerHTML = `
    <p class="eyebrow">${tr("profileTitle")}</p>
    <h3>${sessionUser ? userName : tr("guest")}</h3>
    <p>${sessionUser ? tr("demoUser") : tr("guestText")}</p>
    <div class="meta"><span class="tag">${tr("drafts")}: ${draftCount}</span><span class="tag">${hasSupabase ? "Supabase" : "Demo"}</span></div>
  `;
}

function renderChips() {
  const chips = $("categoryChips");
  chips.innerHTML = "";
  categories().forEach((category) => {
    const button = document.createElement("button");
    button.className = `chip${category === selectedCategory ? " active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => { selectedCategory = category; renderChips(); renderMods(); });
    chips.appendChild(button);
  });
}

function renderMods() {
  const query = $("searchInput").value.trim().toLowerCase();
  const filtered = allMods().filter((mod) => {
    const summary = mod.summary?.[lang] || mod.summary?.en || mod.description || "";
    const categoryOk = selectedCategory === "All" || mod.category === selectedCategory;
    return categoryOk && `${mod.name} ${mod.category} ${summary}`.toLowerCase().includes(query);
  });
  $("modCount").textContent = filtered.length;
  const grid = $("modsGrid");
  grid.innerHTML = "";
  if (!filtered.length) {
    grid.innerHTML = `<article class="mod-card"><h3>${tr("empty")}</h3></article>`;
    return;
  }
  filtered.forEach((mod) => {
    const summary = mod.summary?.[lang] || mod.summary?.en || mod.description || "";
    const card = document.createElement("article");
    card.className = "mod-card";
    card.innerHTML = `
      <div class="meta"><span class="tag">${mod.category || "Tools"}</span><span class="tag">v${mod.version || "draft"}</span></div>
      <h3>${mod.name}</h3>
      <p>${summary}</p>
      <div class="status"><i class="dot ${mod.status || "warn"}"></i>${statusLabel(mod.status)}</div>
      <div class="meta"><span class="tag">Build ${mod.gameBuild || "unknown"}</span><span class="tag">${mod.loader || "MelonLoader"}</span></div>
      <div class="card-footer"><a class="download" href="${mod.file || "#"}" ${mod.file && mod.file !== "#" ? "download" : ""}>${tr("download")}</a></div>
    `;
    grid.appendChild(card);
  });
}

async function loadSession() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  if (data.session?.user) {
    sessionUser = { email: data.session.user.email, id: data.session.user.id, live: true };
    localStorage.setItem("auModsAccountsUser", JSON.stringify(sessionUser));
  }
}

async function loadModsFromSupabase() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from("mods").select("*").eq("published", true).order("created_at", { ascending: false });
  if (!error && Array.isArray(data)) {
    serverMods = data.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category || "Tools",
      version: row.version || "0.1.0",
      gameBuild: row.game_build || "unknown",
      loader: row.loader || "MelonLoader",
      status: row.status || "warn",
      summary: { ru: row.summary_ru || row.description || "", en: row.summary_en || row.description || "" },
      file: row.file_url || "#"
    }));
  }
}

async function auth(mode) {
  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;
  if (!email || !password) { $("accountMessage").textContent = tr("fillAuth"); return; }
  if (!supabaseClient) { $("accountMessage").textContent = tr("authNotReady"); return; }
  const result = mode === "signup"
    ? await supabaseClient.auth.signUp({ email, password })
    : await supabaseClient.auth.signInWithPassword({ email, password });
  if (result.error) { $("accountMessage").textContent = result.error.message; return; }
  sessionUser = { email, id: result.data.user?.id, live: true };
  localStorage.setItem("auModsAccountsUser", JSON.stringify(sessionUser));
  $("accountDialog").close();
  applyLanguage();
}

function saveDraft() {
  const name = $("modNameInput").value.trim();
  if (!name) { $("submitMessage").textContent = tr("draftNeedName"); return; }
  draftMods.unshift({
    id: `draft-${Date.now()}`,
    name,
    category: $("modCategoryInput").value,
    version: $("modVersionInput").value.trim() || "0.1.0",
    summary: { ru: $("modDescriptionInput").value.trim(), en: $("modDescriptionInput").value.trim() },
    gameBuild: "draft",
    loader: "MelonLoader"
  });
  localStorage.setItem("auModsAccountsDrafts", JSON.stringify(draftMods));
  $("submitMessage").textContent = tr("draftSaved");
  renderProfile();
  renderChips();
  renderMods();
}

$("accountButton").addEventListener("click", async () => {
  if (sessionUser) {
    if (supabaseClient && sessionUser.live) await supabaseClient.auth.signOut();
    sessionUser = null;
    localStorage.removeItem("auModsAccountsUser");
    applyLanguage();
    return;
  }
  $("accountMessage").textContent = "";
  $("accountDialog").showModal();
});
$("openSubmit").addEventListener("click", () => { $("submitMessage").textContent = ""; $("submitDialog").showModal(); });
$("loginButton").addEventListener("click", () => auth("login"));
$("signupButton").addEventListener("click", () => auth("signup"));
$("demoLoginButton").addEventListener("click", () => {
  sessionUser = { email: "demo@approximately-up.local", demo: true };
  localStorage.setItem("auModsAccountsUser", JSON.stringify(sessionUser));
  $("accountMessage").textContent = tr("demoLoginOk");
  setTimeout(() => { $("accountDialog").close(); applyLanguage(); }, 450);
});
$("saveDraftButton").addEventListener("click", saveDraft);
$("searchInput").addEventListener("input", renderMods);
document.querySelectorAll(".lang-button").forEach((button) => {
  button.addEventListener("click", () => { lang = button.dataset.lang; localStorage.setItem("auModsAccountsLang", lang); applyLanguage(); });
});

(async function init() {
  await loadSession();
  await loadModsFromSupabase();
  applyLanguage();
})();


