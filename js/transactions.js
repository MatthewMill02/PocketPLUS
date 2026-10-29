/**
 * PocketPLUS - Widok pulpitu, 2-kolumnowy układ, obliczanie statystyk KPI,
 * formatowanie daty (DD.MM.YYYY), modal edycji wpisu oraz modal ustawień typów.
 */

function openDashboardScreen(dbId = "transactions") {
    state.currentDb = dbId;
    state.currentScreen = "dashboard";
    document.body.className = "screen-dashboard";

    const dbConfig = DATABASES[dbId] || DATABASES.transactions;

    // Resetowanie motywu tła i nałożenie właściwego (fioletowy dla Marco, czerwony dla Manhattan)
    document.body.classList.remove("theme-debts", "theme-subscriptions");
    if (dbConfig.themeClass) {
        document.body.classList.add(dbConfig.themeClass);
    }

    // Aktualizacja awatara i nazwy w pasku górnym
    const navAvatar = document.getElementById("navProfileAvatar");
    const navName = document.getElementById("navProfileName");
    if (navAvatar) {
        navAvatar.className = "mini-avatar " + (dbConfig.avatarClass || "");
        navAvatar.src = dbConfig.avatar;
    }
    if (navName) {
        navName.textContent = dbConfig.name;
    }

    const appHeader = document.getElementById("appHeader");
    const welcomeScreen = document.getElementById("welcomeScreen");
    const dashboardScreen = document.getElementById("dashboardScreen");

    if (welcomeScreen) welcomeScreen.style.display = "none";
    if (appHeader) appHeader.style.display = "flex";
    if (dashboardScreen) dashboardScreen.style.display = "block";

    // Konfiguracja pól formularza pod wybraną bazę
    configureQuickAddFormForDb(dbId);

    // Aktualizacja stanu 3 przycisków podstron na górze
    document.querySelectorAll(".btn-subpage").forEach(btn => {
        if (btn.getAttribute("data-db") === dbId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Listy typów oraz podpowiedzi osób
    populateTypeDropdowns();
    populatePersonDatalist();

    // Reset paginacji i renderowanie
    state.pagination.currentPage = 1;
    renderTransactionsTable();
    updateDashboardStats();

    // Pobranie danych ze skryptu w chmurze jeśli użytkownik jest uwierzytelniony
    if (state.isAdmin) {
        fetchTransactionsFromBackend(false);
    }
}

function getCurrentDbList() {
    if (state.currentDb === "debts") return state.debts;
    if (state.currentDb === "subscriptions") return state.subscriptions;
    return state.transactions;
}

function setCurrentDbList(list) {
    if (state.currentDb === "debts") state.debts = list;
    else if (state.currentDb === "subscriptions") state.subscriptions = list;
    else state.transactions = list;
}

// Formatowanie daty do czytelnego formatu DD.MM.YYYY
function formatDateDisplay(rawDate) {
    if (!rawDate) return "";
    // Jeśli format to YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const parts = rawDate.split("-");
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }
    return rawDate;
}

// Konfiguracja formularza dodawania pod bazę
function configureQuickAddFormForDb(dbId) {
    const fieldPerson = document.getElementById("fieldQuickPerson");
    const fieldType = document.getElementById("fieldQuickType");
    const fieldKind = document.getElementById("fieldQuickKind");
    const fieldSavings = document.getElementById("fieldQuickSavings");
    const labelQuickName = document.getElementById("labelQuickName");
    const labelQuickAmount = document.getElementById("labelQuickAmount");
    const labelQuickKind = document.getElementById("labelQuickKind");
    const btnKindExpense = document.getElementById("btnKindExpense");
    const btnKindIncome = document.getElementById("btnKindIncome");
    const filterTypeWrapper = document.getElementById("filterTypeWrapper");

    const fieldLoanDate = document.getElementById("fieldQuickLoanDate");
    const fieldRepayDate = document.getElementById("fieldQuickRepayDate");

    if (dbId === "debts") {
        if (fieldPerson) fieldPerson.style.display = "flex";
        if (fieldLoanDate) fieldLoanDate.style.display = "flex";
        if (fieldRepayDate) fieldRepayDate.style.display = "flex";
        if (fieldType) fieldType.style.display = "none";
        if (fieldSavings) fieldSavings.style.display = "none";
        if (fieldKind) fieldKind.style.display = "flex";
        if (filterTypeWrapper) filterTypeWrapper.style.display = "none";

        if (labelQuickName) labelQuickName.textContent = "Za co / Tytuł *";
        if (labelQuickAmount) labelQuickAmount.textContent = "Kwota długu (zł) *";
        if (labelQuickKind) labelQuickKind.textContent = "Rodzaj długu";

        if (btnKindExpense) {
            btnKindExpense.textContent = "Dług u mnie";
            btnKindExpense.className = "btn-flow active flow-expense";
        }
        if (btnKindIncome) {
            btnKindIncome.textContent = "Dług u osoby";
            btnKindIncome.className = "btn-flow flow-income";
        }
        state.quickKind = "expense";
    } else if (dbId === "subscriptions") {
        if (fieldPerson) fieldPerson.style.display = "none";
        if (fieldLoanDate) fieldLoanDate.style.display = "none";
        if (fieldRepayDate) fieldRepayDate.style.display = "none";
        if (fieldType) fieldType.style.display = "flex";
        if (fieldSavings) fieldSavings.style.display = "none";
        if (fieldKind) fieldKind.style.display = "none";
        if (filterTypeWrapper) filterTypeWrapper.style.display = "flex";

        if (labelQuickName) labelQuickName.textContent = "Nazwa usługi *";
        if (labelQuickAmount) labelQuickAmount.textContent = "Koszt cykliczny (zł) *";
        state.quickKind = "expense";
    } else {
        if (fieldPerson) fieldPerson.style.display = "none";
        if (fieldLoanDate) fieldLoanDate.style.display = "none";
        if (fieldRepayDate) fieldRepayDate.style.display = "none";
        if (fieldType) fieldType.style.display = "flex";
        if (fieldSavings) fieldSavings.style.display = "flex";
        if (fieldKind) fieldKind.style.display = "flex";
        if (filterTypeWrapper) filterTypeWrapper.style.display = "flex";

        if (labelQuickName) labelQuickName.textContent = "Nazwa transakcji *";
        if (labelQuickAmount) labelQuickAmount.textContent = "Koszt (zł) *";
        if (labelQuickKind) labelQuickKind.textContent = "Charakter";

        if (btnKindExpense) {
            btnKindExpense.textContent = "Wydatek (-)";
            btnKindExpense.className = "btn-flow active flow-expense";
        }
        if (btnKindIncome) {
            btnKindIncome.textContent = "Zysk (+)";
            btnKindIncome.className = "btn-flow flow-income";
        }
        state.quickKind = "expense";
    }
}

function populatePersonDatalist() {
    const datalist = document.getElementById("debtsPersonsDatalist");
    if (!datalist) return;

    datalist.innerHTML = "";
    const uniquePersons = new Set();
    state.debts.forEach(d => {
        if (d.person && d.person.trim()) {
            uniquePersons.add(d.person.trim());
        }
    });

    Array.from(uniquePersons).sort().forEach(personName => {
        const opt = document.createElement("option");
        opt.value = personName;
        datalist.appendChild(opt);
    });
}

function populateTypeDropdowns() {
    const filterTypeSelect = document.getElementById("filterTypeSelect");
    const quickSelectType = document.getElementById("quickSelectType");
    const editEntryType = document.getElementById("editEntryType");

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

    [quickSelectType, editEntryType].forEach(sel => {
        if (sel) {
            sel.innerHTML = "";
            state.types.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t;
                opt.textContent = t;
                sel.appendChild(opt);
            });
        }
    });
}

