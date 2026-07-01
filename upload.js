const supabaseConfig = window.AU_SUPABASE || {};
const hasSupabase = Boolean(supabaseConfig.url && supabaseConfig.anonKey && window.supabase);
const supabaseClient = hasSupabase ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
let sessionUser = null;
let screenshotUrls = [];

const refs = {
  accountButton: document.querySelector("#accountButton"),
  profileAvatar: document.querySelector("#profileAvatar"),
  profileName: document.querySelector("#profileName"),
  profileMenu: document.querySelector("#profileMenu"),
  statusTitle: document.querySelector("#uploadStatusTitle"),
  statusText: document.querySelector("#uploadStatusText"),
  authBox: document.querySelector("#authBox"),
  email: document.querySelector("#emailInput"),
  password: document.querySelector("#passwordInput"),
  login: document.querySelector("#loginButton"),
  signup: document.querySelector("#signupButton"),
  accountMessage: document.querySelector("#accountMessage"),
  form: document.querySelector("#uploadForm"),
  file: document.querySelector("#modFileInput"),
  screenshots: document.querySelector("#modScreenshotsInput"),
  screenshotTitles: document.querySelector("#screenshotTitleList"),
  name: document.querySelector("#modNameInput"),
  category: document.querySelector("#modCategoryInput"),
  version: document.querySelector("#modVersionInput"),
  build: document.querySelector("#modBuildInput"),
  loader: document.querySelector("#modLoaderInput"),
  status: document.querySelector("#modStatusInput"),
  summary: document.querySelector("#modSummaryInput"),
  description: document.querySelector("#modDescriptionInput"),
  accent: document.querySelector("#modAccentInput"),
  previewBg: document.querySelector("#modPreviewBgInput"),
  uploadMessage: document.querySelector("#uploadMessage"),
  publish: document.querySelector("#publishButton"),
  previewMain: document.querySelector("#previewMain"),
  previewMeta: document.querySelector("#previewMeta"),
  previewTitle: document.querySelector("#previewTitle"),
  previewSummary: document.querySelector("#previewSummary"),
  previewDownload: document.querySelector("#previewDownload"),
  previewInfo: document.querySelector("#previewInfo"),
  previewScreenshots: document.querySelector("#previewScreenshots")
};

