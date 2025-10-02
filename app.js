// ================= app.js (consolidated) =================
// Full-featured script: navigation, auth (localStorage), campaigns,
// promotion form, admin panel, promo submissions, profile page,
// profile picture upload, change password, profile chat, helpers.

// ---------- CONFIG / STORAGE KEYS ----------
const KEYS = {
  USERS: "netmods_users_v1",
  CURRENT_USER: "netmods_current_user_v1",
  CAMPAIGNS: "netmods_campaigns_v2",
  PROMO_REQUESTS: "netmods_promo_requests_v1"
};

// ---------- FOOTER YEAR ----------
try {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
} catch (e) { /* ignore */ }

// ---------- SAFE QUERY HELPERS ----------
function $id(id) { return document.getElementById(id); }
function $qs(sel) { return document.querySelector(sel); }
function $qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

// ---------- ELEMENT REFERENCES (may be missing if HTML isn't updated) ----------
const homePage = $id("homePage");
const profileSection = $id("profileSection"); // NOTE: add this section in HTML
const loginSection = $id("loginSection");
const signupSection = $id("signupSection");
const chatSection = $id("chatSection");
const adminSection = $id("adminSection");
const promotionFormSection = $id("promotionFormSection");
const campaignsContent = $id("campaignsContent");
const whopStoresList = $id("whopStoresList");
const campaignGallery = $id("campaignGallery");
const galleryImg1 = $id("galleryImg1");
const galleryImg2 = $id("galleryImg2");
const galleryImg3 = $id("galleryImg3");

// nav buttons
const homeBtn = $id("homeBtn");
const profileBtn = $id("profileBtn"); // NOTE: add profileBtn in header HTML
const loginBtn = $id("loginBtn");
const signupBtn = $id("signupBtn");
const chatBtn = $id("chatBtn");

const userMenu = $id("userMenu");
const userNameEl = $id("userName");
const logoutBtn = $id("logoutBtn");

// admin modal & password
const pwModal = $id("pwModal");
const pwInput = $id("pwInput");
const pwSubmit = $id("pwSubmit");
const pwCancel = $id("pwCancel");
const pwError = $id("pwError");

// campaign admin form refs
const campaignForm = $id("campaignForm");
const editingIdEl = $id("editingId");
const campaignNameEl = $id("campaignName");
const campaignUrlEl = $id("campaignUrl");
const campaignStatusEl = $id("campaignStatus");
const campaignImageFileEl = $id("campaignImageFile");
const campaignImagePreview = $id("campaignImagePreview");
const campaignImagePlaceholder = $id("campaignImagePlaceholder");
const resetCampaignFormBtn = $id("resetCampaignForm");
const adminCampaignList = $id("adminCampaignList");

// promotion form refs
const promoForm = $id("promotionForm");
const promoFormTitle = $id("promotionFormTitle");
const promoBack = $id("promoBack");
const promoCancel = $id("promoCancel");
const promoThanks = $id("promoThanks");
const promoDone = $id("promoDone");
const promoBtns = $qsa(".promo-btn");

// promo submissions list for admin
const adminFormsList = $id("adminFormsList");

// chat
const chatInput = $id("chatInput");
const chatSend = $id("chatSend");
const chatMessages = $id("chatMessages");

// profile-specific refs (profile HTML must contain these IDs)
const profileNameEl = $id("profileName");
const profileEmailEl = $id("profileEmail");
const profilePackagesEl = $id("profilePackages");
const profileImageInput = $id("profileImageInput");
const profileImagePreview = $id("profileImagePreview");
const editDisplayName = $id("editDisplayName");
const saveProfileBtn = $id("saveProfileBtn");
const newPasswordInput = $id("newPassword");
const changePasswordBtn = $id("changePasswordBtn");
const profileChatMessages = $id("profileChatMessages");
const profileChatInput = $id("profileChatInput");
const profileChatSend = $id("profileChatSend");
const profilePurchaseBtn = $id("profilePurchaseBtn"); // optional: simulate package purchase

