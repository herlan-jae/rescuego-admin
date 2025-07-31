document.addEventListener("DOMContentLoaded", function () {
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const DRIVER_API_ENDPOINT = `${API_BASE_URL}/accounts/api/drivers/`;
  const ADMIN_LOGIN_REDIRECT_URL = "login_screen.html";
  let currentDriverId = null;

  const STATUS_MAP = {
    available: "Tersedia",
    busy: "Sibuk",
    off_duty: "Tidak Bertugas",
  };
  const STATUS_COLOR_MAP = {
    available: "text-green-600",
    busy: "text-yellow-600",
    off_duty: "text-gray-500",
  };
  const getStatusDisplay = (status) => STATUS_MAP[status] || status;
  const getStatusColor = (status) => STATUS_COLOR_MAP[status] || "text-gray-700";
  const getStatusKey = (display) => Object.keys(STATUS_MAP).find((key) => STATUS_MAP[key] === display) || "off_duty";

  const driverTableBody = document.getElementById("driverTableBody");
  const addDriverOverlay = document.getElementById("addDriverOverlay");
  const detailDriverOverlay = document.getElementById("detailDriverOverlay");
  const editDriverOverlay = document.getElementById("editDriverOverlay");
  const addDriverForm = document.getElementById("addDriverForm");
  const editDriverForm = document.getElementById("editDriverForm");

  const showModal = (overlay) => overlay?.classList.remove("hidden");
  const closeModal = (overlay) => overlay?.classList.add("hidden");

  async function loadDrivers() {
    if (!driverTableBody) return;
    driverTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">Memuat data supir...</td></tr>`;
    try {
      const data = await apiFetch(DRIVER_API_ENDPOINT, {}, ADMIN_LOGIN_REDIRECT_URL);
      const drivers = data.results || data || [];
      driverTableBody.innerHTML = "";
      if (drivers.length === 0) {
        driverTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">Tidak ada data supir.</td></tr>`;
        return;
      }
      drivers.forEach(renderDriverRow);
    } catch (error) {
      driverTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
      showSnackbar("Gagal memuat data supir.", "error");
    }
  }

  function renderDriverRow(driver) {
    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">${driver.id}</td>
        <td class="px-6 py-4 font-medium">${driver.full_name}</td>
        <td class="px-6 py-4">${driver.driver_license_number}</td>
        <td class="px-6 py-4 font-semibold ${getStatusColor(driver.status)}">${getStatusDisplay(driver.status)}</td>
        <td class="px-6 py-4">${driver.city}</td>
        <td class="px-6 py-4 text-center">
          <button class="view-btn text-[#5B2EFF] hover:underline" data-id="${driver.id}">Lihat</button>
        </td>
      </tr>`;
    driverTableBody.insertAdjacentHTML("beforeend", row);
  }

  async function fetchDriverDetail(id) {
    currentDriverId = id;
    showModal(detailDriverOverlay);
    try {
      const driver = await apiFetch(`${DRIVER_API_ENDPOINT}${id}/`, {}, ADMIN_LOGIN_REDIRECT_URL);
      document.getElementById("detailDriverName").textContent = driver.full_name || "-";
      document.getElementById("detailDriverEmail").textContent = driver.email || "-";
      document.getElementById("detailDriverPhone").textContent = driver.phone_number || "-";
      document.getElementById("detailDriverBirthdate").textContent = driver.date_of_birth || "-";
      document.getElementById("detailDriverAddress").textContent = driver.address || "-";
      document.getElementById("detailDriverCity").textContent = driver.city || "-";
      document.getElementById("detailDriverSIM").textContent = driver.driver_license_number || "-";
      document.getElementById("detailDriverStatus").textContent = getStatusDisplay(driver.status);
      document.getElementById("detailDriverHireDate").textContent = driver.hire_date || "-";
      document.getElementById("detailEmergencyContactName").textContent = driver.emergency_contact_name || "-";
      document.getElementById("detailEmergencyContactPhone").textContent = driver.emergency_contact_phone || "-";
    } catch (error) {
      showSnackbar("Gagal memuat detail supir.", "error");
      closeModal(detailDriverOverlay);
    }
  }

  async function populateEditForm() {
    if (!currentDriverId) return;
    closeModal(detailDriverOverlay);
    showModal(editDriverOverlay);
    try {
      const driver = await apiFetch(`${DRIVER_API_ENDPOINT}${currentDriverId}/`, {}, ADMIN_LOGIN_REDIRECT_URL);
      document.getElementById("edit_driver_id").value = driver.id;
      document.getElementById("edit_username").value = driver.username || "";
      document.getElementById("edit_email").value = driver.email || "";
      document.getElementById("edit_first_name").value = driver.first_name || "";
      document.getElementById("edit_last_name").value = driver.last_name || "";
      document.getElementById("edit_phone_number").value = driver.phone_number || "";
      document.getElementById("edit_driver_license_number").value = driver.driver_license_number || "";
      document.getElementById("edit_address").value = driver.address || "";
      document.getElementById("edit_city").value = driver.city || "";
      document.getElementById("edit_date_of_birth").value = driver.date_of_birth || "";
      document.getElementById("edit_status").value = driver.status || "off_duty";
      document.getElementById("edit_emergency_contact_name").value = driver.emergency_contact_name || "";
      document.getElementById("edit_emergency_contact_phone").value = driver.emergency_contact_phone || "";
    } catch (error) {
      showSnackbar("Gagal mengambil data untuk diedit.", "error");
      closeModal(editDriverOverlay);
    }
  }

  async function handleAddFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      await apiFetch(DRIVER_API_ENDPOINT, { method: "POST", body: JSON.stringify(data) });
      showSnackbar("Supir baru berhasil dibuat!", "success");
      e.target.reset();
      closeModal(addDriverOverlay);
      loadDrivers();
    } catch (error) {
      showSnackbar(error.message || "Gagal membuat supir baru.", "error");
    }
  }

  async function handleEditFormSubmit(e) {
    e.preventDefault();
    if (!currentDriverId) return;
    const formData = new FormData(e.target);
    formData.delete("username");
    formData.delete("email");
    const data = Object.fromEntries(formData.entries());
    try {
      await apiFetch(`${DRIVER_API_ENDPOINT}${currentDriverId}/`, { method: "PATCH", body: JSON.stringify(data) });
      showSnackbar("Data supir berhasil diperbarui!", "success");
      closeModal(editDriverOverlay);
      loadDrivers();
    } catch (error) {
      showSnackbar(error.message || "Gagal memperbarui data supir.", "error");
    }
  }

  function handleDeleteDriver() {
    if (!currentDriverId) return;
    const modal = document.getElementById("confirmationModal");
    document.getElementById("confirm-title").textContent = "Konfirmasi Hapus Supir";
    document.getElementById("confirm-message").textContent = `Apakah Anda yakin ingin menghapus supir dengan ID ${currentDriverId}? Akun pengguna terkait juga akan dihapus.`;
    document.getElementById("confirm-ok-btn").textContent = "Ya, Hapus";
    showModal(modal);

    const handleConfirm = async () => {
      closeModal(modal);
      try {
        await apiFetch(`${DRIVER_API_ENDPOINT}${currentDriverId}/`, { method: "DELETE" });
        showSnackbar("Supir berhasil dihapus.", "success");
        closeModal(detailDriverOverlay);
        loadDrivers();
      } catch (error) {
        showSnackbar(error.message || "Gagal menghapus supir.", "error");
      } finally {
        cleanup();
      }
    };
    const handleCancel = () => {
      closeModal(modal);
      cleanup();
    };
    const cleanup = () => {
      document.getElementById("confirm-ok-btn").removeEventListener("click", handleConfirm);
      document.getElementById("confirm-cancel-btn").removeEventListener("click", handleCancel);
    };
    document.getElementById("confirm-ok-btn").addEventListener("click", handleConfirm, { once: true });
    document.getElementById("confirm-cancel-btn").addEventListener("click", handleCancel, { once: true });
  }

  document.getElementById("showAddDriverForm")?.addEventListener("click", () => {
    addDriverForm.reset();
    showModal(addDriverOverlay);
  });

  driverTableBody?.addEventListener("click", (e) => {
    if (e.target.classList.contains("view-btn")) {
      fetchDriverDetail(e.target.dataset.id);
    }
  });

  document.getElementById("closeAddDriverBtn")?.addEventListener("click", () => closeModal(addDriverOverlay));
  document.getElementById("cancelAddDriver")?.addEventListener("click", () => closeModal(addDriverOverlay));
  addDriverForm?.addEventListener("submit", handleAddFormSubmit);

  document.getElementById("closeDetailDriverBtn")?.addEventListener("click", () => closeModal(detailDriverOverlay));
  document.getElementById("editDriverBtn")?.addEventListener("click", populateEditForm);
  document.getElementById("deleteDriverBtn")?.addEventListener("click", handleDeleteDriver);

  document.getElementById("closeEditDriverBtn")?.addEventListener("click", () => closeModal(editDriverOverlay));
  document.getElementById("cancelEditDriverBtn")?.addEventListener("click", () => closeModal(editDriverOverlay));
  editDriverForm?.addEventListener("submit", handleEditFormSubmit);

  loadDrivers();
});