// Inicjalizacja danych z test_data/ lub chmury
async function checkInitialData() {
    if (state.isAdmin) {
        const cachedTrans = localStorage.getItem(CACHE_KEYS.TRANSACTIONS_REAL);
        if (cachedTrans) { try { state.transactions = JSON.parse(cachedTrans); } catch (e) {} }
        const cachedDebts = localStorage.getItem(CACHE_KEYS.DEBTS_REAL);
        if (cachedDebts) { try { state.debts = JSON.parse(cachedDebts); } catch (e) {} }
        const cachedSubs = localStorage.getItem(CACHE_KEYS.SUBSCRIPTIONS_REAL);
        if (cachedSubs) { try { state.subscriptions = JSON.parse(cachedSubs); } catch (e) {} }
    } else {
        await reloadFakeData();
    }
}

async function reloadFakeData() {
    await loadCsvForDb("transactions");
    await loadCsvForDb("debts");
    await loadCsvForDb("subscriptions");
}

async function loadCsvForDb(dbId) {
    const dbConfig = DATABASES[dbId];
    if (!dbConfig) return;

    try {
        const res = await fetch(dbConfig.csvFile);
        if (!res.ok) throw new Error("Błąd odczytu CSV " + dbConfig.csvFile);
        const csvText = await res.text();

        if (dbId === "transactions") {
            state.transactions = parseCsvTransactions(csvText);
        } else if (dbId === "debts") {
            state.debts = parseCsvDebts(csvText);
        } else if (dbId === "subscriptions") {
            state.subscriptions = parseCsvSubscriptions(csvText);
        }
    } catch (err) {
        console.warn("Błąd ładowania pliku CSV dla " + dbId, err);
    }
}

function parseCsvTransactions(csv) {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];

    const items = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
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

