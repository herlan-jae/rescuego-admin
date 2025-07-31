document.addEventListener("DOMContentLoaded", function () {
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const AMBULANCE_API_ENDPOINT = `${API_BASE_URL}/ambulances/api/`;
  const ADMIN_LOGIN_REDIRECT_URL = "login_screen.html";
  let currentAmbulanceId = null;

  const STATUS_MAP = {
    available: "Available",
    in_use: "In Use",
    maintenance: "Under Maintenance",
    out_of_service: "Out of Service",
  };

  const AMBULANCE_TYPE_MAP = {
    basic: "Basic Life Support (BLS)",
    advanced: "Advanced Life Support (ALS)",
    critical: "Critical Care Transport (CCT)",
    emergency: "Emergency Response Vehicle",
  };

  function translateBackendError(errorMessage) {
    if (typeof errorMessage !== "string") return "Terjadi kesalahan tidak dikenal.";

    if (errorMessage.toLowerCase().includes("capacity") && errorMessage.toLowerCase().includes("a valid integer is required")) {
      return "Kolom Kapasitas harus diisi dengan angka (contoh: 2).";
    }

    return errorMessage;
  }

  const getStatusKey = (displayName) => Object.keys(STATUS_MAP).find((key) => STATUS_MAP[key] === displayName);
  const getTypeKey = (displayName) => Object.keys(AMBULANCE_TYPE_MAP).find((key) => AMBULANCE_TYPE_MAP[key] === displayName);

  const ambulanceTableBody = document.getElementById("ambulanceTableBody");
  async function loadAmbulances() {
    if (!ambulanceTableBody) return;
    ambulanceTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4">Memuat data...</td></tr>`;
    try {
      const response = await apiFetch(AMBULANCE_API_ENDPOINT, {}, ADMIN_LOGIN_REDIRECT_URL);
      const ambulances = response.results || response || [];
      ambulanceTableBody.innerHTML = "";
      if (ambulances.length === 0) {
        ambulanceTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4">Tidak ada data ambulans.</td></tr>`;
        return;
      }
      ambulances.forEach(renderAmbulanceRow);
    } catch (error) {
      ambulanceTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-500">Gagal memuat data.</td></tr>`;
      showSnackbar("Gagal memuat data ambulans.", "error");
    }
  }

  function renderAmbulanceRow(ambulance) {
    const statusDisplay = ambulance.status_display || STATUS_MAP[ambulance.status] || ambulance.status;
    const typeDisplay = ambulance.ambulance_type_display || AMBULANCE_TYPE_MAP[ambulance.ambulance_type] || ambulance.ambulance_type;

    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">${ambulance.id}</td>
        <td class="px-6 py-4">${ambulance.license_plate}</td>
        <td class="px-6 py-4">${typeDisplay}</td>
        <td class="px-6 py-4">${ambulance.brand}/${ambulance.model}</td>
        <td class="px-6 py-4">${statusDisplay}</td>
        <td class="px-6 py-4">${ambulance.base_location}</td>
        <td class="px-6 py-4 text-center">
          <button class="view-btn text-[#5B2EFF] hover:underline" data-id="${ambulance.id}">Lihat</button>
        </td>
      </tr>`;
    ambulanceTableBody.insertAdjacentHTML("beforeend", row);
  }

  async function fetchAmbulanceDetail(id) {
    currentAmbulanceId = id;
    showModal(document.getElementById("detailAmbulanceOverlay"));

    try {
      const ambulance = await apiFetch(`${AMBULANCE_API_ENDPOINT}${id}/`, {}, ADMIN_LOGIN_REDIRECT_URL);

      document.getElementById("detailAmbulancePlate").textContent = ambulance.license_plate || "-";
      document.getElementById("detailAmbulanceType").textContent = ambulance.ambulance_type_display || AMBULANCE_TYPE_MAP[ambulance.ambulance_type] || "-";
      document.getElementById("detailAmbulanceBrand").textContent = ambulance.brand || "-";
      document.getElementById("detailAmbulanceModel").textContent = ambulance.model || "-";
      document.getElementById("detailAmbulanceYear").textContent = ambulance.year || "-";
      document.getElementById("detailAmbulanceCapacity").textContent = ambulance.capacity || "-";
      document.getElementById("detailAmbulanceBaseLocation").textContent = ambulance.base_location || "-";
      document.getElementById("detailAmbulanceStatus").textContent = ambulance.status_display || STATUS_MAP[ambulance.status] || "-";
      document.getElementById("detailAmbulanceEquipment").textContent = ambulance.equipment_list || "-";
    } catch (error) {
      showSnackbar("Gagal memuat detail ambulans.", "error");
      closeModal(document.getElementById("detailAmbulanceOverlay"));
    }
  }

  function populateEditForm() {
    if (!currentAmbulanceId) return;

    const typeKey = getTypeKey(document.getElementById("detailAmbulanceType").textContent);
    const statusKey = getStatusKey(document.getElementById("detailAmbulanceStatus").textContent);

    document.getElementById("editAmbulanceId").value = currentAmbulanceId;
    document.getElementById("edit_license_plate").value = document.getElementById("detailAmbulancePlate").textContent;
    document.getElementById("edit_year").value = document.getElementById("detailAmbulanceYear").textContent;
    document.getElementById("edit_ambulance_type").value = typeKey || "";
    document.getElementById("edit_capacity").value = document.getElementById("detailAmbulanceCapacity").textContent;
    document.getElementById("edit_brand").value = document.getElementById("detailAmbulanceBrand").textContent;
    document.getElementById("edit_base_location").value = document.getElementById("detailAmbulanceBaseLocation").textContent;
    document.getElementById("edit_model").value = document.getElementById("detailAmbulanceModel").textContent;
    document.getElementById("edit_equipment_list").value = document.getElementById("detailAmbulanceEquipment").textContent;
    document.getElementById("edit_status").value = statusKey || "";

    closeModal(document.getElementById("detailAmbulanceOverlay"));
    showModal(document.getElementById("editAmbulanceOverlay"));
  }

  function showModal(overlay) {
    if (overlay) overlay.classList.remove("hidden");
  }
  function closeModal(overlay) {
    if (overlay) overlay.classList.add("hidden");
  }

  async function handleAddFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (data.capacity === "") {
      delete data.capacity;
    }

    try {
      await apiFetch(AMBULANCE_API_ENDPOINT, { method: "POST", body: JSON.stringify(data) });
      showSnackbar("Ambulans berhasil ditambahkan!", "success");
      closeModal(document.getElementById("addAmbulanceOverlay"));
      loadAmbulances();
    } catch (error) {
      const friendlyMessage = translateBackendError(error.message);
      showSnackbar(friendlyMessage || "Gagal menambahkan ambulans.", "error");
    }
  }

  async function handleEditFormSubmit(e) {
    e.preventDefault();
    if (!currentAmbulanceId) return;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    delete data.id;

    if (data.capacity === "") {
      delete data.capacity;
    }

    try {
      await apiFetch(`${AMBULANCE_API_ENDPOINT}${currentAmbulanceId}/`, { method: "PUT", body: JSON.stringify(data) });
      showSnackbar("Ambulans berhasil diperbarui!", "success");
      closeModal(document.getElementById("editAmbulanceOverlay"));
      loadAmbulances();
    } catch (error) {
      const friendlyMessage = translateBackendError(error.message);
      showSnackbar(friendlyMessage || "Gagal memperbarui ambulans.", "error");
    }
  }
  async function handleDelete() {
    if (!currentAmbulanceId) return;

    const modal = document.getElementById("confirmationModal");
    const title = document.getElementById("confirm-title");
    const message = document.getElementById("confirm-message");
    const okBtn = document.getElementById("confirm-ok-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");

    if (!modal || !title || !message || !okBtn || !cancelBtn) {
      console.error("Elemen modal konfirmasi tidak ditemukan.");
      return;
    }

    title.textContent = "Konfirmasi Hapus";
    message.textContent = `Apakah Anda yakin ingin menghapus ambulans dengan ID ${currentAmbulanceId}? Tindakan ini tidak dapat dibatalkan.`;
    okBtn.textContent = "Ya, Hapus";

    showModal(modal);

    const handleConfirm = async () => {
      closeModal(modal);
      try {
        await apiFetch(`${AMBULANCE_API_ENDPOINT}${currentAmbulanceId}/`, { method: "DELETE" });

        showSnackbar("Ambulans berhasil dihapus!", "success");

        closeModal(document.getElementById("detailAmbulanceOverlay"));

        const rowToDelete = document.querySelector(`button.view-btn[data-id='${currentAmbulanceId}']`)?.closest("tr");
        if (rowToDelete) {
          rowToDelete.remove();
        }

        const ambulanceTableBody = document.getElementById("ambulanceTableBody");
        if (ambulanceTableBody && ambulanceTableBody.children.length === 0) {
          ambulanceTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">Tidak ada data ambulans.</td></tr>`;
        }
      } catch (error) {
        showSnackbar(error.message || "Gagal menghapus ambulans.", "error");
      } finally {
        cleanup();
      }
    };

    const handleCancel = () => {
      closeModal(modal);
      cleanup();
    };

    const cleanup = () => {
      okBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
    };

    okBtn.addEventListener("click", handleConfirm, { once: true });
    cancelBtn.addEventListener("click", handleCancel, { once: true });
  }

  document.getElementById("showAddAmbulanceForm")?.addEventListener("click", () => showModal(document.getElementById("addAmbulanceOverlay")));
  document.getElementById("closeAddAmbulanceBtn")?.addEventListener("click", () => closeModal(document.getElementById("addAmbulanceOverlay")));
  document.getElementById("cancelAddAmbulance")?.addEventListener("click", () => closeModal(document.getElementById("addAmbulanceOverlay")));
  document.getElementById("addAmbulanceForm")?.addEventListener("submit", handleAddFormSubmit);

  ambulanceTableBody?.addEventListener("click", (e) => e.target.classList.contains("view-btn") && fetchAmbulanceDetail(e.target.dataset.id));

  document.getElementById("closeDetailAmbulanceBtn")?.addEventListener("click", () => closeModal(document.getElementById("detailAmbulanceOverlay")));
  document.getElementById("editAmbulanceBtn")?.addEventListener("click", populateEditForm);
  document.getElementById("deleteAmbulanceBtn")?.addEventListener("click", handleDelete);

  document.getElementById("closeEditAmbulanceBtn")?.addEventListener("click", () => closeModal(document.getElementById("editAmbulanceOverlay")));
  document.getElementById("cancelEditAmbulance")?.addEventListener("click", () => closeModal(document.getElementById("editAmbulanceOverlay")));
  document.getElementById("editAmbulanceForm")?.addEventListener("submit", handleEditFormSubmit);

  loadAmbulances();
});