// ---------- UTILITIES ----------
function uid(prefix = "id") {
  return prefix + "-" + Math.random().toString(36).slice(2,10);
}
function esc(s){ return String(s || ""); }
function safe(fn){ try{ fn(); } catch(e){ console.warn(e); } }

// ---------- STORAGE HELPERS ----------
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){ console.warn("ls write failed", e); }
}

// users
function getUsers(){ return readJSON(KEYS.USERS, []); }
function saveUsers(users){ writeJSON(KEYS.USERS, users); }
function getCurrentUser(){ return readJSON(KEYS.CURRENT_USER, null); }
function setCurrentUser(user){ writeJSON(KEYS.CURRENT_USER, user); updateHeaderForAuth(); }
function clearCurrentUser(){ localStorage.removeItem(KEYS.CURRENT_USER); updateHeaderForAuth(); }

// campaigns
function loadCampaigns(){ return readJSON(KEYS.CAMPAIGNS, []); }
function saveCampaigns(arr){ writeJSON(KEYS.CAMPAIGNS, arr); }

// promo requests
function loadPromoRequests(){ return readJSON(KEYS.PROMO_REQUESTS, []); }
function savePromoRequests(arr){ writeJSON(KEYS.PROMO_REQUESTS, arr); }

// ---------- NAV / SECTION MANAGEMENT ----------
const ALL_SECTIONS = [homePage, profileSection, loginSection, signupSection, chatSection, adminSection, promotionFormSection].filter(Boolean);
function hideAllSections(){
  ALL_SECTIONS.forEach(s => s.classList.add("hidden"));
}
function showSection(section){
  if (!section) return;
  hideAllSections();
  section.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  highlightHeaderForSection(section);
}
function highlightHeaderForSection(section){
  // clear active class
  $qsa(".header-active").forEach(el => el.classList.remove("header-active"));
  if (section === homePage && homeBtn) homeBtn.classList.add("header-active");
  if (section === chatSection && chatBtn) chatBtn.classList.add("header-active");
  if (section === loginSection && loginBtn) loginBtn.classList.add("header-active");
  if (section === signupSection && signupBtn) signupBtn.classList.add("header-active");
  if (section === profileSection && profileBtn) profileBtn.classList.add("header-active");
  if (section === adminSection && loginBtn) loginBtn.classList.add("header-active");
}

// show home at load
if (homePage) showSection(homePage);

// ---------- HEADER AUTH UI ----------
function updateHeaderForAuth(){
  const user = getCurrentUser();
  if (user) {
    if (loginBtn) loginBtn.classList.add("hidden");
    if (signupBtn) signupBtn.classList.add("hidden");
    if (userMenu) userMenu.classList.remove("hidden");
    if (userNameEl) userNameEl.textContent = "Hi, " + (user.name || (user.email || "").split("@")[0]);
  } else {
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (signupBtn) signupBtn.classList.remove("hidden");
    if (userMenu) userMenu.classList.add("hidden");
    if (userNameEl) userNameEl.textContent = "";
  }
}
updateHeaderForAuth();

// ---------- NAV EVENT LISTENERS (defensive) ----------
if (homeBtn) homeBtn.addEventListener("click", e => { e.preventDefault(); showSection(homePage); });
if (profileBtn) profileBtn.addEventListener("click", e => { e.preventDefault(); loadProfile(); showSection(profileSection); });
if (loginBtn) loginBtn.addEventListener("click", e => { e.preventDefault(); showSection(loginSection); });
if (signupBtn) signupBtn.addEventListener("click", e => { e.preventDefault(); showSection(signupSection); });
if (chatBtn) chatBtn.addEventListener("click", e => { e.preventDefault(); showSection(chatSection); });
if (logoutBtn) logoutBtn.addEventListener("click", () => {
  if (!confirm("Logout?")) return;
  clearCurrentUser();
  showSection(homePage);
});