function parseCsvDebts(csv) {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];

    const items = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
        if (parts.length >= 6) {
            items.push({
                id: parseInt(parts[0], 10) || i,
                person: parts[1].trim(),
                name: parts[2].trim(),
                debt_type: parts[3].trim(),
                amount: parseFloat(parts[4]) || 0,
                loan_date: parts[5].trim(),
                repayment_date: parts[6] ? parts[6].trim() : "",
                update: parts[7] ? parts[7].trim() : (parts[5] ? parts[5].trim() : "")
            });
        }
    }
    return items;
}

function parseCsvSubscriptions(csv) {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];

    const items = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
        if (parts.length >= 7) {
            items.push({
                id: parseInt(parts[0], 10) || i,
                name: parts[1].trim(),
                type: parts[2].trim(),
                amount: parseFloat(parts[3]) || 0,
                savings: parseFloat(parts[4]) || 0,
                first_payment: parts[5].trim(),
                last_payment: parts[6].trim()
            });
        }
    }
    return items;
}

// OBLICZANIE I AKTUALIZACJA STATYSTYK W LEWEJ KOLUMNIE
function updateDashboardStats() {
    const balanceElem = document.getElementById("statAccountBalance");
    const bufferElem = document.getElementById("statFinancialBuffer");
    const scopeBadge = document.getElementById("statsScopeBadge");

    const monthLabel0 = document.getElementById("statMonthLabel0");
    const monthVal0 = document.getElementById("statMonthVal0");
    const monthLabel1 = document.getElementById("statMonthLabel1");
    const monthVal1 = document.getElementById("statMonthVal1");
    const monthLabel2 = document.getElementById("statMonthLabel2");
    const monthVal2 = document.getElementById("statMonthVal2");

    if (!balanceElem || !bufferElem) return;

    if (scopeBadge) {
        scopeBadge.textContent = state.currentDb === "debts" ? "Długi" : (state.currentDb === "subscriptions" ? "Subskrypcje" : "Transakcje");
    }

    const statsDivider = document.getElementById("statsDivider");
    const statsMonthsBlock = document.getElementById("statsMonthsBlock");

    if (state.currentDb === "debts") {
        // Dla długów:
        // W bocznej kolumnie mają być 2 kategorie:
        // 1. Osoby dłużne u mnie (debt_type === "Dług u mnie" i brak repayment_date)
        // 2. Te u których dłużny jestem ja (debt_type === "Dług u osoby" i brak repayment_date)
        let unpaidToMe = 0;
        let unpaidToOthers = 0;

        state.debts.forEach(d => {
            const isRepaid = d.repayment_date && String(d.repayment_date).trim() !== "" && String(d.repayment_date).trim() !== "-";
            if (!isRepaid) {
                const amt = parseFloat(d.amount) || 0;
                if (d.debt_type === "Dług u mnie") {
                    unpaidToMe += amt;
                } else {
                    unpaidToOthers += amt;
                }
            }
        });

        // 1. blok: Osoby dłużne u mnie
        balanceElem.textContent = unpaidToMe.toFixed(2) + " zł";
        balanceElem.className = "stats-kpi-val positive";
        const label1 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(2) .stats-kpi-label");
        if (label1) label1.textContent = "Dłużni u mnie (niespłacone)";

        // 2. blok: U których dłużny jestem ja
        bufferElem.textContent = unpaidToOthers.toFixed(2) + " zł";
        bufferElem.className = "stats-kpi-val negative";
        const label2 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(3) .stats-kpi-label");
        if (label2) label2.textContent = "Moje długi (niespłacone)";

        // Ukrywamy miesiące, ponieważ dotyczą transakcji
        if (statsDivider) statsDivider.style.display = "none";
        if (statsMonthsBlock) statsMonthsBlock.style.display = "none";
        return;
    }

    // Reset wyświetlania dla transakcji i subskrypcji
    if (statsDivider) statsDivider.style.display = "block";
    if (statsMonthsBlock) statsMonthsBlock.style.display = "flex";

    const label1 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(2) .stats-kpi-label");
    const label2 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(3) .stats-kpi-label");
    if (label1) label1.textContent = "Stan konta";
    if (label2) label2.textContent = "Poduszka finansowa";

    // 1. Stan konta: suma wszystkich transakcji
    let totalBalance = 0;
    // 2. Poduszka finansowa: suma transakcji o typie "Oszczędności" + kwoty z pola savings
    let financialBuffer = 0;

    const list = state.transactions;
    list.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        const sav = parseFloat(t.savings) || 0;

        totalBalance += amt;

        if ((t.type || "").toLowerCase() === "oszczędności") {
            financialBuffer += Math.abs(amt);
        }
        if (sav > 0) {
            financialBuffer += sav;
        }
    });

    balanceElem.textContent = (totalBalance >= 0 ? "+" : "") + totalBalance.toFixed(2) + " zł";
    balanceElem.className = "stats-kpi-val " + (totalBalance >= 0 ? "positive" : "negative");

    bufferElem.textContent = financialBuffer.toFixed(2) + " zł";

    // 3. Stany na 3 kolejne miesiące (bieżący M0, M-1, M-2)
    const now = new Date();
    const monthsData = [
        getMonthlyStats(list, now.getFullYear(), now.getMonth()),
        getMonthlyStats(list, getRelativeYear(now, -1), getRelativeMonth(now, -1)),
        getMonthlyStats(list, getRelativeYear(now, -2), getRelativeMonth(now, -2))
    ];

    if (monthLabel0 && monthVal0) {
        monthLabel0.textContent = monthsData[0].name;
        monthVal0.textContent = (monthsData[0].total >= 0 ? "+" : "") + monthsData[0].total.toFixed(2) + " zł";
        monthVal0.style.color = monthsData[0].total >= 0 ? "#56d364" : "#ff7b72";
    }
    if (monthLabel1 && monthVal1) {
        monthLabel1.textContent = monthsData[1].name;
        monthVal1.textContent = (monthsData[1].total >= 0 ? "+" : "") + monthsData[1].total.toFixed(2) + " zł";
        monthVal1.style.color = monthsData[1].total >= 0 ? "#56d364" : "#ff7b72";
    }
    if (monthLabel2 && monthVal2) {
        monthLabel2.textContent = monthsData[2].name;
        monthVal2.textContent = (monthsData[2].total >= 0 ? "+" : "") + monthsData[2].total.toFixed(2) + " zł";
        monthVal2.style.color = monthsData[2].total >= 0 ? "#56d364" : "#ff7b72";
    }
}

