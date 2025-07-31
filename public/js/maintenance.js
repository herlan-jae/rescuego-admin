document.addEventListener("DOMContentLoaded", function () {
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const MAINTENANCE_API_ENDPOINT = `${API_BASE_URL}/maintenance/api/`;
  const ADMIN_LOGIN_REDIRECT_URL = "login_screen.html";
  let currentMaintenanceId = null;

  const STATUS_MAP = {
    pending: "Tertunda",
    in_progress: "Dalam Proses",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  const getStatusDisplay = (status) => STATUS_MAP[status] || status;

  const maintenanceTableBody = document.getElementById("maintenanceTableBody");
  const detailOverlay = document.getElementById("detailMaintenanceOverlay");

  const showModal = (overlay) => overlay?.classList.remove("hidden");
  const closeModal = (overlay) => overlay?.classList.add("hidden");

  async function loadMaintenanceRecords() {
    if (!maintenanceTableBody) return;
    maintenanceTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">Memuat data perbaikan...</td></tr>`;
    try {
      const data = await apiFetch(MAINTENANCE_API_ENDPOINT, {}, ADMIN_LOGIN_REDIRECT_URL);
      const records = data.results || data || [];
      maintenanceTableBody.innerHTML = "";
      if (records.length === 0) {
        maintenanceTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">Tidak ada data perbaikan.</td></tr>`;
        return;
      }
      records.forEach(renderRecordRow);
    } catch (error) {
      maintenanceTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
      showSnackbar("Gagal memuat data perbaikan.", "error");
    }
  }

  function renderRecordRow(record) {
    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">${record.id}</td>
        <td class="px-6 py-4 font-medium">${record.ambulance_details?.license_plate || "N/A"}</td>
        <td class="px-6 py-4">${record.description}</td>
        <td class="px-6 py-4">${new Date(record.reported_date).toLocaleDateString("id-ID")}</td>
        <td class="px-6 py-4 font-semibold">${getStatusDisplay(record.status)}</td>
        <td class="px-6 py-4 text-center">
          <button class="view-btn text-[#5B2EFF] hover:underline" data-id="${record.id}">Lihat</button>
        </td>
      </tr>`;
    maintenanceTableBody.insertAdjacentHTML("beforeend", row);
  }

  async function fetchMaintenanceDetail(id) {
    currentMaintenanceId = id;
    showModal(detailOverlay);
    try {
      const record = await apiFetch(`${MAINTENANCE_API_ENDPOINT}${id}/`, {}, ADMIN_LOGIN_REDIRECT_URL);
      document.getElementById("detailMaintenanceAmbulancePlate").textContent = record.ambulance_details?.license_plate || "-";
      document.getElementById("detailMaintenanceAmbulanceType").textContent = record.ambulance_details?.ambulance_type || "-";
      document.getElementById("detailMaintenanceAmbulanceBrandModel").textContent = `${record.ambulance_details?.brand || ""} / ${record.ambulance_details?.model || ""}`;
      document.getElementById("detailMaintenanceDescription").textContent = record.description || "-";
      document.getElementById("detailMaintenanceReportId").textContent = record.id || "-";
      document.getElementById("detailMaintenanceReportDate").textContent = new Date(record.reported_date).toLocaleString("id-ID");
      document.getElementById("detailMaintenanceStatus").textContent = getStatusDisplay(record.status);
      document.getElementById("detailMaintenancePriority").textContent = record.priority || "-";
      document.getElementById("detailMaintenanceEstimateDate").textContent = record.estimated_completion_date || "-";
      document.getElementById("maintenanceStatusSelect").value = record.status;
    } catch (error) {
      showSnackbar("Gagal memuat detail perbaikan.", "error");
      closeModal(detailOverlay);
    }
  }

  async function handleUpdateStatus() {
    if (!currentMaintenanceId) return;

    const statusSelect = document.getElementById("maintenanceStatusSelect");
    const newStatus = statusSelect.value;

    try {
      await apiFetch(`${MAINTENANCE_API_ENDPOINT}${currentMaintenanceId}/update/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      showSnackbar("Status perbaikan berhasil diperbarui!", "success");
      closeModal(detailOverlay);
      loadMaintenanceRecords();
    } catch (error) {
      showSnackbar(error.message || "Gagal memperbarui status.", "error");
    }
  }

  maintenanceTableBody?.addEventListener("click", (e) => {
    if (e.target.classList.contains("view-btn")) {
      fetchMaintenanceDetail(e.target.dataset.id);
    }
  });

  document.getElementById("closeDetailMaintenanceBtn")?.addEventListener("click", () => closeModal(detailOverlay));
  document.getElementById("cancelMaintenanceUpdateBtn")?.addEventListener("click", () => closeModal(detailOverlay));
  document.getElementById("updateMaintenanceStatusBtn")?.addEventListener("click", handleUpdateStatus);

  loadMaintenanceRecords();
});
