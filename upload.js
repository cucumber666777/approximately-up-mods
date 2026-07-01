let screenshotUrls = [];
const DEFAULT_AVATAR = "assets/default-avatar.png";
let profileSettings = JSON.parse(localStorage.getItem("auModsProfile") || "{}");

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

function readLocalUser() {
  return JSON.parse(localStorage.getItem("auModsUser") || "null");
}

function getProfileName() {
  const user = readLocalUser();
  return profileSettings.nickname || user?.email?.split("@")[0] || "Guest";
}

function getProfileAvatar() {
  return profileSettings.avatar || DEFAULT_AVATAR;
}

function refreshAccount() {
  profileSettings = JSON.parse(localStorage.getItem("auModsProfile") || "{}");
  const name = getProfileName();
  const avatar = getProfileAvatar();
  refs.profileName.textContent = name;
  refs.profileAvatar.src = avatar;
  refs.profileAvatar.alt = name;
  refs.statusTitle.textContent = "Static package";
  refs.statusText.textContent = "Real online uploads are disabled in this copy.";
  refs.authBox.hidden = true;
  refs.profileMenu.innerHTML = `<div class="profile-menu-head"><img class="avatar avatar-image large" src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}"><div><strong>${escapeHtml(name)}</strong><small>Local browser profile</small></div></div><a class="profile-menu-item" href="index.html">Open catalog</a>`;
}

function updateFileLabels() {
  const modFile = refs.file.files?.[0];
  if (refs.fileName) refs.fileName.textContent = modFile ? modFile.name : "No file selected";
  const screenshotCount = refs.screenshots.files?.length || 0;
  if (refs.screenshotsName) refs.screenshotsName.textContent = screenshotCount ? `${screenshotCount} file${screenshotCount === 1 ? "" : "s"} selected` : "No file selected";
}

function selectedScreenshotFiles() {
  return Array.from(refs.screenshots.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 5);
}

function getScreenshotTitle(index, fallback) {
  const input = refs.screenshotTitles?.querySelector(`[data-screenshot-title="${index}"]`);
  return text(input?.value, fallback);
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

refs.accountButton.addEventListener("click", (event) => {
  event.stopPropagation();
  refs.profileMenu.hidden = !refs.profileMenu.hidden;
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".profile-menu-wrap")) refs.profileMenu.hidden = true;
});

refs.login?.addEventListener("click", () => { refs.accountMessage.textContent = "Online accounts are disabled in this static copy."; });
refs.signup?.addEventListener("click", () => { refs.accountMessage.textContent = "Online accounts are disabled in this static copy."; });
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

refs.form.addEventListener("submit", (event) => {
  event.preventDefault();
  refs.uploadMessage.className = "notice pending-review";
  refs.uploadMessage.innerHTML = "<strong>Static preview only.</strong> This copy has no online upload backend. Send the mod file, screenshots and description to the site owner manually.";
});

refreshAccount();
updateFileLabels();
refreshScreenshotTitleFields([]);
updatePreview();
