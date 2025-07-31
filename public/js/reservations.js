document.addEventListener("DOMContentLoaded", function () {
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const RESERVATION_API_ENDPOINT = `${API_BASE_URL}/reservations/api/`;
  const ADMIN_LOGIN_REDIRECT_URL = "login_screen.html";
  let currentReservationId = null;

  const STATUS_MAP = {
    pending: "Pending",
    accepted: "Diterima",
    on_the_way: "Menuju Lokasi",
    picking_up: "Menjemput Pasien",
    en_route_to_hospital: "Menuju RS",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  const getStatusDisplay = (status) => STATUS_MAP[status] || status;

  const tableBody = document.getElementById("reservationTableBody");
  const detailOverlay = document.getElementById("detailReservationOverlay");
  const assignOverlay = document.getElementById("assignReservationOverlay");
  const updateStatusOverlay = document.getElementById("updateStatusOverlay");
  const assignForm = document.getElementById("assignReservationForm");
  const updateStatusForm = document.getElementById("updateStatusForm");

  const showModal = (overlay) => overlay?.classList.remove("hidden");
  const closeModal = (overlay) => overlay?.classList.add("hidden");

  async function loadReservations() {
    if (!tableBody) return;
    tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">Memuat data reservasi...</td></tr>`;
    try {
      const data = await apiFetch(RESERVATION_API_ENDPOINT, {}, ADMIN_LOGIN_REDIRECT_URL);
      const reservations = data.results || data || [];
      tableBody.innerHTML = "";
      if (reservations.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">Tidak ada data reservasi.</td></tr>`;
        return;
      }
      reservations.forEach(renderReservationRow);
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
      showSnackbar("Gagal memuat data reservasi.", "error");
    }
  }

  function renderReservationRow(res) {
    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">${res.id}</td>
        <td class="px-6 py-4 font-medium">${res.patient_name}</td>
        <td class="px-6 py-4 font-semibold">${getStatusDisplay(res.status)}</td>
        <td class="px-6 py-4">${res.assigned_driver_details?.full_name || "---"}</td>
        <td class="px-6 py-4">${res.assigned_ambulance_details?.license_plate || "---"}</td>
        <td class="px-6 py-4 text-center">
          <button class="view-btn text-[#5B2EFF] hover:underline" data-id="${res.id}">Lihat</button>
        </td>
      </tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
  }

  async function fetchReservationDetail(id) {
    currentReservationId = id;
    showModal(detailOverlay);
    try {
      const res = await apiFetch(`${RESERVATION_API_ENDPOINT}${id}/`, {}, ADMIN_LOGIN_REDIRECT_URL);
      document.getElementById("detailPatientName").textContent = res.patient_name || "-";
      document.getElementById("detailPatientAge").textContent = res.patient_age || "-";
      document.getElementById("detailPatientNotes").textContent = res.notes || "-";
      document.getElementById("detailStatusText").textContent = getStatusDisplay(res.status);
      document.getElementById("detailDriverName").textContent = res.assigned_driver_details?.full_name || "Belum Ditugaskan";
      document.getElementById("detailAmbulancePlate").textContent = res.assigned_ambulance_details?.license_plate || "Belum Ditugaskan";
      document.getElementById("detailTimestamp").textContent = new Date(res.requested_at).toLocaleString("id-ID");

      const assignBtn = document.getElementById("assignReservationBtn");
      const cancelBtn = document.getElementById("cancelReservationBtn");
      assignBtn.style.display = res.status === "pending" ? "flex" : "none";
      cancelBtn.disabled = ["completed", "cancelled"].includes(res.status);
    } catch (error) {
      showSnackbar("Gagal memuat detail reservasi.", "error");
      closeModal(detailOverlay);
    }
  }

  async function handleShowAssignPopup() {
    if (!currentReservationId) return;
    const driverSelect = document.getElementById("assignDriverSelect");
    const ambulanceSelect = document.getElementById("assignAmbulanceSelect");
    driverSelect.innerHTML = `<option value="">Memuat...</option>`;
    ambulanceSelect.innerHTML = `<option value="">Memuat...</option>`;
    closeModal(detailOverlay);
    showModal(assignOverlay);

    try {
      const resources = await apiFetch(`${RESERVATION_API_ENDPOINT}resources/`, {}, ADMIN_LOGIN_REDIRECT_URL);
      driverSelect.innerHTML = '<option value="">-- Pilih Supir --</option>';
      resources.available_drivers.forEach((d) => (driverSelect.innerHTML += `<option value="${d.id}">${d.full_name}</option>`));
      ambulanceSelect.innerHTML = '<option value="">-- Pilih Ambulans --</option>';
      resources.available_ambulances.forEach((a) => (ambulanceSelect.innerHTML += `<option value="${a.id}">${a.license_plate}</option>`));
    } catch (error) {
      showSnackbar("Gagal memuat supir/ambulans.", "error");
      closeModal(assignOverlay);
    }
  }

  async function handleAssignFormSubmit(e) {
    e.preventDefault();
    if (!currentReservationId) return;
    const driverId = document.getElementById("assignDriverSelect").value;
    const ambulanceId = document.getElementById("assignAmbulanceSelect").value;
    if (!driverId || !ambulanceId) {
      showSnackbar("Supir dan ambulans harus dipilih.", "error");
      return;
    }
    try {
      await apiFetch(`${RESERVATION_API_ENDPOINT}${currentReservationId}/assign/`, {
        method: "POST",
        body: JSON.stringify({ driver_id: driverId, ambulance_id: ambulanceId }),
      });

      showSnackbar("Reservasi berhasil diterima dan ditugaskan!", "success");

      closeModal(assignOverlay);
      loadReservations();
    } catch (error) {
      showSnackbar(error.message || "Gagal menugaskan reservasi.", "error");
    }
  }

  async function handleUpdateStatusFormSubmit(e) {
    e.preventDefault();
    if (!currentReservationId) return;
    const newStatus = document.getElementById("statusSelect").value;
    try {
      await apiFetch(`${RESERVATION_API_ENDPOINT}${currentReservationId}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      showSnackbar("Status berhasil diperbarui!", "success");
      closeModal(updateStatusOverlay);
      loadReservations();
    } catch (error) {
      showSnackbar(error.message || "Gagal update status.", "error");
    }
  }

  function handleCancelReservation() {
    if (!currentReservationId) return;
    const modal = document.getElementById("confirmationModal");
    document.getElementById("confirm-title").textContent = "Konfirmasi Pembatalan";
    document.getElementById("confirm-message").textContent = "Apakah Anda yakin ingin membatalkan reservasi ini?";
    document.getElementById("confirm-ok-btn").textContent = "Ya, Batalkan";
    showModal(modal);

    const handleConfirm = async () => {
      closeModal(modal);
      try {
        await apiFetch(`${RESERVATION_API_ENDPOINT}${currentReservationId}/cancel/`, { method: "POST" });
        showSnackbar("Reservasi berhasil dibatalkan.", "success");
        closeModal(detailOverlay);
        loadReservations();
      } catch (error) {
        showSnackbar(error.message || "Gagal membatalkan reservasi.", "error");
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

  tableBody?.addEventListener("click", (e) => {
    if (e.target.classList.contains("view-btn")) fetchReservationDetail(e.target.dataset.id);
  });

  document.getElementById("closeDetailReservationBtn")?.addEventListener("click", () => closeModal(detailOverlay));
  document.getElementById("assignReservationBtn")?.addEventListener("click", handleShowAssignPopup);
  document.getElementById("updateStatusBtn")?.addEventListener("click", () => {
    closeModal(detailOverlay);
    showModal(updateStatusOverlay);
  });
  document.getElementById("cancelReservationBtn")?.addEventListener("click", handleCancelReservation);

  document.getElementById("closeAssignPopupBtn")?.addEventListener("click", () => closeModal(assignOverlay));
  document.getElementById("cancelAssignBtn")?.addEventListener("click", () => closeModal(assignOverlay));
  assignForm?.addEventListener("submit", handleAssignFormSubmit);

  document.getElementById("closeUpdateStatusPopupBtn")?.addEventListener("click", () => closeModal(updateStatusOverlay));
  document.getElementById("cancelUpdateStatusBtn")?.addEventListener("click", () => closeModal(updateStatusOverlay));
  updateStatusForm?.addEventListener("submit", handleUpdateStatusFormSubmit);

  loadReservations();
});