function getRelativeYear(date, offsetMonths) {
    const d = new Date(date.getFullYear(), date.getMonth() + offsetMonths, 1);
    return d.getFullYear();
}

function getRelativeMonth(date, offsetMonths) {
    const d = new Date(date.getFullYear(), date.getMonth() + offsetMonths, 1);
    return d.getMonth();
}

function getMonthlyStats(transactions, year, month) {
    const monthNames = [
        "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
        "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
    ];
    let total = 0;
    transactions.forEach(t => {
        if (!t.date) return;
        const d = new Date(t.date);
        if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month) {
            total += parseFloat(t.amount) || 0;
        }
    });

    return {
        name: `${monthNames[month]} ${year}`,
        total: total
    };
}

function renderTableHeader() {
    const thead = document.getElementById("pocketTableThead");
    if (!thead) return;

    if (state.currentDb === "debts") {
        thead.innerHTML = `
            <tr>
                <th style="width: 50px;">ID</th>
                <th style="width: 130px;">Osoba</th>
                <th>Za co</th>
                <th style="width: 140px;">Typ długu</th>
                <th style="width: 120px; text-align: right;">Kwota</th>
                <th style="width: 110px; text-align: center;">Data</th>
                <th style="width: 110px; text-align: center;">Spłata</th>
                <th style="width: 80px; text-align: center;">Akcje</th>
            </tr>
        `;
    } else if (state.currentDb === "subscriptions") {
        thead.innerHTML = `
            <tr>
                <th style="width: 50px;">ID</th>
                <th>Usługa</th>
                <th style="width: 130px;">Kategoria</th>
                <th style="width: 140px; text-align: right;">Koszt cyklu</th>
                <th style="width: 110px; text-align: center;">Pierwsza opłata</th>
                <th style="width: 110px; text-align: center;">Ostatnia opłata</th>
                <th style="width: 80px; text-align: center;">Akcje</th>
            </tr>
        `;
    } else {
        thead.innerHTML = `
            <tr>
                <th style="width: 60px;">ID</th>
                <th>Nazwa</th>
                <th style="width: 140px;">Typ</th>
                <th style="width: 170px; text-align: right;">Kwota</th>
                <th style="width: 110px; text-align: center;">Data</th>
                <th style="width: 80px; text-align: center;">Akcje</th>
            </tr>
        `;
    }
}