// ---------- LOGIN / SIGNUP ----------
const loginForm = $id("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = ($id("loginEmail") && $id("loginEmail").value.trim().toLowerCase()) || "";
    const pwd = ($id("loginPassword") && $id("loginPassword").value) || "";
    if (!email || !pwd) { alert("Enter email and password"); return; }
    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === pwd);
    if (found) {
      setCurrentUser(found);
      alert("Login successful");
      showSection(homePage);
    } else {
      alert("Invalid credentials. If you don't have an account, please Sign Up.");
    }
  });
}

const signupForm = $id("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = ($id("signupName") && $id("signupName").value.trim()) || "";
    const email = ($id("signupEmail") && $id("signupEmail").value.trim().toLowerCase()) || "";
    const pwd = ($id("signupPassword") && $id("signupPassword").value) || "";
    const pwdc = ($id("signupConfirm") && $id("signupConfirm").value) || "";
    if (!name || !email || !pwd) { alert("Please fill all fields"); return; }
    if (pwd !== pwdc) { alert("Passwords do not match"); return; }
    const users = getUsers();
    if (users.find(u => u.email === email)) { alert("An account with this email already exists. Please login."); showSection(loginSection); return; }
    const newUser = { id: uid("user"), name, email, password: pwd, profilePic: "", packages: [] };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    alert("Account created and logged in.");
    showSection(homePage);
  });
}

// ---------- CHAT (public) ----------
if (chatSend && chatInput && chatMessages) {
  function appendChatMessage(text, who = "user") {
    const d = document.createElement("div");
    d.className = "message-bubble " + (who === "user" ? "user" : "admin");
    d.textContent = text;
    chatMessages.appendChild(d);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  chatSend.addEventListener("click", () => {
    const v = (chatInput.value || "").trim();
    if (!v) return;
    appendChatMessage(v, "user");
    chatInput.value = "";
    setTimeout(() => appendChatMessage("Thanks for contacting NetMods! we will contact you as soon as possible , our team is offline at the moment", "admin"), 900);
  });
}

// ---------- CAMPAIGNS (public render) ----------
let currentTab = "active";
function renderCampaignsTab(status = "active") {
  currentTab = status;
  $qsa(".tabs .tab-btn").forEach(btn => btn.classList.toggle("active", btn.getAttribute("data-tab") === status));
  if (!campaignsContent) return;
  const all = loadCampaigns();
  const filtered = all.filter(c => c.status === status);
  campaignsContent.innerHTML = "";
  if (filtered.length === 0) {
    campaignsContent.innerHTML = `<p style="color:#666">No ${status} campaigns yet.</p>`;
    return;
  }
  filtered.forEach(c => {
    const div = document.createElement("div");
    div.className = "campaign-card fade-in";
    const thumb = document.createElement("div"); thumb.className = "thumb";
    if (c.imageDataUrl) { const img = document.createElement("img"); img.src = c.imageDataUrl; thumb.appendChild(img); }
    else thumb.innerHTML = "<div style='color:#888'>No image</div>";
    const meta = document.createElement("div"); meta.className = "meta";
    meta.innerHTML = `<h4>${esc(c.name)}</h4><p>${esc(c.status)}${c.url ? (" • " + esc(c.url)) : ""}</p>`;
    const btn = document.createElement("a"); btn.className = "visit-btn"; btn.textContent = "Visit Store"; btn.href = c.url || "#"; btn.target = "_blank"; btn.rel = "noopener";
    div.appendChild(thumb); div.appendChild(meta); div.appendChild(btn);
    campaignsContent.appendChild(div);
  });
}
$qsa(".tabs .tab-btn").forEach(btn => btn.addEventListener("click", () => renderCampaignsTab(btn.getAttribute("data-tab"))));

// ---------- WHOP STORES (public render) ----------
function renderWhopStores() {
  if (!whopStoresList) return;
  const arr = loadCampaigns();
  whopStoresList.innerHTML = "";
  if (arr.length === 0) {
    whopStoresList.innerHTML = "<p style='color:#666'>No stores to show yet.</p>";
    return;
  }
  arr.forEach(c => {
    const card = document.createElement("div"); card.className = "card store-card";
    const img = document.createElement("img"); img.className = "store-img"; img.src = c.imageDataUrl || "https://picsum.photos/600/400?random=99";
    const h3 = document.createElement("h3"); h3.textContent = c.name;
    const p = document.createElement("p"); p.textContent = c.status === "active" ? "Active Campaign" : "Ended Campaign";
    const visit = document.createElement("a"); visit.className = "visit-btn"; visit.textContent = "Visit Store"; visit.href = c.url || "#"; visit.target = "_blank"; visit.rel = "noopener";
    card.appendChild(img); card.appendChild(h3); card.appendChild(p); card.appendChild(visit);
    whopStoresList.appendChild(card);
  });
}

// ---------- CAMPAIGN GALLERY ----------
function updateGalleryFromStorage(){
  if (!campaignGallery) return;
  const arr = loadCampaigns();
  const imgs = arr.slice(0,3).map(x => x.imageDataUrl || "");
  const [a,b,c] = imgs;
  if (a || b || c) campaignGallery.setAttribute("aria-hidden","false"); else campaignGallery.setAttribute("aria-hidden","true");
  if (galleryImg1) galleryImg1.src = a || "";
  if (galleryImg2) galleryImg2.src = b || "";
  if (galleryImg3) galleryImg3.src = c || "";
}

// ---------- ADMIN: campaign editor ----------
let currentEditingImageData = "";

function fileToDataUrl(file){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej();
    fr.readAsDataURL(file);
  });
}

