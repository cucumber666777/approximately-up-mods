const supabaseConfig = window.AU_SUPABASE || {};
const hasSupabase = Boolean(supabaseConfig.url && supabaseConfig.anonKey && window.supabase);
const supabaseClient = hasSupabase ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
let sessionUser = null;
let screenshotUrls = [];
const REVIEW_EMAIL = "cucumber993993@gmail.com";

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
  fileName: document.querySelector("#modFileName"),
  screenshots: document.querySelector("#modScreenshotsInput"),
  screenshotsName: document.querySelector("#modScreenshotsName"),
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

function updateFileLabels() {
  const modFile = refs.file.files?.[0];
  if (refs.fileName) refs.fileName.textContent = modFile ? modFile.name : "No file selected";
  const screenshotCount = refs.screenshots.files?.length || 0;
  if (refs.screenshotsName) refs.screenshotsName.textContent = screenshotCount ? `${screenshotCount} file${screenshotCount === 1 ? "" : "s"} selected` : "No file selected";
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

function buildReviewEmailUrl(record, result) {
  const lines = [
    "A new Approximately Up mod was submitted for manual review.",
    "",
    `Mod: ${record.name}`,
    `Submitter: ${result.submitterEmail || "unknown"}`,
    `Supabase row id: ${result.modId || "unknown"}`,
    `Category: ${record.category}`,
    `Version: ${record.version}`,
    `Game build: ${record.gameBuild}`,
    `Loader: ${record.loader}`,
    `Status: ${statusLabel(record.status)}`,
    "",
    `Mod file: ${result.payload.file_url}`,
    "",
    "Screenshots:",
    ...(result.payload.screenshots.length ? result.payload.screenshots.map((shot, index) => `${index + 1}. ${shot.title?.en || shot.title?.ru || "Screenshot"}: ${shot.image}`) : ["No screenshots attached."]),
    "",
    "Short description:",
    record.summary,
    "",
    "Full description:",
    record.description,
    "",
    "To approve it, open Supabase table public.mods and set published = true for this row."
  ];
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(REVIEW_EMAIL)}&su=${encodeURIComponent(`[AU Mods Review] ${record.name}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
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
    published: false
  };
  const { data, error } = await supabaseClient.from("mods").insert(payload).select("id").single();
  if (error) throw error;
  return { payload, modId: data?.id, submitterEmail: user.email };
}

async function refreshAccount() {
  sessionUser = await getSupabaseUser();
  const name = sessionUser?.email?.split("@")[0] || "Guest";
  refs.profileName.textContent = name;
  refs.profileAvatar.alt = name;
  refs.statusTitle.textContent = sessionUser ? "Ready to submit" : "Account required";
  refs.statusText.textContent = hasSupabase ? (sessionUser ? sessionUser.email : "Log in before submitting") : "Supabase is not connected";
  refs.authBox.hidden = Boolean(sessionUser);
  refs.profileMenu.innerHTML = sessionUser
    ? `<div class="profile-menu-head"><img class="avatar avatar-image large" src="assets/default-avatar.png" alt="${name}"><div><strong>${name}</strong><small>Supabase</small></div></div><button class="profile-menu-item danger" type="button" id="logoutButton">Log out</button>`
    : `<div class="profile-menu-head"><img class="avatar avatar-image large" src="assets/default-avatar.png" alt="Guest"><div><strong>Guest</strong><small>Not logged in</small></div></div><p>Log in on this page to submit a mod for review.</p>`;
  const logout = document.querySelector("#logoutButton");
  if (logout) logout.addEventListener("click", async () => { await supabaseClient.auth.signOut(); refs.profileMenu.hidden = true; await refreshAccount(); });
}

function refreshScreenshotTitleFields(files) {
  if (!refs.screenshotTitles) return;
  refs.screenshotTitles.innerHTML = files.length ? files.map((file, index) => {
    const fallback = escapeHtml(file.name.replace(/\.[^.]+$/, ""));
    return `<label><span>Screenshot title ${index + 1}</span><input type="text" data-screenshot-title="${index}" value="${fallback}" placeholder="Example: Main mod window"></label>`;
  }).join("") : `<p class="muted small-note">Choose screenshots and title fields will appear here.</p>`;
}

function refreshScreenshotUrls() {
  screenshotUrls.forEach((url) => URL.revokeObjectURL(url));
  const files = selectedScreenshotFiles();
  screenshotUrls = files.map((file) => URL.createObjectURL(file));
  refreshScreenshotTitleFields(files);
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
    return `<div class="screenshot-card"><img class="screenshot-image" src="${url}" alt="${title}"><input class="screenshot-caption-input" type="text" data-preview-screenshot-title="${index}" value="${title}" aria-label="Screenshot ${index + 1} title"></div>`;
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
refs.file.addEventListener("change", updateFileLabels);
refs.screenshots.addEventListener("change", () => { updateFileLabels(); refreshScreenshotUrls(); updatePreview(); });
refs.screenshotTitles?.addEventListener("input", updatePreview);
refs.previewScreenshots?.addEventListener("input", (event) => {
  const input = event.target.closest("[data-preview-screenshot-title]");
  if (!input) return;
  const source = refs.screenshotTitles?.querySelector(`[data-screenshot-title="${input.dataset.previewScreenshotTitle}"]`);
  if (source) source.value = input.value;
});
[refs.name, refs.category, refs.version, refs.build, refs.loader, refs.status, refs.summary, refs.description, refs.accent, refs.previewBg].forEach((node) => {
  node.addEventListener("input", updatePreview);
  node.addEventListener("change", updatePreview);
});
refs.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  refs.uploadMessage.textContent = "";
  refs.uploadMessage.className = "notice";
  refs.publish.disabled = true;
  try {
    const record = buildRecord();
    refs.uploadMessage.textContent = "Uploading to Supabase for manual review...";
    const result = await publish(record);
    const reviewEmailUrl = buildReviewEmailUrl(record, result);
    refs.uploadMessage.className = "notice pending-review";
    refs.uploadMessage.innerHTML = `<strong>Pending review.</strong> Your mod was uploaded, but it is hidden from the catalog until the owner approves it. A Gmail review message has been prepared for cucumber993993@gmail.com. <a href="${escapeHtml(reviewEmailUrl)}" target="_blank" rel="noopener">Open Gmail review email again</a>.`;
    window.location.href = reviewEmailUrl;
    refs.form.reset();
    updateFileLabels();
    refreshScreenshotUrls();
    updatePreview();
  } catch (error) {
    refs.uploadMessage.textContent = error.message || String(error);
  } finally {
    refs.publish.disabled = false;
  }
});

refreshAccount();
updateFileLabels();
refreshScreenshotTitleFields([]);
updatePreview();