function renderTransactionsTable() {
    renderTableHeader();

    const tbody = document.getElementById("transactionsTbody");
    const emptyMsg = document.getElementById("emptyTableMessage");
    if (!tbody) return;

    let items = [...getCurrentDbList()];

    // Filtr wyszukiwarki
    if (state.filters.search) {
        items = items.filter(t => {
            const nameMatch = (t.name || "").toLowerCase().includes(state.filters.search);
            const personMatch = (t.person || "").toLowerCase().includes(state.filters.search);
            return nameMatch || personMatch;
        });
    }

    // Filtr typu
    if (state.currentDb !== "debts" && state.filters.type && state.filters.type !== "all") {
        items = items.filter(t => t.type === state.filters.type);
    }

    // Sortowanie
    items.sort((a, b) => {
        const dateA = a.date || a.loan_date || a.first_payment || "";
        const dateB = b.date || b.loan_date || b.first_payment || "";
        switch (state.filters.sort) {
            case "date_asc":
                return new Date(dateA) - new Date(dateB);
            case "date_desc":
                return new Date(dateB) - new Date(dateA);
            case "amount_asc":
                return (a.amount || 0) - (b.amount || 0);
            case "amount_desc":
                return (b.amount || 0) - (a.amount || 0);
            case "name_asc":
                return (a.name || "").localeCompare(b.name || "");
            default:
                return (b.id || 0) - (a.id || 0);
        }
    });

    const totalItems = items.length;
    state.pagination.totalPages = Math.max(1, Math.ceil(totalItems / state.pagination.itemsPerPage));
    if (state.pagination.currentPage > state.pagination.totalPages) {
        state.pagination.currentPage = state.pagination.totalPages;
    }

    const startIdx = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const pageItems = items.slice(startIdx, startIdx + state.pagination.itemsPerPage);

    tbody.innerHTML = "";

    if (pageItems.length === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
    } else {
        if (emptyMsg) emptyMsg.style.display = "none";

        pageItems.forEach(t => {
            const tr = document.createElement("tr");

            if (state.currentDb === "debts") {
                const isToMe = t.debt_type === "Dług u mnie";
                const rowClass = isToMe ? "row-income" : "row-expense";
                const amountClass = isToMe ? "amount-income" : "amount-expense";
                const repaymentText = t.repayment_date ? formatDateDisplay(t.repayment_date) : "<span style='color:var(--color-text-muted);'>Niespłacony</span>";

                tr.className = rowClass;
                tr.innerHTML = `
                    <td>${t.id}</td>
                    <td style="font-weight: 600;">${escapeHtml(t.person || "")}</td>
                    <td>${escapeHtml(t.name || "")}</td>
                    <td><span class="type-badge">${escapeHtml(t.debt_type || "")}</span></td>
                    <td style="text-align: right;" class="amount-cell ${amountClass}">${Number(t.amount || 0).toFixed(2)} zł</td>
                    <td style="text-align: center; color: var(--color-text-muted); font-size: 14px;">${formatDateDisplay(t.loan_date)}</td>
                    <td style="text-align: center; font-size: 14px;">${repaymentText}</td>
                    <td style="text-align: center;">
                        <button type="button" class="btn-row-action" title="Szczegóły / Edytuj" data-id="${t.id}">Edytuj</button>
                    </td>
                `;
            } else if (state.currentDb === "subscriptions") {
                tr.className = "row-expense";
                tr.innerHTML = `
                    <td>${t.id}</td>
                    <td style="font-weight: 600;">${escapeHtml(t.name || "")}</td>
                    <td><span class="type-badge">${escapeHtml(t.type || "Codzienny")}</span></td>
                    <td style="text-align: right;" class="amount-cell amount-expense">-${Math.abs(Number(t.amount || 0)).toFixed(2)} zł</td>
                    <td style="text-align: center; color: var(--color-text-muted); font-size: 14px;">${formatDateDisplay(t.first_payment)}</td>
                    <td style="text-align: center; color: var(--color-text-muted); font-size: 14px;">${formatDateDisplay(t.last_payment)}</td>
                    <td style="text-align: center;">
                        <button type="button" class="btn-row-action" title="Szczegóły / Edytuj" data-id="${t.id}">Edytuj</button>
                    </td>
                `;
            } else {
                // TRANSACTIONS:
                const isSavingsType = (t.type || "").toLowerCase() === "oszczędności";
                const isIncome = t.amount >= 0;
                
                let rowClass = isIncome ? "row-income" : "row-expense";
                if (isSavingsType) rowClass = "row-savings";

                // Formatowanie kwoty:
                // Gdy konto oszczędnościowe -> kwota niebieska
                // Gdy zaznaczone oszczędności (reszta groszy) -> -12.30 zł na czerwono oraz -80gr na niebiesko
                let amountHtml = "";
                const baseAmount = Number(t.amount || 0);
                const sav = Number(t.savings || 0);

                if (isSavingsType) {
                    amountHtml = `<span class="amount-cell amount-savings-blue">${baseAmount.toFixed(2)} zł</span>`;
                } else if (!isIncome && sav > 0) {
                    const groszeStr = Math.round(sav * 100) + "gr";
                    amountHtml = `
                        <span class="amount-cell amount-expense">${baseAmount.toFixed(2)} zł</span>
                        <span class="amount-savings-blue" style="margin-left: 6px; font-size: 14px; font-weight: bold;">-${groszeStr}</span>
                    `;
                } else {
                    const sign = isIncome ? "+" : "";
                    const amountClass = isIncome ? "amount-income" : "amount-expense";
                    amountHtml = `<span class="amount-cell ${amountClass}">${sign}${baseAmount.toFixed(2)} zł</span>`;
                }

                tr.className = rowClass;
                tr.innerHTML = `
                    <td>${t.id}</td>
                    <td style="font-weight: 500;">${escapeHtml(t.name)}</td>
                    <td><span class="type-badge">${escapeHtml(t.type || "Codzienny")}</span></td>
                    <td style="text-align: right;">${amountHtml}</td>
                    <td style="text-align: center; color: var(--color-text-muted); font-size: 14px;">${formatDateDisplay(t.date)}</td>
                    <td style="text-align: center;">
                        <button type="button" class="btn-row-action" title="Szczegóły / Edytuj" data-id="${t.id}">Edytuj</button>
                    </td>
                `;
            }

            const btnAction = tr.querySelector(".btn-row-action");
            if (btnAction) {
                btnAction.addEventListener("click", () => openEntryEditModal(t.id));
            }

            tbody.appendChild(tr);
        });
    }

    updatePaginationControls();
    updateDashboardStats();
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

// SZYBKIE DODAWANIE TRANSAKCJI
function handleQuickAddSubmit(e) {
    e.preventDefault();

    const inputName = document.getElementById("quickInputName");
    const inputPerson = document.getElementById("quickInputPerson");
    const selectType = document.getElementById("quickSelectType");
    const inputAmount = document.getElementById("quickInputAmount");
    const checkSavings = document.getElementById("quickCheckSavings");

    const name = inputName.value.trim();
    if (!name) return;

    let baseAmount = Math.abs(parseFloat(inputAmount.value) || 0);
    if (baseAmount === 0) return;

    const list = getCurrentDbList();
    const maxId = list.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
    const newId = maxId + 1;
    const todayStr = new Date().toISOString().split("T")[0];

    let newRecord = null;

    if (state.currentDb === "debts") {
        const person = inputPerson ? inputPerson.value.trim() : "Nieznany";
        const debtType = state.quickKind === "expense" ? "Dług u mnie" : "Dług u osoby";
        const inputLoan = document.getElementById("quickInputLoanDate");
        const inputRepay = document.getElementById("quickInputRepayDate");

        newRecord = {
            id: newId,
            person: person || "Osoba",
            name: name,
            debt_type: debtType,
            amount: baseAmount,
            loan_date: (inputLoan && inputLoan.value) ? inputLoan.value : todayStr,
            repayment_date: (inputRepay && inputRepay.value) ? inputRepay.value : "",
            update: todayStr
        };
    } else if (state.currentDb === "subscriptions") {
        const type = selectType.value || "Codzienny";

        newRecord = {
            id: newId,
            name: name,
            type: type,
            amount: baseAmount,
            savings: 0,
            first_payment: todayStr,
            last_payment: todayStr
        };
    } else {
        const finalAmount = state.quickKind === "expense" ? -baseAmount : baseAmount;
        const type = selectType.value || "Codzienny";

        // MECHANIZM OSZCZĘDNOŚCI:
        // Tyle ile groszy brakuje do pełnej złotówki (np. z 13.20 brakuje 0.80) trafia do oszczędności
        let savingsGrosze = 0;
        if (checkSavings && checkSavings.checked && state.quickKind === "expense") {
            const fractional = baseAmount % 1;
            if (fractional > 0.001) {
                savingsGrosze = Math.round((1 - fractional) * 100) / 100;
            }
        }

        newRecord = {
            id: newId,
            name: name,
            type: type,
            amount: finalAmount,
            savings: savingsGrosze,
            date: todayStr
        };
    }

    // Optimistic UI: natychmiastowe wstawienie na początek widoku
    list.unshift(newRecord);
    saveCurrentDbToCache();
    populatePersonDatalist();
    renderTransactionsTable();

    // Czyszczenie pól
    inputName.value = "";
    inputAmount.value = "";
    if (inputPerson) inputPerson.value = "";
    const inputLoan = document.getElementById("quickInputLoanDate");
    const inputRepay = document.getElementById("quickInputRepayDate");
    if (inputLoan) inputLoan.value = "";
    if (inputRepay) inputRepay.value = "";
    if (checkSavings) checkSavings.checked = false;
    inputName.focus();

    // Synchronizacja w tle
    enqueueSyncTask({
        type: "add" + capitalize(state.currentDb),
        db: state.currentDb,
        data: newRecord
    });
}

// MODAL SZCZEGÓŁÓW / EDYCJI / NOWEGO WPISU (NA TELEFONIE I DESKTOPIE)
function openEntryEditModal(id = null) {
    const list = getCurrentDbList();
    const isNew = (id === null || id === undefined || id === "");
    const entry = isNew ? null : list.find(t => Number(t.id) === Number(id));

    const modal = document.getElementById("entryEditModal");
    const modalTitle = document.getElementById("entryEditModalTitle");
    const editEntryId = document.getElementById("editEntryId");
    const editEntryName = document.getElementById("editEntryName");
    const editEntryPerson = document.getElementById("editEntryPerson");
    const editEntryType = document.getElementById("editEntryType");
    const editEntryDebtType = document.getElementById("editEntryDebtType");
    const editEntryAmount = document.getElementById("editEntryAmount");
    const editEntrySavings = document.getElementById("editEntrySavings");
    const editEntryDate = document.getElementById("editEntryDate");
    const editEntryRepaymentDate = document.getElementById("editEntryRepaymentDate");
    const btnDelete = document.getElementById("btnDeleteCurrentEntry");
    const btnSave = document.getElementById("btnSaveEntryChanges");

    const groupPerson = document.getElementById("groupEditPerson");
    const groupType = document.getElementById("groupEditType");
    const groupDebtType = document.getElementById("groupEditDebtType");
    const groupSavings = document.getElementById("groupEditSavings");
    const groupRepaymentDate = document.getElementById("groupEditRepaymentDate");

    const todayStr = new Date().toISOString().split("T")[0];

    if (isNew) {
        if (modalTitle) modalTitle.textContent = "Dodaj nowy wpis";
        if (btnSave) btnSave.textContent = "Dodaj wpis";
        if (btnDelete) btnDelete.style.display = "none";

        if (editEntryId) editEntryId.value = "";
        if (editEntryName) editEntryName.value = "";
        if (editEntryPerson) editEntryPerson.value = "";
        if (editEntryAmount) editEntryAmount.value = "";
        if (editEntrySavings) editEntrySavings.value = "0";
        if (editEntryDate) editEntryDate.value = todayStr;
        if (editEntryRepaymentDate) editEntryRepaymentDate.value = "";
    } else {
        if (modalTitle) modalTitle.textContent = "Szczegóły / Edycja wpisu";
        if (btnSave) btnSave.textContent = "Zapisz zmiany";
        if (btnDelete) btnDelete.style.display = "inline-block";

        if (editEntryId) editEntryId.value = entry.id;
        if (editEntryName) editEntryName.value = entry.name || "";
        if (editEntryAmount) editEntryAmount.value = entry.amount !== undefined ? entry.amount : 0;
        if (editEntrySavings) editEntrySavings.value = entry.savings || 0;
        if (editEntryDate) editEntryDate.value = entry.date || entry.loan_date || entry.first_payment || todayStr;
    }

    if (state.currentDb === "debts") {
        if (groupPerson) groupPerson.style.display = "block";
        if (editEntryPerson && !isNew) editEntryPerson.value = entry.person || "";
        if (groupDebtType) groupDebtType.style.display = "block";
        if (editEntryDebtType && !isNew) editEntryDebtType.value = entry.debt_type || "Dług u mnie";
        if (groupRepaymentDate) groupRepaymentDate.style.display = "block";
        if (editEntryRepaymentDate && !isNew) editEntryRepaymentDate.value = entry.repayment_date || "";

        if (groupType) groupType.style.display = "none";
        if (groupSavings) groupSavings.style.display = "none";
    } else {
        if (groupPerson) groupPerson.style.display = "none";
        if (groupDebtType) groupDebtType.style.display = "none";
        if (groupRepaymentDate) groupRepaymentDate.style.display = "none";

        if (groupType) groupType.style.display = "block";
        if (editEntryType && !isNew) editEntryType.value = entry.type || "Codzienny";

        if (groupSavings) groupSavings.style.display = (state.currentDb === "transactions") ? "block" : "none";
    }

    if (modal) modal.style.display = "flex";
    if (editEntryName) editEntryName.focus();
}

function handleEntryEditSubmit(e) {
    e.preventDefault();

    const idVal = document.getElementById("editEntryId").value;
    const isNew = !idVal;
    const list = getCurrentDbList();

    const name = document.getElementById("editEntryName").value.trim();
    const amount = parseFloat(document.getElementById("editEntryAmount").value) || 0;
    const todayStr = new Date().toISOString().split("T")[0];

    if (isNew) {
        const newId = list.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0) + 1;
        let newRecord = null;

        if (state.currentDb === "debts") {
            newRecord = {
                id: newId,
                person: document.getElementById("editEntryPerson").value.trim(),
                name: name,
                debt_type: document.getElementById("editEntryDebtType").value,
                amount: amount,
                loan_date: document.getElementById("editEntryDate").value || todayStr,
                repayment_date: document.getElementById("editEntryRepaymentDate").value || "",
                update: todayStr
            };
        } else if (state.currentDb === "subscriptions") {
            newRecord = {
                id: newId,
                name: name,
                type: document.getElementById("editEntryType").value,
                amount: -Math.abs(amount),
                savings: parseFloat(document.getElementById("editEntrySavings").value) || 0,
                first_payment: document.getElementById("editEntryDate").value || todayStr,
                last_payment: todayStr
            };
        } else {
            newRecord = {
                id: newId,
                name: name,
                type: document.getElementById("editEntryType").value,
                amount: amount,
                savings: parseFloat(document.getElementById("editEntrySavings").value) || 0,
                date: document.getElementById("editEntryDate").value || todayStr
            };
        }

        list.unshift(newRecord);
        saveCurrentDbToCache();
        renderTransactionsTable();
        closeModal("entryEditModal");

        enqueueSyncTask({
            type: "add" + capitalize(state.currentDb),
            db: state.currentDb,
            data: newRecord
        });
        return;
    }

    const id = Number(idVal);
    const entry = list.find(t => Number(t.id) === id);
    if (!entry) return;

    entry.name = name;
    entry.amount = amount;

    if (state.currentDb === "debts") {
        entry.person = document.getElementById("editEntryPerson").value.trim();
        entry.debt_type = document.getElementById("editEntryDebtType").value;
        entry.loan_date = document.getElementById("editEntryDate").value;
        entry.repayment_date = document.getElementById("editEntryRepaymentDate").value;
        entry.update = todayStr;
    } else if (state.currentDb === "subscriptions") {
        entry.type = document.getElementById("editEntryType").value;
        entry.first_payment = document.getElementById("editEntryDate").value;
        entry.savings = parseFloat(document.getElementById("editEntrySavings").value) || 0;
    } else {
        entry.type = document.getElementById("editEntryType").value;
        entry.date = document.getElementById("editEntryDate").value;
        entry.savings = parseFloat(document.getElementById("editEntrySavings").value) || 0;
    }

    saveCurrentDbToCache();
    renderTransactionsTable();
    closeModal("entryEditModal");

    enqueueSyncTask({
        type: "edit" + capitalize(state.currentDb.slice(0, -1)),
        db: state.currentDb,
        id: id,
        data: entry
    });
}