if (campaignImageFileEl) {
  campaignImageFileEl.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = await fileToDataUrl(f);
      currentEditingImageData = data;
      if (campaignImagePreview) { campaignImagePreview.src = data; campaignImagePreview.style.display = "block"; }
      if (campaignImagePlaceholder) campaignImagePlaceholder.style.display = "none";
    } catch { alert("Unable to load image"); }
  });
}

function resetCampaignForm(){
  if (!editingIdEl) return;
  editingIdEl.value = "";
  if (campaignNameEl) campaignNameEl.value = "";
  if (campaignUrlEl) campaignUrlEl.value = "";
  if (campaignStatusEl) campaignStatusEl.value = "active";
  if (campaignImageFileEl) campaignImageFileEl.value = "";
  currentEditingImageData = "";
  if (campaignImagePreview) { campaignImagePreview.src = ""; campaignImagePreview.style.display = "none"; }
  if (campaignImagePlaceholder) campaignImagePlaceholder.style.display = "block";
}
if (resetCampaignFormBtn) resetCampaignFormBtn.addEventListener("click", (e) => { e.preventDefault(); resetCampaignForm(); });

function renderAdminCampaignList(){
  if (!adminCampaignList) return;
  const list = loadCampaigns();
  adminCampaignList.innerHTML = "";
  if (list.length === 0) {
    adminCampaignList.innerHTML = "<p style='color:#666'>No campaigns yet. Add one using the form above.</p>";
    return;
  }
  list.forEach(c => {
    const div = document.createElement("div"); div.className = "admin-item";
    const img = document.createElement("img"); img.src = c.imageDataUrl || ""; if (!c.imageDataUrl) img.style.display = "none";
    const info = document.createElement("div"); info.className = "info";
    info.innerHTML = `<strong>${esc(c.name)}</strong><div style="color:#666;font-size:0.9rem">${esc(c.status)} • ${esc(c.url || "No URL")}</div>`;
    const actions = document.createElement("div"); actions.className = "actions";
    const editBtn = document.createElement("button"); editBtn.className = "btn-outline small-btn"; editBtn.textContent = "Edit";
    const delBtn = document.createElement("button"); delBtn.className = "btn-outline small-btn"; delBtn.textContent = "Delete";
    actions.appendChild(editBtn); actions.appendChild(delBtn);
    div.appendChild(img); div.appendChild(info); div.appendChild(actions);
    adminCampaignList.appendChild(div);

    editBtn.addEventListener("click", () => startEditCampaign(c.id));
    delBtn.addEventListener("click", () => {
      if (!confirm("Delete this campaign?")) return;
      const arr = loadCampaigns().filter(x => x.id !== c.id);
      saveCampaigns(arr);
      renderAdminCampaignList(); renderCampaignsTab(currentTab); renderWhopStores(); updateGalleryFromStorage();
    });
  });
}

