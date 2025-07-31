document.addEventListener("DOMContentLoaded", function () {
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const ADMIN_LOGIN_REDIRECT_URL = "login_screen.html";

  async function loadDashboardData() {
    try {
      const data = await apiFetch(`${API_BASE_URL}/accounts/api/dashboard/`, {}, ADMIN_LOGIN_REDIRECT_URL);
      if (data.role === "admin" && data.stats) {
        const stats = data.stats;
        document.getElementById("totalReservations").textContent = stats.total_reservations ?? "0";
        document.getElementById("activeReservations").textContent = stats.active_reservations ?? "0";
        document.getElementById("availableAmbulances").textContent = stats.available_ambulances ?? "0";
        document.getElementById("pendingMaintenance").textContent = stats.pending_maintenance ?? "0";
      } else {
        throw new Error("Format data dashboard tidak sesuai untuk admin.");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showSnackbar(error.message || "Gagal memuat data dashboard.", "error");
      document.getElementById("totalReservations").textContent = "N/A";
      document.getElementById("activeReservations").textContent = "N/A";
      document.getElementById("availableAmbulances").textContent = "N/A";
      document.getElementById("pendingMaintenance").textContent = "N/A";
    }
  }
  loadDashboardData();
});