function handleDeleteFromEditModal() {
    const id = Number(document.getElementById("editEntryId").value);
    if (!id) return;

    let list = getCurrentDbList();
    setCurrentDbList(list.filter(t => Number(t.id) !== id));
    saveCurrentDbToCache();
    renderTransactionsTable();
    closeModal("entryEditModal");

    enqueueSyncTask({
        type: "delete" + capitalize(state.currentDb),
        db: state.currentDb,
        id: id
    });
}

// ZARZĄDZANIE TYPAMI (MODAL USTAWIENIA)
function openSettingsModal() {
    renderTypesManagementList();
    openModal("settingsModal");
}

function renderTypesManagementList() {
    const container = document.getElementById("typesManagementList");
    if (!container) return;

    container.innerHTML = "";
    state.types.forEach(type => {
        const row = document.createElement("div");
        row.className = "type-list-row";
        row.innerHTML = `
            <span>${escapeHtml(type)}</span>
            <button type="button" class="btn-type-delete" data-type="${escapeHtml(type)}">[Usuń]</button>
        `;

        row.querySelector(".btn-type-delete").addEventListener("click", () => handleDeleteType(type));
        container.appendChild(row);
    });
}

function handleAddType() {
    const input = document.getElementById("newTypeNameInput");
    const errorBox = document.getElementById("newTypeError");
    const val = input ? input.value.trim() : "";

    if (!val) return;

    if (state.types.includes(val)) {
        if (errorBox) {
            errorBox.textContent = "Taki typ już istnieje.";
            errorBox.style.display = "block";
        }
        return;
    }

    if (errorBox) errorBox.style.display = "none";
    state.types.push(val);
    populateTypeDropdowns();
    renderTypesManagementList();
    if (input) input.value = "";

    // Synchronizacja ze skryptem
    enqueueSyncTask({
        type: "addType",
        name: val
    });
}

