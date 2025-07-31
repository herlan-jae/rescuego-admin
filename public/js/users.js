document.addEventListener("DOMContentLoaded", function () {
  // Pastikan dependensi tersedia
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const USER_API_ENDPOINT = `${API_BASE_URL}/accounts/api/users/`;
  const ADMIN_LOGIN_REDIRECT_URL = "login_screen.html";
  let currentUserId = null;

  const userTableBody = document.getElementById("userTableBody");
  const detailUserOverlay = document.getElementById("detailUserOverlay");

  const showModal = (overlay) => overlay?.classList.remove("hidden");
  const closeModal = (overlay) => overlay?.classList.add("hidden");

  async function loadUsers() {
    if (!userTableBody) return;
    userTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Memuat data pengguna...</td></tr>`;
    try {
      const data = await apiFetch(USER_API_ENDPOINT, {}, ADMIN_LOGIN_REDIRECT_URL);
      const users = data.results || data || [];

      userTableBody.innerHTML = "";
      if (users.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Tidak ada data pengguna.</td></tr>`;
        return;
      }
      const regularUsers = users.filter((user) => !user.is_staff);
      regularUsers.forEach(renderUserRow);
    } catch (error) {
      userTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Gagal memuat data. Periksa apakah endpoint API sudah benar.</td></tr>`;
      showSnackbar("Gagal memuat data pengguna.", "error");
    }
  }

  function renderUserRow(user) {
    const fullName = user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : user.username;

    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">${user.id}</td>
        <td class="px-6 py-8 font-medium">${fullName}</td>
        <td class="px-6 py-4">${user.email || "-"}</td>
        <td class="px-6 py-4">${user.user_profile?.phone_number || "-"}</td>
        <td class="px-6 py-4">${user.user_profile?.city || "-"}</td>
        
      </tr>`;
    userTableBody.insertAdjacentHTML("beforeend", row);
  }

  async function fetchUserDetail(id) {
    currentUserId = id;
    showModal(detailUserOverlay);
    document.querySelectorAll("#detailUserOverlay span[id]").forEach((span) => (span.textContent = "Memuat..."));

    try {
      const user = await apiFetch(`${USER_API_ENDPOINT}${id}/`, {}, ADMIN_LOGIN_REDIRECT_URL);

      const fullName = user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : user.username;

      document.getElementById("detailUserId").textContent = user.id || "-";
      document.getElementById("detailUsername").textContent = user.username || "-";
      document.getElementById("detailFullName").textContent = fullName;
      document.getElementById("detailEmail").textContent = user.email || "-";
      document.getElementById("detailPhoneNumber").textContent = user.user_profile?.phone_number || "-";
      document.getElementById("detailDateOfBirth").textContent = user.user_profile?.date_of_birth || "-";
      document.getElementById("detailAddress").textContent = user.user_profile?.address || "-";
      document.getElementById("detailCity").textContent = user.user_profile?.city || "-";
      document.getElementById("detailEmergencyContactName").textContent = user.user_profile?.emergency_contact_name || "-";
      document.getElementById("detailEmergencyContactPhone").textContent = user.user_profile?.emergency_contact_phone || "-";
      document.getElementById("detailGender").textContent = "-";
      document.getElementById("detailEmergencyContactRelationship").textContent = "-";
      document.getElementById("detailAccountStatus").textContent = user.is_active ? "Aktif" : "Tidak Aktif";
    } catch (error) {
      showSnackbar("Gagal memuat detail pengguna.", "error");
      closeModal(detailUserOverlay);
    }
  }

  userTableBody?.addEventListener("click", (e) => {
    if (e.target.classList.contains("view-btn")) {
      fetchUserDetail(e.target.dataset.id);
    }
  });

  document.getElementById("closeDetailUserBtn")?.addEventListener("click", () => closeModal(detailUserOverlay));

  loadUsers();
});
document.addEventListener("DOMContentLoaded", function () {
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const USER_API_ENDPOINT = `${API_BASE_URL}/accounts/api/users/`;
  const ADMIN_LOGIN_REDIRECT_URL = "login_screen.html";
  let currentUserId = null;

  const userTableBody = document.getElementById("userTableBody");
  const detailUserOverlay = document.getElementById("detailUserOverlay");

  const showModal = (overlay) => overlay?.classList.remove("hidden");
  const closeModal = (overlay) => overlay?.classList.add("hidden");

  async function loadUsers() {
    if (!userTableBody) return;
    userTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Memuat data pengguna...</td></tr>`;
    try {
      const data = await apiFetch(USER_API_ENDPOINT, {}, ADMIN_LOGIN_REDIRECT_URL);
      const users = data.results || data || [];

      userTableBody.innerHTML = "";
      if (users.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Tidak ada data pengguna.</td></tr>`;
        return;
      }

      const regularUsers = users.filter((user) => !user.is_staff);
      regularUsers.forEach(renderUserRow);
    } catch (error) {
      userTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Gagal memuat data. Periksa apakah endpoint API sudah benar.</td></tr>`;
      showSnackbar("Gagal memuat data pengguna.", "error");
    }
  }

  function renderUserRow(user) {
    const fullName = user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : user.username;

    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">${user.id}</td>
        <td class="px-6 py-8 font-medium">${fullName}</td>
        <td class="px-6 py-4">${user.email || "-"}</td>
        
        <!-- FIX: Mengakses data dari nested object 'profile' -->
        <td class="px-6 py-4">${user.profile?.phone_number || "-"}</td>
        <td class="px-6 py-4">${user.profile?.city || "-"}</td>

       
      </tr>`;
    userTableBody.insertAdjacentHTML("beforeend", row);
  }

  async function fetchUserDetail(id) {
    currentUserId = id;
    showModal(detailUserOverlay);
    document.querySelectorAll("#detailUserOverlay span[id]").forEach((span) => (span.textContent = "Memuat..."));

    try {
      const user = await apiFetch(`${USER_API_ENDPOINT}${id}/`, {}, ADMIN_LOGIN_REDIRECT_URL);

      const fullName = user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : user.username;

      document.getElementById("detailUserId").textContent = user.id || "-";
      document.getElementById("detailUsername").textContent = user.username || "-";
      document.getElementById("detailFullName").textContent = fullName;
      document.getElementById("detailEmail").textContent = user.email || "-";
      document.getElementById("detailAccountStatus").textContent = user.is_active ? "Aktif" : "Tidak Aktif";

      const profile = user.profile || {};
      document.getElementById("detailPhoneNumber").textContent = profile.phone_number || "-";
      document.getElementById("detailDateOfBirth").textContent = profile.date_of_birth || "-";
      document.getElementById("detailAddress").textContent = profile.address || "-";
      document.getElementById("detailCity").textContent = profile.city || "-";
      document.getElementById("detailEmergencyContactName").textContent = profile.emergency_contact_name || "-";
      document.getElementById("detailEmergencyContactPhone").textContent = profile.emergency_contact_phone || "-";

      document.getElementById("detailGender").textContent = "-";
      document.getElementById("detailEmergencyContactRelationship").textContent = "-";
    } catch (error) {
      showSnackbar("Gagal memuat detail pengguna.", "error");
      closeModal(detailUserOverlay);
    }
  }

  userTableBody?.addEventListener("click", (e) => {
    if (e.target.classList.contains("view-btn")) {
      fetchUserDetail(e.target.dataset.id);
    }
  });

  document.getElementById("closeDetailUserBtn")?.addEventListener("click", () => closeModal(detailUserOverlay));

  loadUsers();
});