if (campaignForm) {
  campaignForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (campaignNameEl && campaignNameEl.value.trim()) || "";
    const url = (campaignUrlEl && campaignUrlEl.value.trim()) || "";
    const status = campaignStatusEl ? campaignStatusEl.value : "active";
    if (!name) { alert("Please enter store name"); return; }
    const editingId = editingIdEl ? editingIdEl.value : "";
    const arr = loadCampaigns();
    if (editingId) {
      const idx = arr.findIndex(x => x.id === editingId);
      if (idx >= 0) {
        arr[idx].name = name; arr[idx].url = url; arr[idx].status = status;
        if (currentEditingImageData) arr[idx].imageDataUrl = currentEditingImageData;
        saveCampaigns(arr);
        resetCampaignForm();
        renderAdminCampaignList(); renderCampaignsTab(currentTab); renderWhopStores(); updateGalleryFromStorage();
        alert("Campaign updated");
      }
    } else {
      const newCampaign = { id: uid("camp"), name, url, status, imageDataUrl: currentEditingImageData || "" };
      arr.unshift(newCampaign);
      saveCampaigns(arr);
      resetCampaignForm();
      renderAdminCampaignList(); renderCampaignsTab(currentTab); renderWhopStores(); updateGalleryFromStorage();
      alert("Campaign added");
    }
  });
}

function startEditCampaign(id){
  const arr = loadCampaigns();
  const c = arr.find(x => x.id === id);
  if (!c) return;
  if (editingIdEl) editingIdEl.value = c.id;
  if (campaignNameEl) campaignNameEl.value = c.name || "";
  if (campaignUrlEl) campaignUrlEl.value = c.url || "";
  if (campaignStatusEl) campaignStatusEl.value = c.status || "active";
  currentEditingImageData = c.imageDataUrl || "";
  if (currentEditingImageData && campaignImagePreview) {
    campaignImagePreview.src = currentEditingImageData; campaignImagePreview.style.display = "block";
    if (campaignImagePlaceholder) campaignImagePlaceholder.style.display = "none";
  } else {
    if (campaignImagePreview) { campaignImagePreview.src = ""; campaignImagePreview.style.display = "none"; }
    if (campaignImagePlaceholder) campaignImagePlaceholder.style.display = "block";
  }
  showSection(adminSection);
}

// ---------- PASSWORD MODAL & SHORTCUT ----------
if (pwModal) {
  function openPasswordModal(){ if (pwError) pwError.style.display = "none"; if (pwInput) pwInput.value = ""; pwModal.classList.remove("hidden"); setTimeout(()=> pwInput && pwInput.focus(), 50); }
  function closePasswordModal(){ pwModal.classList.add("hidden"); if (pwError) pwError.style.display = "none"; if (pwInput) pwInput.value = ""; }

  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const tag = (t && t.tagName) ? t.tagName.toLowerCase() : "";
    const isEditing = tag === "input" || tag === "textarea" || (t && t.isContentEditable);
    if (isEditing) return;
    if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
      e.preventDefault(); openPasswordModal();
    }
  });
  if (pwSubmit) pwSubmit.addEventListener("click", () => {
    const v = (pwInput && pwInput.value || "").trim();
    if (v === "netmods control") {
      closePasswordModal(); showSection(adminSection); renderAdminCampaignList(); updateGalleryFromStorage();
    } else {
      if (pwError) { pwError.style.display = "block"; pwError.textContent = "Incorrect password"; }
      if (pwInput) pwInput.focus();
    }
  });
  if (pwCancel) pwCancel.addEventListener("click", () => closePasswordModal());
  if (pwInput) pwInput.addEventListener("keydown", (e) => { if (e.key === "Enter") pwSubmit.click(); if (e.key === "Escape") pwCancel.click(); });
  pwModal.addEventListener("click", (e) => { if (e.target === pwModal) closePasswordModal(); });
}