function handleDeleteType(typeName) {
    state.types = state.types.filter(t => t !== typeName);
    populateTypeDropdowns();
    renderTypesManagementList();

    enqueueSyncTask({
        type: "deleteType",
        name: typeName
    });
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchTransactionsFromBackend(showSkeleton = false) {
    const skeleton = document.getElementById("tableSkeleton");
    const table = document.getElementById("transactionsTable");

    if (showSkeleton) {
        if (skeleton) skeleton.style.display = "flex";
        if (table) table.style.display = "none";
    }

    const actionMap = {
        transactions: "getTransactions",
        debts: "getDebts",
        subscriptions: "getSubscriptions"
    };

    try {
        const res = await callBackendJsonp({
            action: actionMap[state.currentDb] || "getTransactions",
            pass: state.adminPassword
        });

        if (res && res.status === "success" && Array.isArray(res.data)) {
            setCurrentDbList(res.data);
            saveCurrentDbToCache();
            renderTransactionsTable();
        }

        // Pobranie typów przy okazji
        const typesRes = await callBackendJsonp({
            action: "getTypes",
            pass: state.adminPassword
        });
        if (typesRes && typesRes.status === "success" && Array.isArray(typesRes.data)) {
            state.types = typesRes.data;
            populateTypeDropdowns();
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