function text(value, fallback) {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function statusLabel(value) {
  if (value === "ok") return "Works";
  if (value === "bad") return "Broken";
  return "Needs check";
}

function sanitizeStorageName(name) {
  return String(name || "file").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

function getPublicStorageUrl(bucket, path) {
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || "#";
}

async function getSupabaseUser() {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) return null;
  return data.user || null;
}

async function uploadFileToSupabase(bucket, userId, file, prefix = "") {
  const path = `${userId}/${Date.now()}-${prefix}${sanitizeStorageName(file.name)}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return { path, url: getPublicStorageUrl(bucket, path) };
}

function getScreenshotTitle(index, fallback) {
  const input = refs.screenshotTitles?.querySelector(`[data-screenshot-title="${index}"]`);
  return text(input?.value, fallback);
}

function selectedScreenshotFiles() {
  return Array.from(refs.screenshots.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 5);
}

function buildRecord() {
  const file = refs.file.files?.[0];
  if (!text(refs.name.value, "")) throw new Error("Enter the mod name.");
  if (!file || !/\.(zip|dll)$/i.test(file.name)) throw new Error("Attach a .zip or .dll mod file.");
  const summary = text(refs.summary.value, text(refs.description.value, refs.name.value));
  return {
    name: text(refs.name.value, "Untitled mod"),
    category: refs.category.value,
    version: text(refs.version.value, "1.0.0"),
    gameBuild: text(refs.build.value, "23954373"),
    loader: text(refs.loader.value, "MelonLoader"),
    status: refs.status.value,
    summary,
    description: text(refs.description.value, summary),
    fileBlob: file,
    screenshots: selectedScreenshotFiles().map((file, index) => ({ name: getScreenshotTitle(index, file.name), blob: file }))
  };
}

async function publish(record) {
  if (!supabaseClient) throw new Error("Supabase is not connected. Fill supabase-config.js first.");
  const user = await getSupabaseUser();
  if (!user) throw new Error("Log in or create an account first.");
  const modFile = await uploadFileToSupabase("mod-files", user.id, record.fileBlob);
  const screenshots = [];
  for (let index = 0; index < record.screenshots.length; index += 1) {
    const shot = record.screenshots[index];
    const uploaded = await uploadFileToSupabase("mod-screenshots", user.id, shot.blob, `${index + 1}-`);
    screenshots.push({ image: uploaded.url, path: uploaded.path, title: { ru: shot.name, en: shot.name } });
  }
  const payload = {
    author_id: user.id,
    name: record.name,
    category: record.category,
    version: record.version,
    game_build: record.gameBuild,
    loader: record.loader,
    status: record.status,
    summary_ru: record.summary,
    summary_en: record.summary,
    description: record.description,
    file_url: modFile.url,
    file_path: modFile.path,
    screenshots,
    published: true
  };
  const { error } = await supabaseClient.from("mods").insert(payload);
  if (error) throw error;
}

async function refreshAccount() {
  sessionUser = await getSupabaseUser();
  const name = sessionUser?.email?.split("@")[0] || "Guest";
  refs.profileName.textContent = name;
  refs.profileAvatar.alt = name;
  refs.statusTitle.textContent = sessionUser ? "Ready to publish" : "Account required";
  refs.statusText.textContent = hasSupabase ? (sessionUser ? sessionUser.email : "Log in before publishing") : "Supabase is not connected";
  refs.authBox.hidden = Boolean(sessionUser);
  refs.profileMenu.innerHTML = sessionUser
    ? `<div class="profile-menu-head"><img class="avatar avatar-image large" src="assets/default-avatar.png" alt="${name}"><div><strong>${name}</strong><small>Supabase</small></div></div><button class="profile-menu-item danger" type="button" id="logoutButton">Log out</button>`
    : `<div class="profile-menu-head"><img class="avatar avatar-image large" src="assets/default-avatar.png" alt="Guest"><div><strong>Guest</strong><small>Not logged in</small></div></div><p>Log in on this page to publish a mod.</p>`;
  const logout = document.querySelector("#logoutButton");
  if (logout) logout.addEventListener("click", async () => { await supabaseClient.auth.signOut(); refs.profileMenu.hidden = true; await refreshAccount(); });
}

function refreshScreenshotUrls() {
  screenshotUrls.forEach((url) => URL.revokeObjectURL(url));
  screenshotUrls = Array.from(refs.screenshots.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 5).map((file) => URL.createObjectURL(file));
}

function updatePreview() {
  const name = text(refs.name.value, "Your mod name");
  const category = refs.category.value;
  const version = text(refs.version.value, "1.0.0");
  const build = text(refs.build.value, "23954373");
  const loader = text(refs.loader.value, "MelonLoader");
  const status = refs.status.value;
  const summary = text(refs.description.value, text(refs.summary.value, "Describe what your mod does. The preview updates while you type."));
  refs.previewMain.style.setProperty("--preview-accent", refs.accent.value);
  refs.previewMain.style.borderColor = refs.accent.value;
  refs.previewMain.className = `detail-main preview-bg-${refs.previewBg.value}`;
  refs.previewMeta.innerHTML = `<span class="tag">${escapeHtml(category)}</span><span class="tag">v${escapeHtml(version)}</span>`;
  refs.previewTitle.textContent = name;
  refs.previewSummary.textContent = summary;
  refs.previewDownload.textContent = "Download";
  refs.previewDownload.style.background = refs.accent.value;
  refs.previewInfo.innerHTML = `<div><strong>Game build</strong><span>${escapeHtml(build)}</span></div><div><strong>Loader</strong><span>${escapeHtml(loader)}</span></div><div><strong>Status</strong><span>${statusLabel(status)}</span></div>`;
  refs.previewScreenshots.innerHTML = `<h3>Screenshots</h3>` + (screenshotUrls.length ? screenshotUrls.map((url, index) => {
    const title = escapeHtml(getScreenshotTitle(index, `Screenshot ${index + 1}`));
    return `<div class="screenshot-card"><img class="screenshot-image" src="${url}" alt="${title}"><span>${title}</span></div>`;
  }).join("") : [1, 2, 3].map((item) => `<div class="screenshot-card"><div class="screenshot-art">${item}</div><span>Screenshot slot ${item}</span></div>`).join(""));
}

async function auth(mode) {
  if (!supabaseClient) { refs.accountMessage.textContent = "Supabase is not connected."; return; }
  const email = refs.email.value.trim().toLowerCase();
  const password = refs.password.value;
  if (!email || !password) { refs.accountMessage.textContent = "Enter email and password."; return; }
  const result = mode === "signup"
    ? await supabaseClient.auth.signUp({ email, password })
    : await supabaseClient.auth.signInWithPassword({ email, password });
  if (result.error) { refs.accountMessage.textContent = result.error.message; return; }
  refs.accountMessage.textContent = mode === "signup" ? "Account created." : "Logged in.";
  await refreshAccount();
}

refs.accountButton.addEventListener("click", (event) => {
  event.stopPropagation();
  refs.profileMenu.hidden = !refs.profileMenu.hidden;
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".profile-menu-wrap")) refs.profileMenu.hidden = true;
});
refs.login.addEventListener("click", () => auth("login"));
refs.signup.addEventListener("click", () => auth("signup"));
refs.screenshots.addEventListener("change", () => { refreshScreenshotUrls(); updatePreview(); });
refs.screenshotTitles?.addEventListener("input", updatePreview);
[refs.name, refs.category, refs.version, refs.build, refs.loader, refs.status, refs.summary, refs.description, refs.accent, refs.previewBg].forEach((node) => {
  node.addEventListener("input", updatePreview);
  node.addEventListener("change", updatePreview);
});
refs.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  refs.uploadMessage.textContent = "";
  refs.publish.disabled = true;
  try {
    const record = buildRecord();
    refs.uploadMessage.textContent = "Uploading to Supabase...";
    await publish(record);
    refs.uploadMessage.textContent = "Mod published. It should appear in the catalog now.";
    refs.form.reset();
    refreshScreenshotUrls();
    updatePreview();
  } catch (error) {
    refs.uploadMessage.textContent = error.message || String(error);
  } finally {
    refs.publish.disabled = false;
  }
});

refreshAccount();
updatePreview();