// ---------- PROMOTION FORM HANDLING ----------
if (promoBtns && promoBtns.length) {
  promoBtns.forEach(btn => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const card = btn.closest(".promo-option");
      const title = (card && card.getAttribute("data-promo")) || btn.textContent.trim() || "Promotion";
      if (promoFormTitle) promoFormTitle.textContent = `${title} Promotion Form`;
      if (promotionFormSection) showSection(promotionFormSection);
      if (promoForm) { promoForm.classList.remove("hidden"); promoForm.reset(); }
      if (promoThanks) promoThanks.classList.add("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}
if (promoBack) promoBack.addEventListener("click", () => showSection(homePage));
if (promoCancel) promoCancel.addEventListener("click", () => { if (promoForm) promoForm.reset(); showSection(homePage); });

if (promoForm) promoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(promoForm);
  const name = formData.get("name") || "";
  // show thanks
  promoForm.classList.add("hidden");
  if (promoThanks) promoThanks.classList.remove("hidden");
  // store request locally
  const saved = loadPromoRequests();
  saved.unshift({
    id: uid("promo"),
    when: new Date().toISOString(),
    type: promoFormTitle ? promoFormTitle.textContent : "Promotion",
    name: name,
    email: formData.get("email") || "",
    brand: formData.get("brand") || "",
    budget: formData.get("budget") || "",
    info: formData.get("info") || ""
  });
  savePromoRequests(saved);
  renderAdminFormsList();
  alert(`✅ Thank you ${name}! Your request has been submitted.`);
});
if (promoDone) promoDone.addEventListener("click", () => { if (promoForm) { promoForm.classList.remove("hidden"); promoForm.reset(); } if (promoThanks) promoThanks.classList.add("hidden"); showSection(homePage); });

// ---------- ADMIN: PROMO FORMS RENDER ----------
function renderAdminFormsList() {
  if (!adminFormsList) return;
  const forms = loadPromoRequests();
  adminFormsList.innerHTML = "";
  if (forms.length === 0) {
    adminFormsList.innerHTML = "<p style='color:#666'>No promotion forms submitted yet.</p>";
    return;
  }
  forms.forEach(f => {
    const div = document.createElement("div");
    div.className = "admin-forms-item";
    div.innerHTML = `
      <p><strong>Type:</strong> ${esc(f.type)}</p>
      <p><strong>Name:</strong> ${esc(f.name)}</p>
      <p><strong>Email:</strong> ${esc(f.email)}</p>
      <p><strong>Brand:</strong> ${esc(f.brand)}</p>
      <p><strong>Budget:</strong> ${esc(f.budget)}</p>
      <p><strong>Info:</strong> ${esc(f.info)}</p>
      <p><strong>Date:</strong> ${new Date(f.when).toLocaleString()}</p>
    `;
    adminFormsList.appendChild(div);
  });
}

// ---------- PROFILE SYSTEM (expects profile HTML IDs present) ----------
function loadProfile() {
  const user = getCurrentUser();
  if (!user) {
    alert("Please login first!");
    showSection(homePage);
    return;
  }
  if (profileNameEl) profileNameEl.textContent = user.name || "Unknown";
  if (profileEmailEl) profileEmailEl.textContent = user.email || "Not set";
  if (profilePackagesEl) profilePackagesEl.textContent = (user.packages && user.packages.length) ? user.packages.join(", ") : "None yet";
  if (profileImagePreview && user.profilePic) profileImagePreview.src = user.profilePic;
  if (editDisplayName) editDisplayName.value = user.name || "";
}

// profile image upload
if (profileImageInput) {
  profileImageInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      const user = getCurrentUser();
      if (!user) { alert("Please login first"); return; }
      user.profilePic = fr.result;
      // update storage
      let users = getUsers();
      users = users.map(u => (u.email === user.email ? user : u));
      saveUsers(users);
      setCurrentUser(user); // updates header
      if (profileImagePreview) profileImagePreview.src = fr.result;
      alert("Profile picture updated!");
    };
    fr.readAsDataURL(file);
  });
}

