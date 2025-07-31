document.addEventListener("DOMContentLoaded", function () {
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan. Pastikan utils.js dan apiHelper.js sudah dimuat.");
    return;
  }

  window.currentReservationId = null;
  window.currentDriverId = null;
  window.currentAmbulanceId = null;
  window.currentMaintenanceRecordId = null;
  window.currentUserId = null;

  const ADMIN_LOGIN_REDIRECT_URL = "index.html";

  const burgerMenuBtn = document.getElementById("burgerMenu");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (burgerMenuBtn && sidebar && sidebarOverlay) {
    burgerMenuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
      sidebarOverlay.classList.toggle("hidden");
    });

    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
      sidebarOverlay.classList.add("hidden");
    });
  } else {
    console.warn("Sidebar elements not found. Burger menu functionality might be impacted.");
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const confirmationModal = document.getElementById("confirmationModal");
      const confirmTitle = document.getElementById("confirm-title");
      const confirmMessage = document.getElementById("confirm-message");
      const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
      const confirmOkBtn = document.getElementById("confirm-ok-btn");
      const logoutButtonText = document.getElementById("logoutButtonText");
      const logoutLoadingSpinner = document.getElementById("logoutLoadingSpinner");

      if (!confirmationModal || !confirmOkBtn || !confirmCancelBtn) {
        console.error("Elemen modal konfirmasi untuk logout tidak ditemukan.");
        return;
      }

      if (confirmTitle) confirmTitle.textContent = "Konfirmasi Logout";
      if (confirmMessage) confirmMessage.textContent = "Apakah Anda yakin ingin keluar dari akun admin?";
      if (confirmOkBtn) {
        confirmOkBtn.textContent = "Ya, Logout";
        confirmOkBtn.className = "w-full px-5 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700";
      }

      confirmationModal.classList.remove("hidden");
      confirmationModal.classList.add("flex");

      const handleConfirmLogout = async () => {
        confirmationModal.classList.add("hidden");
        confirmationModal.classList.remove("flex");

        if (logoutBtn) {
          logoutBtn.disabled = true;
          if (logoutButtonText) logoutButtonText.classList.add("hidden");
          if (logoutLoadingSpinner) logoutLoadingSpinner.classList.remove("hidden");
        }

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            await apiFetch(`${API_BASE_URL}/accounts/api/logout/`, {
              method: "POST",
              body: JSON.stringify({ refresh: refreshToken }),
            });
          }
        } catch (error) {
          console.error("API logout gagal, tapi sesi lokal tetap dihapus.", error);
        } finally {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          showSnackbar("Anda telah berhasil logout.", "success");
          setTimeout(() => {
            window.location.href = ADMIN_LOGIN_REDIRECT_URL;
          }, 1000);
        }
      };

      const handleCancelLogout = () => {
        confirmationModal.classList.add("hidden");
        confirmationModal.classList.remove("flex");
        cleanupListeners();
      };

      const cleanupListeners = () => {
        confirmOkBtn.removeEventListener("click", handleConfirmLogout);
        confirmCancelBtn.removeEventListener("click", handleCancelLogout);
      };

      confirmOkBtn.addEventListener("click", handleConfirmLogout, { once: true });
      confirmCancelBtn.addEventListener("click", handleCancelLogout, { once: true });
    });
  }

  const currentPath = window.location.pathname;

  if (currentPath.includes("ambulance_screen.html")) {
    console.log("Initializing ambulance screen...");
    const ambulanceTableBody = document.getElementById("ambulanceTableBody");
    if (!ambulanceTableBody) {
      console.warn("#ambulanceTableBody not found for ambulance_screen.html.");
    }
  }

  if (currentPath.includes("driver_screen.html")) {
    console.log("Initializing driver screen...");

    if (typeof loadDrivers === "function") {
      const driverTableBody = document.getElementById("driverTableBody");
      if (driverTableBody) {
        loadDrivers(ADMIN_LOGIN_REDIRECT_URL);
        driverTableBody.addEventListener("click", function (event) {
          const detailButton = event.target.closest("button.view-btn");
          if (detailButton && detailButton.dataset.id) {
            if (typeof showDriverDetailPopup === "function") {
              showDriverDetailPopup(detailButton.dataset.id, ADMIN_LOGIN_REDIRECT_URL);
            }
          }
        });
      } else {
        console.warn("#driverTableBody not found for driver_screen.html.");
      }
    } else {
      console.warn("Fungsi loadDrivers tidak ditemukan. Pastikan drivers.js sudah dimuat.");
    }
  }

  if (currentPath.includes("reservation_screen.html")) {
    console.log("Initializing reservation screen...");

    if (typeof loadReservations === "function") {
      const reservationTableBody = document.getElementById("reservationTableBody");
      if (reservationTableBody) {
        loadReservations();

        reservationTableBody.addEventListener("click", function (event) {
          const detailButton = event.target.closest("button.view-btn");
          if (detailButton && detailButton.dataset.id) {
            if (typeof fetchReservationDetail === "function") {
              fetchReservationDetail(detailButton.dataset.id);
            }
          }
        });
      } else {
        console.warn("#reservationTableBody not found for reservation_screen.html.");
      }
    } else {
      console.warn("Fungsi loadReservations tidak ditemukan. Pastikan reservations.js sudah dimuat.");
    }
  }

  if (currentPath.includes("maintenance_screen.html")) {
    console.log("Initializing maintenance screen...");

    if (typeof loadMaintenanceRecords === "function") {
      const maintenanceTableBody = document.getElementById("maintenanceTableBody");
      if (maintenanceTableBody) {
        loadMaintenanceRecords();

        maintenanceTableBody.addEventListener("click", function (event) {
          const detailButton = event.target.closest("button.view-btn");
          if (detailButton && detailButton.dataset.id) {
            if (typeof fetchMaintenanceDetail === "function") {
              fetchMaintenanceDetail(detailButton.dataset.id);
            }
          }
        });
      } else {
        console.warn("#maintenanceTableBody not found for maintenance_screen.html.");
      }
    } else {
      console.warn("Fungsi loadMaintenanceRecords tidak ditemukan. Pastikan maintenance.js sudah dimuat.");
    }
  }

  if (currentPath.includes("dashboard_screen.html")) {
    console.log("Initializing dashboard screen...");

    if (typeof loadDashboardData === "function") {
      loadDashboardData();
    } else {
      console.warn("Fungsi loadDashboardData tidak ditemukan. Pastikan dashboard.js sudah dimuat.");
    }
  }
});
