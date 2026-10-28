/**
 * PocketPLUS - Główny punkt wejściowy aplikacji
 * Inicjalizuje nasłuchiwacze zdarzeń, ładuje stan początkowy i uruchamia ekran startowy.
 */

document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    loadLockdownState();
    loadSavedAuth();
    loadSyncQueue();
    checkInitialData();
    showWelcomeScreen();
});

function initEvents() {
    // Nawigacja
    const btnNavHome = document.getElementById("btnNavHome");
    if (btnNavHome) {
        btnNavHome.addEventListener("click", showWelcomeScreen);
    }

    // Odświeżanie danych z chmury
    const btnRefreshData = document.getElementById("btnRefreshData");
    if (btnRefreshData) {
        btnRefreshData.addEventListener("click", () => {
            fetchTransactionsFromBackend(true);
        });
    }

    // Modal autoryzacji
    const btnAdminLoginModal = document.getElementById("btnAdminLoginModal");
    if (btnAdminLoginModal) {
        btnAdminLoginModal.addEventListener("click", () => {
            openModal("adminLoginModal");
        });
    }

    const btnLogoutAdmin = document.getElementById("btnLogoutAdmin");
    if (btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener("click", logoutAdmin);
    }

    const adminLoginForm = document.getElementById("adminLoginForm");
    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", handleAdminLoginSubmit);
    }

    // Zamykanie modali
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const modalId = e.currentTarget.getAttribute("data-close");
            closeModal(modalId);
        });
    });

    // Wyszukiwarka i filtry
    const searchInput = document.getElementById("searchInput");
    const btnClearSearch = document.getElementById("btnClearSearch");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.filters.search = e.target.value.trim().toLowerCase();
            if (btnClearSearch) btnClearSearch.style.display = state.filters.search ? "inline-block" : "none";
            state.pagination.currentPage = 1;
            renderTransactionsTable();
        });
    }
    if (btnClearSearch) {
        btnClearSearch.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            state.filters.search = "";
            btnClearSearch.style.display = "none";
            state.pagination.currentPage = 1;
            renderTransactionsTable();
        });
    }

    const filterTypeSelect = document.getElementById("filterTypeSelect");
    if (filterTypeSelect) {
        filterTypeSelect.addEventListener("change", (e) => {
            state.filters.type = e.target.value;
            state.pagination.currentPage = 1;
            renderTransactionsTable();
        });
    }

    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            state.filters.sort = e.target.value;
            state.pagination.currentPage = 1;
            renderTransactionsTable();
        });
    }

    // Paginacja
    const btnPagePrev = document.getElementById("btnPagePrev");
    const btnPageNext = document.getElementById("btnPageNext");
    if (btnPagePrev) {
        btnPagePrev.addEventListener("click", () => {
            if (state.pagination.currentPage > 1) {
                state.pagination.currentPage--;
                renderTransactionsTable();
            }
        });
    }
    if (btnPageNext) {
        btnPageNext.addEventListener("click", () => {
            if (state.pagination.currentPage < state.pagination.totalPages) {
                state.pagination.currentPage++;
                renderTransactionsTable();
            }
        });
    }

    // Przełącznik wydatek / zysk w szybkim dodawaniu
    const btnKindExpense = document.getElementById("btnKindExpense");
    const btnKindIncome = document.getElementById("btnKindIncome");
    if (btnKindExpense && btnKindIncome) {
        btnKindExpense.addEventListener("click", () => {
            state.quickKind = "expense";
            btnKindExpense.classList.add("active");
            btnKindIncome.classList.remove("active");
        });
        btnKindIncome.addEventListener("click", () => {
            state.quickKind = "income";
            btnKindIncome.classList.add("active");
            btnKindExpense.classList.remove("active");
        });
    }

    // Checkbox oszczędności
    const quickCheckSavings = document.getElementById("quickCheckSavings");
    const quickInputSavingsAmount = document.getElementById("quickInputSavingsAmount");
    if (quickCheckSavings && quickInputSavingsAmount) {
        quickCheckSavings.addEventListener("change", (e) => {
            quickInputSavingsAmount.style.display = e.target.checked ? "block" : "none";
            if (e.target.checked) quickInputSavingsAmount.focus();
        });
    }

    // Formularz szybkiego dodawania
    const quickAddForm = document.getElementById("quickAddForm");
    if (quickAddForm) {
        quickAddForm.addEventListener("submit", handleQuickAddSubmit);
    }

    // Status synchronizacji
    const btnSyncStatus = document.getElementById("btnSyncStatus");
    const syncQueuePanel = document.getElementById("syncQueuePanel");
    if (btnSyncStatus && syncQueuePanel) {
        btnSyncStatus.addEventListener("click", () => {
            const isHidden = syncQueuePanel.style.display === "none";
            syncQueuePanel.style.display = isHidden ? "block" : "none";
        });
    }
}