// save profile display name
if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", () => {
    const user = getCurrentUser();
    if (!user) return alert("Please login first");
    const newName = (editDisplayName && editDisplayName.value.trim()) || "";
    if (!newName) return alert("Name cannot be empty");
    user.name = newName;
    // update storage
    let users = getUsers();
    users = users.map(u => (u.email === user.email ? user : u));
    saveUsers(users);
    setCurrentUser(user);
    alert("Profile name updated!");
    loadProfile();
  });
}

// change password
if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", () => {
    const user = getCurrentUser();
    if (!user) return alert("Please login first");
    const newPwd = (newPasswordInput && newPasswordInput.value) || "";
    if (!newPwd) return alert("Enter new password");
    user.password = newPwd;
    let users = getUsers();
    users = users.map(u => (u.email === user.email ? user : u));
    saveUsers(users);
    setCurrentUser(user);
    if (newPasswordInput) newPasswordInput.value = "";
    alert("Password updated!");
  });
}

// profile chat
if (profileChatSend && profileChatInput && profileChatMessages) {
  function addProfileMessage(text, who = "user") {
    const d = document.createElement("div");
    d.className = "message-bubble " + (who === "user" ? "user" : "admin");
    d.textContent = (who === "user" ? "You: " : "Admin: ") + text;
    profileChatMessages.appendChild(d);
    profileChatMessages.scrollTop = profileChatMessages.scrollHeight;
  }
  profileChatSend.addEventListener("click", () => {
    const msg = (profileChatInput.value || "").trim();
    if (!msg) return;
    addProfileMessage(msg, "user");
    profileChatInput.value = "";
    setTimeout(() => addProfileMessage("Thanks — we'll respond soon!", "admin"), 800);
  });
}

// simulate package purchase from profile (optional)
if (profilePurchaseBtn) {
  profilePurchaseBtn.addEventListener("click", () => {
    const user = getCurrentUser();
    if (!user) return alert("Please login first");
    const pkg = prompt("Enter package name to purchase (e.g. Admin Support - Pro)");
    if (!pkg) return;
    user.packages = user.packages || [];
    user.packages.push(pkg);
    let users = getUsers();
    users = users.map(u => (u.email === user.email ? user : u));
    saveUsers(users);
    setCurrentUser(user);
    alert("Package added to your account!");
    loadProfile();
  });
}

// ---------- PAGE INIT: initial renders ----------
safe(() => {
  renderAdminCampaignList();
  renderCampaignsTab(currentTab);
  renderWhopStores();
  updateGalleryFromStorage();
  renderAdminFormsList();
});

// ---------- EXTRA DEV TOOLS (export/import data) ----------
function exportData() {
  const dump = {
    users: getUsers(),
    currentUser: getCurrentUser(),
    campaigns: loadCampaigns(),
    promoRequests: loadPromoRequests()
  };
  const dataStr = JSON.stringify(dump, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "netmods-backup.json"; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function importData(json) {
  try {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    if (obj.users) saveUsers(obj.users);
    if (obj.campaigns) saveCampaigns(obj.campaigns);
    if (obj.promoRequests) savePromoRequests(obj.promoRequests);
    if (obj.currentUser) setCurrentUser(obj.currentUser);
    alert("Import complete");
    // re-render
    renderAdminCampaignList(); renderCampaignsTab(currentTab); renderWhopStores(); updateGalleryFromStorage(); renderAdminFormsList();
  } catch (e) {
    alert("Import failed: " + e);
  }
}

// ---------- SMALL POLISH: keyboard shortcuts ----------
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // close modals / show home
    if (pwModal && !pwModal.classList.contains("hidden")) { pwModal.classList.add("hidden"); return; }
    showSection(homePage);
  }
});

