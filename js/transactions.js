/**
 * PocketPLUS - Widok pulpitu, tabela transakcji, filtry i szybkie dodawanie
 */

function openDashboardScreen() {
    state.currentScreen = "dashboard";
    document.body.className = "screen-dashboard";
    const appHeader = document.getElementById("appHeader");
    const welcomeScreen = document.getElementById("welcomeScreen");
    const dashboardScreen = document.getElementById("dashboardScreen");

    if (welcomeScreen) welcomeScreen.style.display = "none";
    if (appHeader) appHeader.style.display = "flex";
    if (dashboardScreen) dashboardScreen.style.display = "block";

    populateTypeDropdowns();
    renderTransactionsTable();

    if (state.isAdmin) {
        fetchTransactionsFromBackend(false);
    }
}

function populateTypeDropdowns() {
    const filterTypeSelect = document.getElementById("filterTypeSelect");
    const quickSelectType = document.getElementById("quickSelectType");

    if (filterTypeSelect) {
        const currentVal = filterTypeSelect.value;
        filterTypeSelect.innerHTML = '<option value="all">Wszystkie typy</option>';
        state.types.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t;
            filterTypeSelect.appendChild(opt);
        });
        filterTypeSelect.value = currentVal || "all";
    }

    if (quickSelectType) {
        quickSelectType.innerHTML = "";
        state.types.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t;
            quickSelectType.appendChild(opt);
        });
    }
}

async function checkInitialData() {
    const cached = localStorage.getItem(CACHE_KEYS.TRANSACTIONS);
    if (cached) {
        try {
            state.transactions = JSON.parse(cached);
            return;
        } catch (e) {}
    }

    await loadDefaultTransactionsCsv();
}

async function loadDefaultTransactionsCsv() {
    try {
        const res = await fetch("assets/default_transactions.csv");
        if (!res.ok) throw new Error("Błąd odczytu CSV");
        const csvText = await res.text();
        state.transactions = parseCsvTransactions(csvText);
        saveTransactionsToCache();
    } catch (err) {
        state.transactions = [
            { id: 1, name: "Zakupy spożywcze", type: "Codzienny", amount: -84.50, savings: 0, date: "2026-10-24" },
            { id: 2, name: "Wynagrodzenie zlecenia", type: "Praca", amount: 1250.00, savings: 0, date: "2026-10-25" },
            { id: 3, name: "Bilety komunikacja", type: "Studia", amount: -18.00, savings: 2.00, date: "2026-10-25" }
        ];
        saveTransactionsToCache();
    }
}

function parseCsvTransactions(csv) {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];

    const items = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length >= 6) {
            items.push({
                id: parseInt(parts[0], 10) || i,
                name: parts[1].trim(),
                type: parts[2].trim(),
                amount: parseFloat(parts[3]) || 0,
                savings: parseFloat(parts[4]) || 0,
                date: parts[5].trim()
            });
        }
    }
    return items;
}

function renderTransactionsTable() {
    const tbody = document.getElementById("transactionsTbody");
    const emptyMsg = document.getElementById("emptyTableMessage");
    if (!tbody) return;

    let filtered = [...state.transactions];

    if (state.filters.search) {
        filtered = filtered.filter(t => t.name.toLowerCase().includes(state.filters.search));
    }

    if (state.filters.type && state.filters.type !== "all") {
        filtered = filtered.filter(t => t.type === state.filters.type);
    }

    filtered.sort((a, b) => {
        switch (state.filters.sort) {
            case "date_asc":
                return new Date(a.date) - new Date(b.date);
            case "date_desc":
                return new Date(b.date) - new Date(a.date);
            case "amount_asc":
                return a.amount - b.amount;
            case "amount_desc":
                return b.amount - a.amount;
            case "name_asc":
                return a.name.localeCompare(b.name);
            default:
                return b.id - a.id;
        }
    });

    const totalItems = filtered.length;
    state.pagination.totalPages = Math.max(1, Math.ceil(totalItems / state.pagination.itemsPerPage));
    if (state.pagination.currentPage > state.pagination.totalPages) {
        state.pagination.currentPage = state.pagination.totalPages;
    }

    const startIdx = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const pageItems = filtered.slice(startIdx, startIdx + state.pagination.itemsPerPage);

    tbody.innerHTML = "";

    if (pageItems.length === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
    } else {
        if (emptyMsg) emptyMsg.style.display = "none";

        pageItems.forEach(t => {
            const tr = document.createElement("tr");

            const isIncome = t.amount >= 0;
            const formattedAmount = (isIncome ? "+" : "") + Number(t.amount).toFixed(2) + " zł";
            const amountClass = isIncome ? "amount-income" : "amount-expense";

            const formattedSavings = t.savings > 0 ? `<span class="savings-tag">+${Number(t.savings).toFixed(2)} zł</span>` : "-";

            tr.innerHTML = `
                <td>${t.id}</td>
                <td style="font-weight: 500;">${escapeHtml(t.name)}</td>
                <td><span class="type-badge">${escapeHtml(t.type || "Codzienny")}</span></td>
                <td style="text-align: right;" class="amount-cell ${amountClass}">${formattedAmount}</td>
                <td style="text-align: right;">${formattedSavings}</td>
                <td style="text-align: center; color: var(--color-text-muted); font-size: 13px;">${escapeHtml(t.date || "")}</td>
                <td style="text-align: center;">
                    <button type="button" class="btn-row-action" title="Usuń transakcję" data-id="${t.id}">[x]</button>
                </td>
            `;

            const btnDelete = tr.querySelector(".btn-row-action");
            if (btnDelete) {
                btnDelete.addEventListener("click", () => handleDeleteTransaction(t.id));
            }

            tbody.appendChild(tr);
        });
    }

    updatePaginationControls();
}

