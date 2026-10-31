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

    // Przełączanie 3 podstron (Transakcje, Długi, Subskrypcje)
    document.querySelectorAll(".btn-subpage").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const dbId = e.currentTarget.getAttribute("data-db");
            if (dbId) {
                openDashboardScreen(dbId);
            }
        });
    });

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

    // Zamykanie modali (przyciski z data-close oraz kliknięcie w pustą przestrzeń/tło)
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const modalId = e.currentTarget.getAttribute("data-close");
            closeModal(modalId);
        });
    });

    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) {
                closeModal(backdrop.id);
            }
        });
    });

    // Wyszukiwarka i filtry
    const searchInput = document.getElementById("searchInput");
    const btnClearSearch = document.getElementById("btnClearSearch");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.filters.search = e.target.value.trim().toLowerCase();
            if (btnClearSearch) btnClearSearch.style.display = state.filters.search ? "inline-block" : "none";
            state.infiniteScroll.renderedCount = state.infiniteScroll.batchSize;
            state.infiniteScroll.allLoaded = false;
            renderTransactionsTable();
        });
    }
    if (btnClearSearch) {
        btnClearSearch.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            state.filters.search = "";
            btnClearSearch.style.display = "none";
            state.infiniteScroll.renderedCount = state.infiniteScroll.batchSize;
            state.infiniteScroll.allLoaded = false;
            renderTransactionsTable();
        });
    }

    // Przycisk rozwijania filtrów Typ i Sortuj (< / >)
    const btnToggleFilters = document.getElementById("btnToggleFilters");
    const controlActionsInline = document.getElementById("controlActionsInline");
    if (btnToggleFilters && controlActionsInline) {
        btnToggleFilters.addEventListener("click", () => {
            const isCollapsed = controlActionsInline.classList.contains("is-collapsed");
            if (isCollapsed) {
                controlActionsInline.classList.remove("is-collapsed");
                btnToggleFilters.textContent = "<";
                btnToggleFilters.title = "Ukryj filtry";
            } else {
                controlActionsInline.classList.add("is-collapsed");
                btnToggleFilters.textContent = ">";
                btnToggleFilters.title = "Pokaż filtry (Typ i Sortowanie)";
            }
        });
    }

    const filterTypeSelect = document.getElementById("filterTypeSelect");
    if (filterTypeSelect) {
        filterTypeSelect.addEventListener("change", (e) => {
            state.filters.type = e.target.value;
            state.infiniteScroll.renderedCount = state.infiniteScroll.batchSize;
            state.infiniteScroll.allLoaded = false;
            renderTransactionsTable();
        });
    }

    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            state.filters.sort = e.target.value;
            state.infiniteScroll.renderedCount = state.infiniteScroll.batchSize;
            state.infiniteScroll.allLoaded = false;
            renderTransactionsTable();
        });
    }

    // Dynamiczne ładowanie rekordów tabeli (Infinite Scroll) przy zbliżaniu się do końca scrolla tabeli
    const tableWrapper = document.querySelector(".glass-table-wrapper");
    if (tableWrapper) {
        tableWrapper.addEventListener("scroll", () => {
            const { scrollTop, scrollHeight, clientHeight } = tableWrapper;
            // Gdy użytkownik jest blisko końca tabeli (margines np. 120px)
            if (scrollTop + clientHeight >= scrollHeight - 120) {
                loadMoreTableRecords();
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

    // Inteligentne pole oszczędności
    const quickCheckSavings = document.getElementById("quickCheckSavings");
    const quickInputSavingsAmount = document.getElementById("quickInputSavingsAmount");
    const quickInputAmount = document.getElementById("quickInputAmount");

    function calculateRemainderToFullZloty(costVal) {
        const num = parseFloat(costVal) || 0;
        if (num <= 0) return 0;
        const fractional = num % 1;
        if (fractional > 0.001) {
            return Math.round((1 - fractional) * 100) / 100;
        }
        return 0;
    }

    if (quickCheckSavings && quickInputSavingsAmount) {
        quickCheckSavings.addEventListener("change", (e) => {
            if (e.target.checked) {
                quickInputSavingsAmount.disabled = false;
                // Jeśli wpisano już kwotę, automatycznie uzupełnij kwotę groszy do pełnej złotówki
                if (quickInputAmount && quickInputAmount.value) {
                    const remainder = calculateRemainderToFullZloty(quickInputAmount.value);
                    quickInputSavingsAmount.value = remainder > 0 ? remainder.toFixed(2) : "";
                }
                quickInputSavingsAmount.focus();
            } else {
                quickInputSavingsAmount.disabled = true;
                quickInputSavingsAmount.value = "";
            }
        });
    }

    // Jeśli użytkownik zaznaczył oszczędność, a dopiero później wpisuje lub zmienia koszt w formularzu dolnym
    if (quickInputAmount && quickInputSavingsAmount && quickCheckSavings) {
        quickInputAmount.addEventListener("input", () => {
            if (quickCheckSavings.checked && (!quickInputSavingsAmount.value || quickInputSavingsAmount.dataset.autoCalculated === "true")) {
                const remainder = calculateRemainderToFullZloty(quickInputAmount.value);
                if (remainder > 0) {
                    quickInputSavingsAmount.value = remainder.toFixed(2);
                    quickInputSavingsAmount.dataset.autoCalculated = "true";
                }
            }
        });

        // Jeśli użytkownik sam zmodyfikuje kwotę w polu oszczędności, zdejmujemy flagę auto
        quickInputSavingsAmount.addEventListener("input", () => {
            quickInputSavingsAmount.dataset.autoCalculated = "false";
        });
    }

    // Inteligentne pole w modalu (pop-upie)
    const btnModalKindExpense = document.getElementById("btnModalKindExpense");
    const btnModalKindIncome = document.getElementById("btnModalKindIncome");
    if (btnModalKindExpense && btnModalKindIncome) {
        btnModalKindExpense.addEventListener("click", () => {
            btnModalKindExpense.classList.add("active");
            btnModalKindIncome.classList.remove("active");
        });
        btnModalKindIncome.addEventListener("click", () => {
            btnModalKindIncome.classList.add("active");
            btnModalKindExpense.classList.remove("active");
        });
    }

    const modalCheckSavings = document.getElementById("modalCheckSavings");
    const editEntrySavings = document.getElementById("editEntrySavings");
    const editEntryAmount = document.getElementById("editEntryAmount");

    if (modalCheckSavings && editEntrySavings) {
        modalCheckSavings.addEventListener("change", (e) => {
            if (e.target.checked) {
                editEntrySavings.disabled = false;
                if (editEntryAmount && editEntryAmount.value) {
                    const remainder = calculateRemainderToFullZloty(editEntryAmount.value);
                    editEntrySavings.value = remainder > 0 ? remainder.toFixed(2) : "";
                }
                editEntrySavings.focus();
            } else {
                editEntrySavings.disabled = true;
                editEntrySavings.value = "";
            }
        });
    }

    if (editEntryAmount && editEntrySavings && modalCheckSavings) {
        editEntryAmount.addEventListener("input", () => {
            if (modalCheckSavings.checked && (!editEntrySavings.value || editEntrySavings.dataset.autoCalculated === "true")) {
                const remainder = calculateRemainderToFullZloty(editEntryAmount.value);
                if (remainder > 0) {
                    editEntrySavings.value = remainder.toFixed(2);
                    editEntrySavings.dataset.autoCalculated = "true";
                }
            }
        });
        editEntrySavings.addEventListener("input", () => {
            editEntrySavings.dataset.autoCalculated = "false";
        });
    }

    // Przycisk ustawień (zarządzanie typami)
    const btnSettingsModal = document.getElementById("btnSettingsModal");
    if (btnSettingsModal) {
        btnSettingsModal.addEventListener("click", openSettingsModal);
    }

    const btnAddNewType = document.getElementById("btnAddNewType");
    if (btnAddNewType) {
        btnAddNewType.addEventListener("click", handleAddType);
    }

    // Przycisk dodawania na telefonie (otwiera modal wpisu)
    const btnOpenMobileAddModal = document.getElementById("btnOpenMobileAddModal");
    if (btnOpenMobileAddModal) {
        btnOpenMobileAddModal.addEventListener("click", () => {
            openEntryEditModal(null);
        });
    }

    // Przycisk dodawania na górnej belce (desktop i telefon)
    const btnHeaderAddEntry = document.getElementById("btnHeaderAddEntry");
    if (btnHeaderAddEntry) {
        btnHeaderAddEntry.addEventListener("click", () => {
            openEntryEditModal(null);
        });
    }

    // Mobilny hamburger i szuflada nawigacyjna
    const btnMobileMenuHamburger = document.getElementById("btnMobileMenuHamburger");
    const mobileNavDrawer = document.getElementById("mobileNavDrawer");
    const mobileNavDrawerBackdrop = document.getElementById("mobileNavDrawerBackdrop");
    const btnCloseMobileDrawer = document.getElementById("btnCloseMobileDrawer");

    function closeMobileDrawer() {
        if (mobileNavDrawer) mobileNavDrawer.style.display = "none";
    }

    function openMobileDrawer() {
        if (mobileNavDrawer) {
            // Aktualizacja widoczności przycisków w szufladzie
            const btnDrawerSettings = document.getElementById("btnDrawerSettings");
            const btnDrawerLogout = document.getElementById("btnDrawerLogout");
            if (btnDrawerSettings) btnDrawerSettings.style.display = state.isAdmin ? "flex" : "none";
            if (btnDrawerLogout) btnDrawerLogout.style.display = state.isAdmin ? "flex" : "none";
            mobileNavDrawer.style.display = "block";
        }
    }

    if (btnMobileMenuHamburger) {
        btnMobileMenuHamburger.addEventListener("click", openMobileDrawer);
    }
    if (btnCloseMobileDrawer) {
        btnCloseMobileDrawer.addEventListener("click", closeMobileDrawer);
    }
    if (mobileNavDrawerBackdrop) {
        mobileNavDrawerBackdrop.addEventListener("click", closeMobileDrawer);
    }

    // Opcje w szufladzie mobilnej:
    document.querySelectorAll("[data-drawer-nav]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const dbId = e.currentTarget.getAttribute("data-drawer-nav");
            if (dbId) {
                openDashboardScreen(dbId);
                closeMobileDrawer();
            }
        });
    });

    const btnDrawerHome = document.getElementById("btnDrawerHome");
    if (btnDrawerHome) {
        btnDrawerHome.addEventListener("click", () => {
            closeMobileDrawer();
            showWelcomeScreen();
        });
    }

    const btnDrawerSettings = document.getElementById("btnDrawerSettings");
    if (btnDrawerSettings) {
        btnDrawerSettings.addEventListener("click", () => {
            closeMobileDrawer();
            openSettingsModal();
        });
    }

    const btnDrawerAccess = document.getElementById("btnDrawerAccess");
    if (btnDrawerAccess) {
        btnDrawerAccess.addEventListener("click", () => {
            closeMobileDrawer();
            openModal("adminLoginModal");
        });
    }

    const btnDrawerRefresh = document.getElementById("btnDrawerRefresh");
    if (btnDrawerRefresh) {
        btnDrawerRefresh.addEventListener("click", () => {
            closeMobileDrawer();
            fetchTransactionsFromBackend(true);
        });
    }

    const btnDrawerLogout = document.getElementById("btnDrawerLogout");
    if (btnDrawerLogout) {
        btnDrawerLogout.addEventListener("click", () => {
            closeMobileDrawer();
            logoutAdmin();
        });
    }

    // Modal edycji wpisu
    const entryEditForm = document.getElementById("entryEditForm");
    if (entryEditForm) {
        entryEditForm.addEventListener("submit", handleEntryEditSubmit);
    }

    const btnDeleteCurrentEntry = document.getElementById("btnDeleteCurrentEntry");
    if (btnDeleteCurrentEntry) {
        btnDeleteCurrentEntry.addEventListener("click", handleDeleteFromEditModal);
    }

    // Modal potwierdzenia usunięcia
    const btnCancelConfirmDelete = document.getElementById("btnCancelConfirmDelete");
    const btnAcceptConfirmDelete = document.getElementById("btnAcceptConfirmDelete");
    const confirmDeleteModal = document.getElementById("confirmDeleteModal");

    if (btnCancelConfirmDelete) {
        btnCancelConfirmDelete.addEventListener("click", () => {
            pendingDeleteAction = null;
            closeModal("confirmDeleteModal");
        });
    }

    if (btnAcceptConfirmDelete) {
        btnAcceptConfirmDelete.addEventListener("click", () => {
            if (typeof pendingDeleteAction === "function") {
                const actionToRun = pendingDeleteAction;
                pendingDeleteAction = null;
                actionToRun();
            }
            closeModal("confirmDeleteModal");
        });
    }

    if (confirmDeleteModal) {
        confirmDeleteModal.addEventListener("click", (e) => {
            if (e.target === confirmDeleteModal) {
                pendingDeleteAction = null;
                closeModal("confirmDeleteModal");
            }
        });
    }

    // Panel boczny statystyk na mobile
    const btnToggleMobileStats = document.getElementById("btnToggleMobileStats");
    const mobileSidebarBackdrop = document.getElementById("mobileSidebarBackdrop");
    const dashboardStatsSidebar = document.getElementById("dashboardStatsSidebar");

    if (btnToggleMobileStats && dashboardStatsSidebar) {
        btnToggleMobileStats.addEventListener("click", () => {
            dashboardStatsSidebar.classList.toggle("mobile-open");
            if (mobileSidebarBackdrop) {
                mobileSidebarBackdrop.style.display = dashboardStatsSidebar.classList.contains("mobile-open") ? "block" : "none";
            }
        });
    }

    if (mobileSidebarBackdrop && dashboardStatsSidebar) {
        mobileSidebarBackdrop.addEventListener("click", () => {
            dashboardStatsSidebar.classList.remove("mobile-open");
            mobileSidebarBackdrop.style.display = "none";
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

    // Zamknięcie menu 3 kropek w tabeli po kliknięciu poza obszarem menu
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".row-actions-dropdown")) {
            document.querySelectorAll(".row-actions-menu").forEach(m => {
                m.style.display = "none";
            });
            document.querySelectorAll(".btn-row-more").forEach(b => {
                b.classList.remove("is-active");
            });
        }
    });
}