// ---------- SAFETY: add event listeners only if elements exist ----------
/* The script is defensive: if some elements are missing in your HTML
   it will skip related features. Make sure to add the following IDs
   in your HTML where appropriate to enable full functionality:
   - profileSection  (the full profile page section)
   - profileBtn      (header button that opens profile)
   - profileImageInput, profileImagePreview, profileName, profileEmail,
     profilePackages, editDisplayName, saveProfileBtn, newPassword,
     changePasswordBtn, profileChatMessages, profileChatInput,
     profileChatSend
*/

// ---------- END OF app.js ----------
// // Profile banner upload
const profileBannerInput = $id("profileBannerInput");
const profileHeader = $id("profileHeader");

if (profileBannerInput && profileHeader) {
  profileBannerInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const user = getCurrentUser();
      if (!user) return alert("Please login first!");
      user.bannerPic = reader.result;
      // Save into localStorage
      let users = getUsers();
      users = users.map(u => (u.email === user.email ? user : u));
      saveUsers(users);
      setCurrentUser(user);
      // Apply banner
      profileHeader.style.backgroundImage = `url('${reader.result}')`;
    };
    reader.readAsDataURL(file);
  });
}

// When loading profile, apply banner
function loadProfile() {
  const user = getCurrentUser();
  if (!user) {
    alert("Please login first!");
    showSection(homePage);
    return;
  }
  if (profileNameEl) profileNameEl.textContent = user.name || "Unknown";
  if (profileEmailEl) profileEmailEl.textContent = user.email || "Not set";
  if (profilePackagesEl) profilePackagesEl.textContent = (user.packages && user.packages.length) ? user.packages.join(", ") : "None yet";
  if (profileImagePreview && user.profilePic) profileImagePreview.src = user.profilePic;
  if (profileHeader && user.bannerPic) profileHeader.style.backgroundImage = `url('${user.bannerPic}')`;
  if (editDisplayName) editDisplayName.value = user.name || "";
}
// ---------- UTILITIES ----------
function uid(prefix = "id") {
  return prefix + "-" + Math.random().toString(36).slice(2,10);
}
function esc(s){ return String(s || ""); }
function safe(fn){ try{ fn(); } catch(e){ console.warn(e); } }

// NEW: Utility to check if an image is "dark" or "light"
function isImageDark(src, callback) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = src;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let r,g,b,avg,colorSum = 0;
    for (let x = 0; x < imageData.length; x += 4) {
      r = imageData[x];
      g = imageData[x+1];
      b = imageData[x+2];
      avg = Math.floor((r+g+b)/3);
      colorSum += avg;
    }
    const brightness = Math.floor(colorSum / (img.width*img.height));
    callback(brightness < 128); // true if dark
  };
}

// ---------- PROFILE SYSTEM ----------
function loadProfile() {
  const user = getCurrentUser();
  if (!user) {
    alert("Please login first!");
    showSection(homePage);
    return;
  }
  if (profileNameEl) profileNameEl.textContent = user.name || "Unknown";
  if (profileEmailEl) profileEmailEl.textContent = user.email || "Not set";
  if (profilePackagesEl) profilePackagesEl.textContent = 
    (user.packages && user.packages.length) ? user.packages.join(", ") : "None yet";
  if (profileImagePreview && user.profilePic) profileImagePreview.src = user.profilePic;
  if (editDisplayName) editDisplayName.value = user.name || "";

  // Banner logic
  if (profileHeader) {
    if (user.bannerPic) {
      profileHeader.style.backgroundImage = `url('${user.bannerPic}')`;

      // Decide text color based on banner brightness
      isImageDark(user.bannerPic, (isDark) => {
        if (profileNameEl) {
          profileNameEl.classList.remove("light-text", "dark-text");
          profileNameEl.classList.add(isDark ? "light-text" : "dark-text");
        }
      });
    } else {
      // fallback gradient
      profileHeader.style.backgroundImage = "linear-gradient(135deg, #e3f2fd, #bbdefb)";
      if (profileNameEl) {
        profileNameEl.classList.remove("light-text", "dark-text");
        profileNameEl.classList.add("dark-text");
      }
    }
  }
}