function updatePaginationControls() {
    const currentText = document.getElementById("paginationCurrentText");
    const btnPrev = document.getElementById("btnPagePrev");
    const btnNext = document.getElementById("btnPageNext");

    if (currentText) {
        currentText.textContent = `Strona ${state.pagination.currentPage} z ${state.pagination.totalPages}`;
    }
    if (btnPrev) {
        btnPrev.disabled = state.pagination.currentPage <= 1;
    }
    if (btnNext) {
        btnNext.disabled = state.pagination.currentPage >= state.pagination.totalPages;
    }
}

function handleQuickAddSubmit(e) {
    e.preventDefault();

    const inputName = document.getElementById("quickInputName");
    const selectType = document.getElementById("quickSelectType");
    const inputAmount = document.getElementById("quickInputAmount");
    const checkSavings = document.getElementById("quickCheckSavings");
    const inputSavingsAmount = document.getElementById("quickInputSavingsAmount");

    const name = inputName.value.trim();
    if (!name) return;

    let baseAmount = Math.abs(parseFloat(inputAmount.value) || 0);
    if (baseAmount === 0) return;

    const finalAmount = state.quickKind === "expense" ? -baseAmount : baseAmount;

    let savings = 0;
    if (checkSavings && checkSavings.checked) {
        savings = Math.abs(parseFloat(inputSavingsAmount.value) || 0);
    }

    const type = selectType.value || "Codzienny";

    const maxId = state.transactions.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
    const newId = maxId + 1;

    const todayStr = new Date().toISOString().split("T")[0];

    const newRecord = {
        id: newId,
        name: name,
        type: type,
        amount: finalAmount,
        savings: savings,
        date: todayStr
    };

    // Optimistic UI: natychmiastowe wstawienie na początek widoku
    state.transactions.unshift(newRecord);
    saveTransactionsToCache();
    renderTransactionsTable();

    // Czyszczenie pól formularza
    inputName.value = "";
    inputAmount.value = "";
    if (checkSavings) checkSavings.checked = false;
    if (inputSavingsAmount) {
        inputSavingsAmount.value = "";
        inputSavingsAmount.style.display = "none";
    }
    inputName.focus();

    // Synchronizacja w tle
    enqueueSyncTask({
        type: "addTransaction",
        data: newRecord
    });
}

function handleDeleteTransaction(id) {
    const idNum = Number(id);

    // Optimistic UI: natychmiastowe usunięcie
    state.transactions = state.transactions.filter(t => Number(t.id) !== idNum);
    saveTransactionsToCache();
    renderTransactionsTable();

    enqueueSyncTask({
        type: "deleteTransaction",
        id: idNum
    });
}

async function fetchTransactionsFromBackend(showSkeleton = false) {
    const skeleton = document.getElementById("tableSkeleton");
    const table = document.getElementById("transactionsTable");

    if (showSkeleton) {
        if (skeleton) skeleton.style.display = "flex";
        if (table) table.style.display = "none";
    }

    try {
        const res = await callBackendJsonp({
            action: "getTransactions",
            pass: state.adminPassword
        });

        if (res && res.status === "success" && Array.isArray(res.data)) {
            state.transactions = res.data;
            saveTransactionsToCache();
            renderTransactionsTable();
        }
    } catch (err) {
        console.warn("Brak połączenia z chmurą Google Sheets, działanie w trybie lokalnym offline.", err);
    } finally {
        if (showSkeleton) {
            if (skeleton) skeleton.style.display = "none";
            if (table) table.style.display = "table";
        }
    }
}
