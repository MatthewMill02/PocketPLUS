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

    // Reset licznika dynamicznego ładowania i renderowanie
    state.infiniteScroll.renderedCount = state.infiniteScroll.batchSize;
    state.infiniteScroll.allLoaded = false;
    state.infiniteScroll.isLoadingMore = false;
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

// Konwersja daty do formatu akceptowanego przez <input type="date"> (YYYY-MM-DD)
function formatDateToInput(rawDate) {
    if (!rawDate) return "";
    const str = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    // Jeśli format to DD.MM.YYYY
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
        const parts = str.split(".");
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }
    // Próba przez obiekt Date
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    return "";
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

        if (labelQuickName) labelQuickName.textContent = "Nazwa *";
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

        if (labelQuickName) labelQuickName.textContent = "Nazwa *";
        if (labelQuickAmount) labelQuickAmount.textContent = "Koszt *";
        state.quickKind = "expense";
    } else {
        if (fieldPerson) fieldPerson.style.display = "none";
        if (fieldLoanDate) fieldLoanDate.style.display = "none";
        if (fieldRepayDate) fieldRepayDate.style.display = "none";
        if (fieldType) fieldType.style.display = "flex";
        if (fieldSavings) fieldSavings.style.display = "flex";
        if (fieldKind) fieldKind.style.display = "flex";
        if (filterTypeWrapper) filterTypeWrapper.style.display = "flex";

        if (labelQuickName) labelQuickName.textContent = "Nazwa *";
        if (labelQuickAmount) labelQuickAmount.textContent = "Kwota *";
        const labelQuickSavings = document.getElementById("labelQuickSavings");
        if (labelQuickSavings) labelQuickSavings.textContent = "Skarbonka";
        if (labelQuickKind) labelQuickKind.textContent = "Rodzaj transakcji";

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

    if (!balanceElem || !bufferElem) return;

    if (scopeBadge) {
        scopeBadge.textContent = state.currentDb === "debts" ? "Długi" : (state.currentDb === "subscriptions" ? "Subskrypcje" : "Transakcje");
    }

    const statsDivider = document.getElementById("statsDivider");
    const statsMonthsBlock = document.getElementById("statsMonthsBlock");
    const kpiBlock1 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(2)");
    if (kpiBlock1) kpiBlock1.style.display = "flex";

    if (state.currentDb === "debts") {
        // Dla długów:
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

        if (statsDivider) statsDivider.style.display = "block";
        if (statsMonthsBlock) {
            statsMonthsBlock.style.display = "flex";
            statsMonthsBlock.innerHTML = "";

            // Agregacja osób z niepozamykanymi sprawami
            const personsToMe = {};
            const personsToOthers = {};

            state.debts.forEach(d => {
                const isRepaid = d.repayment_date && String(d.repayment_date).trim() !== "" && String(d.repayment_date).trim() !== "-";
                if (!isRepaid) {
                    const person = (d.person && d.person.trim()) ? d.person.trim() : "Nieokreślona osoba";
                    const amt = parseFloat(d.amount) || 0;
                    if (d.debt_type === "Dług u mnie") {
                        personsToMe[person] = (personsToMe[person] || 0) + amt;
                    } else {
                        personsToOthers[person] = (personsToOthers[person] || 0) + amt;
                    }
                }
            });

            // Kategoria 1: Długi u mnie (ktoś mi wisi)
            const cardToMe = document.createElement("div");
            cardToMe.className = "stats-month-category";
            const personsToMeKeys = Object.keys(personsToMe);
            let subitemsToMeHtml = "";

            if (personsToMeKeys.length === 0) {
                subitemsToMeHtml = `<div class="stats-month-empty">Wszystkie sprawy spłacone</div>`;
            } else {
                personsToMeKeys.sort().forEach(personName => {
                    const amt = personsToMe[personName];
                    subitemsToMeHtml += `
                        <div class="stats-month-subrow">
                            <span class="stats-month-sublabel">${escapeHtml(personName)}</span>
                            <span class="stats-month-subval" style="color: #56d364;">+${amt.toFixed(2)} zł</span>
                        </div>
                    `;
                });
            }

            cardToMe.innerHTML = `
                <div class="stats-month-cat-header">
                    <span class="stats-month-cat-title">Długi u mnie</span>
                    <span class="stats-month-cat-total" style="color: #56d364;">+${unpaidToMe.toFixed(2)} zł</span>
                </div>
                <div class="stats-month-subitems">
                    ${subitemsToMeHtml}
                </div>
            `;
            statsMonthsBlock.appendChild(cardToMe);

            // Kategoria 2: Długi u osoby (ja komuś wiszę)
            const cardToOthers = document.createElement("div");
            cardToOthers.className = "stats-month-category";
            const personsToOthersKeys = Object.keys(personsToOthers);
            let subitemsToOthersHtml = "";

            if (personsToOthersKeys.length === 0) {
                subitemsToOthersHtml = `<div class="stats-month-empty">Wszystkie sprawy spłacone</div>`;
            } else {
                personsToOthersKeys.sort().forEach(personName => {
                    const amt = personsToOthers[personName];
                    subitemsToOthersHtml += `
                        <div class="stats-month-subrow">
                            <span class="stats-month-sublabel">${escapeHtml(personName)}</span>
                            <span class="stats-month-subval" style="color: #ff7b72;">-${amt.toFixed(2)} zł</span>
                        </div>
                    `;
                });
            }

            cardToOthers.innerHTML = `
                <div class="stats-month-cat-header">
                    <span class="stats-month-cat-title">Długi u osoby</span>
                    <span class="stats-month-cat-total" style="color: #ff7b72;">-${unpaidToOthers.toFixed(2)} zł</span>
                </div>
                <div class="stats-month-subitems">
                    ${subitemsToOthersHtml}
                </div>
            `;
            statsMonthsBlock.appendChild(cardToOthers);
        }
        return;
    }

    if (state.currentDb === "subscriptions") {
        // Łączny koszt poniesiony w transakcjach na wszystkie subskrypcje
        let totalSpentOnAllSubs = 0;
        const subOccurrences = {}; // nazwa -> { count, totalSpent }

        state.subscriptions.forEach(s => {
            const subName = (s.name || "").trim().toLowerCase();
            subOccurrences[subName] = {
                displayName: s.name || "Usługa",
                count: 0,
                totalSpent: 0
            };
        });

        // Przeliczenie w bazie transakcji
        state.transactions.forEach(t => {
            const tName = (t.name || "").trim().toLowerCase();
            const tAmt = Math.abs(parseFloat(t.amount) || 0);

            // Sprawdzamy czy transakcja odpowiada którejś z subskrypcji
            Object.keys(subOccurrences).forEach(subKey => {
                if (tName === subKey || tName.includes(subKey) || subKey.includes(tName)) {
                    subOccurrences[subKey].count += 1;
                    subOccurrences[subKey].totalSpent += tAmt;
                    totalSpentOnAllSubs += tAmt;
                }
            });
        });

        const kpiBlock1 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(2)");
        const label2 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(3) .stats-kpi-label");
        
        // Ukrywamy klocek 'Koszty cykliczne' zgodnie z prośbą
        if (kpiBlock1) kpiBlock1.style.display = "none";
        if (label2) label2.textContent = "Łącznie wydane";

        bufferElem.textContent = "-" + totalSpentOnAllSubs.toFixed(2) + " zł";
        bufferElem.className = "stats-kpi-val negative";

        if (statsDivider) statsDivider.style.display = "block";
        if (statsMonthsBlock) {
            statsMonthsBlock.style.display = "flex";
            statsMonthsBlock.innerHTML = "";

            const card = document.createElement("div");
            card.className = "stats-month-category";

            const keys = Object.keys(subOccurrences);
            let subitemsHtml = "";

            if (keys.length === 0) {
                subitemsHtml = `<div class="stats-month-empty">Brak zdefiniowanych usług</div>`;
            } else {
                keys.forEach(k => {
                    const item = subOccurrences[k];
                    subitemsHtml += `
                        <div class="stats-month-subrow" style="flex-direction: column; align-items: flex-start; gap: 2px; padding: 6px 4px; border-bottom: 1px solid rgba(38, 45, 55, 0.3);">
                            <div style="display: flex; justify-content: space-between; width: 100%;">
                                <span class="stats-month-sublabel" style="font-weight: 600; color: var(--color-text-main);">${escapeHtml(item.displayName)}</span>
                                <span class="stats-month-subval" style="color: #ff7b72;">-${item.totalSpent.toFixed(2)} zł</span>
                            </div>
                            <div style="font-size: 12px; color: var(--color-text-muted);">
                                Transakcje: <strong style="color: var(--color-text-main);">${item.count}</strong> ${item.count === 1 ? "raz" : "razy"}
                            </div>
                        </div>
                    `;
                });
            }

            card.innerHTML = `
                <div class="stats-month-cat-header">
                    <span class="stats-month-cat-title">Rozpiska usług</span>
                    <span class="stats-month-cat-total" style="color: #ff7b72;">-${totalSpentOnAllSubs.toFixed(2)} zł</span>
                </div>
                <div class="stats-month-subitems">
                    ${subitemsHtml}
                </div>
            `;
            statsMonthsBlock.appendChild(card);
        }
        return;
    }

    // Reset wyświetlania dla transakcji
    if (statsDivider) statsDivider.style.display = "block";
    if (statsMonthsBlock) statsMonthsBlock.style.display = "flex";

    const label1 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(2) .stats-kpi-label");
    const label2 = document.querySelector("#dashboardStatsSidebar .stats-kpi-block:nth-child(3) .stats-kpi-label");
    if (label1) label1.textContent = "Stan konta";
    if (label2) label2.textContent = "Poduszka finansowa";

    // 1. Stan konta: suma wszystkich transakcji
    let totalBalance = 0;
    // 2. Poduszka finansowa: suma transakcji o typie "Oszczędności"
    let financialBuffer = 0;

    const list = state.transactions;
    list.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        totalBalance += amt;

        if ((t.type || "").toLowerCase() === "oszczędności") {
            financialBuffer += Math.abs(amt);
        }
    });

    balanceElem.textContent = (totalBalance >= 0 ? "+" : "") + totalBalance.toFixed(2) + " zł";
    balanceElem.className = "stats-kpi-val " + (totalBalance >= 0 ? "positive" : "negative");

    bufferElem.textContent = financialBuffer.toFixed(2) + " zł";

    // 3. Stany na 3 kolejne miesiące (bieżący M0, M-1, M-2) - rozwinięte na kategorie
    if (statsMonthsBlock) {
        statsMonthsBlock.innerHTML = "";

        const now = new Date();
        const monthsData = [
            getMonthlyStats(list, now.getFullYear(), now.getMonth()),
            getMonthlyStats(list, getRelativeYear(now, -1), getRelativeMonth(now, -1)),
            getMonthlyStats(list, getRelativeYear(now, -2), getRelativeMonth(now, -2))
        ];

        monthsData.forEach(m => {
            const card = document.createElement("div");
            card.className = "stats-month-category";

            const sign = m.total >= 0 ? "+" : "";
            const totalColor = m.total >= 0 ? "#56d364" : "#ff7b72";

            let subitemsHtml = "";
            const typesKeys = Object.keys(m.byType);

            if (typesKeys.length === 0 && m.piggyBank === 0) {
                subitemsHtml = `<div class="stats-month-empty">Brak transakcji w tym miesiącu</div>`;
            } else {
                typesKeys.forEach(typeName => {
                    const amt = m.byType[typeName];
                    const subSign = amt >= 0 ? "+" : "";
                    const subColor = amt >= 0 ? "#56d364" : "#ff7b72";
                    subitemsHtml += `
                        <div class="stats-month-subrow">
                            <span class="stats-month-sublabel">${escapeHtml(typeName)}</span>
                            <span class="stats-month-subval" style="color: ${subColor};">${subSign}${amt.toFixed(2)} zł</span>
                        </div>
                    `;
                });

                if (m.piggyBank > 0) {
                    subitemsHtml += `
                        <div class="stats-month-subrow" style="border-top: 1px dashed rgba(88, 166, 255, 0.25); padding-top: 4px; margin-top: 2px;">
                            <span class="stats-month-sublabel" style="color: #58a6ff; font-weight: 500;">Skarbonka</span>
                            <span class="stats-month-subval" style="color: #58a6ff;">+${m.piggyBank.toFixed(2)} zł</span>
                        </div>
                    `;
                }
            }

            card.innerHTML = `
                <div class="stats-month-cat-header">
                    <span class="stats-month-cat-title">${escapeHtml(m.name)}</span>
                    <span class="stats-month-cat-total" style="color: ${totalColor};">${sign}${m.total.toFixed(2)} zł</span>
                </div>
                <div class="stats-month-subitems">
                    ${subitemsHtml}
                </div>
            `;

            statsMonthsBlock.appendChild(card);
        });
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
    let piggyBank = 0;
    const byType = {};

    transactions.forEach(t => {
        if (!t.date) return;
        const d = new Date(t.date);
        if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month) {
            const amt = parseFloat(t.amount) || 0;
            const sav = parseFloat(t.savings) || 0;
            total += amt;
            if (sav > 0) {
                piggyBank += sav;
            }

            const typeKey = t.type ? t.type.trim() : "Bez kategorii";
            if (!byType[typeKey]) {
                byType[typeKey] = 0;
            }
            byType[typeKey] += amt;
        }
    });

    return {
        name: `${monthNames[month]} ${year}`,
        total: total,
        piggyBank: piggyBank,
        byType: byType
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
                <th>Nazwa</th>
                <th style="width: 140px;">Typ długu</th>
                <th style="width: 120px; text-align: right;">Kwota</th>
                <th style="width: 110px; text-align: center;">Data</th>
                <th style="width: 110px; text-align: center;">Spłata</th>
                <th style="width: 70px; text-align: center;">Akcje</th>
            </tr>
        `;
    } else if (state.currentDb === "subscriptions") {
        thead.innerHTML = `
            <tr>
                <th style="width: 50px;">ID</th>
                <th>Usługa</th>
                <th style="width: 130px;">Kategoria</th>
                <th style="width: 140px; text-align: right;">Koszt</th>
                <th style="width: 110px; text-align: center;">Pierwsza opłata</th>
                <th style="width: 110px; text-align: center;">Ostatnia opłata</th>
                <th style="width: 70px; text-align: center;">Akcje</th>
            </tr>
        `;
    } else {
        thead.innerHTML = `
            <tr>
                <th style="width: 50px;">ID</th>
                <th>Nazwa</th>
                <th style="width: 130px;">Typ</th>
                <th style="width: 240px; text-align: right;">Kwota</th>
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

    // Sortowanie (przy równej dacie drugorzędnym kryterium jest ID malejące)
    items.sort((a, b) => {
        const dateA = a.date || a.loan_date || a.first_payment || "";
        const dateB = b.date || b.loan_date || b.first_payment || "";
        const idA = Number(a.id) || 0;
        const idB = Number(b.id) || 0;

        switch (state.filters.sort) {
            case "date_asc": {
                const diff = new Date(dateA) - new Date(dateB);
                return diff !== 0 ? diff : (idA - idB);
            }
            case "date_desc": {
                const diff = new Date(dateB) - new Date(dateA);
                return diff !== 0 ? diff : (idB - idA); // Drugorzędne sortowanie po ID malejąco
            }
            case "amount_asc":
                return (a.amount || 0) - (b.amount || 0);
            case "amount_desc":
                return (b.amount || 0) - (a.amount || 0);
            case "name_asc":
                return (a.name || "").localeCompare(b.name || "");
            default:
                return idB - idA;
        }
    });

    const totalItems = items.length;
    const endElem = document.getElementById("tableInfiniteEnd");
    if (state.infiniteScroll.renderedCount >= totalItems) {
        state.infiniteScroll.allLoaded = true;
    } else {
        state.infiniteScroll.allLoaded = false;
    }
    if (endElem) endElem.style.display = "none";

    const pageItems = items.slice(0, state.infiniteScroll.renderedCount);

    tbody.innerHTML = "";

    if (pageItems.length === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
    } else {
        if (emptyMsg) emptyMsg.style.display = "none";

        pageItems.forEach(t => {
            const tr = document.createElement("tr");

            if (state.currentDb === "debts") {
                const isSettled = !!(t.repayment_date && String(t.repayment_date).trim() !== "");
                const isToMe = (t.debt_type || "").trim() === "Dług u mnie"; // ktoś wisi mnie (w drugą stronę -> zysk -> zielony)
                
                let rowClass = "";
                let amountClass = "";
                if (isSettled) {
                    rowClass = "";
                    amountClass = "amount-neutral";
                } else if (isToMe) {
                    // Dług u mnie (ktoś mi wisi) -> zielony
                    rowClass = "row-income";
                    amountClass = "amount-income";
                } else {
                    // Dług u osoby / po mojej stronie (ja komuś wiszę) -> czerwony
                    rowClass = "row-expense";
                    amountClass = "amount-expense";
                }

                const repaymentText = isSettled ? formatDateDisplay(t.repayment_date) : "<span style='color:var(--color-text-muted);'>Niespłacony</span>";

                tr.className = rowClass;
                tr.innerHTML = `
                    <td class="td-id">${t.id}</td>
                    <td class="td-person" style="font-weight: 600;">${escapeHtml(t.person || "")}</td>
                    <td class="td-name" style="font-weight: 500;">${escapeHtml(t.name || "")}</td>
                    <td class="td-type"><span class="type-badge">${escapeHtml(t.debt_type || "")}</span></td>
                    <td class="td-amount" style="text-align: right;"><span class="amount-cell ${amountClass}">${Number(t.amount || 0).toFixed(2)} zł</span></td>
                    <td class="td-date" style="text-align: center; color: var(--color-text-muted); font-size: 14px;">${formatDateDisplay(t.loan_date)}</td>
                    <td class="td-repayment" style="text-align: center; font-size: 14px;">${repaymentText}</td>
                    <td class="td-actions" style="text-align: center; white-space: nowrap;">
                        <div class="row-actions-dropdown">
                            <button type="button" class="btn-row-more" title="Więcej akcji">•••</button>
                            <div class="row-actions-menu" style="display: none;">
                                <button type="button" class="row-action-item action-edit">Edytuj</button>
                                <button type="button" class="row-action-item action-save-trans">Zapisz transakcję</button>
                            </div>
                        </div>
                    </td>
                `;
            } else if (state.currentDb === "subscriptions") {
                tr.className = "row-expense";
                tr.innerHTML = `
                    <td class="td-id">${t.id}</td>
                    <td class="td-name" style="font-weight: 600;">${escapeHtml(t.name || "")}</td>
                    <td class="td-type"><span class="type-badge">${escapeHtml(t.type || "Codzienny")}</span></td>
                    <td class="td-amount" style="text-align: right;" class="amount-cell amount-expense">-${Math.abs(Number(t.amount || 0)).toFixed(2)} zł</td>
                    <td class="td-date" style="text-align: center; color: var(--color-text-muted); font-size: 14px;">${formatDateDisplay(t.last_payment || t.first_payment)}</td>
                    <td class="td-repayment" style="text-align: center; color: var(--color-text-muted); font-size: 14px;">${formatDateDisplay(t.first_payment)}</td>
                    <td class="td-actions" style="text-align: center; white-space: nowrap;">
                        <div class="row-actions-dropdown">
                            <button type="button" class="btn-row-more" title="Więcej akcji">•••</button>
                            <div class="row-actions-menu" style="display: none;">
                                <button type="button" class="row-action-item action-edit">Edytuj</button>
                                <button type="button" class="row-action-item action-save-trans">Zapisz transakcję</button>
                            </div>
                        </div>
                    </td>
                `;
            } else {
                // TRANSACTIONS:
                const isSavingsType = (t.type || "").toLowerCase() === "oszczędności";
                const isIncome = t.amount >= 0;
                
                let rowClass = isIncome ? "row-income" : "row-expense";
                if (isSavingsType) rowClass = "row-savings";

                // Formatowanie kwoty oraz oszczędności
                let amountHtml = "";
                const baseAmount = Number(t.amount || 0);
                const sav = Number(t.savings || 0);

                if (isSavingsType) {
                    // Typ "Oszczędności" - np. wydatek/przelew na oszczędności (-660 zł na czerwono)
                    const absVal = Math.abs(baseAmount);
                    if (baseAmount < 0) {
                        amountHtml = `<span class="amount-cell amount-expense">-${absVal.toFixed(2)} zł</span>`;
                    } else {
                        // Wpłata bezpośrednia na konto oszczędnościowe (+ na niebiesko)
                        amountHtml = `<span class="amount-cell amount-savings-blue">+${absVal.toFixed(2)} zł</span>`;
                    }
                    if (sav > 0) {
                        amountHtml += `<span class="amount-savings-blue" style="margin-left: 6px; font-size: 14px; font-weight: bold;" title="Skarbonka">+${sav.toFixed(2)} zł</span>`;
                    }
                } else if (!isIncome) {
                    // Zwykły wydatek (z ewentualną końcówką do skarbonki)
                    amountHtml = `<span class="amount-cell amount-expense">-${Math.abs(baseAmount).toFixed(2)} zł</span>`;
                    if (sav > 0) {
                        amountHtml += `<span class="amount-savings-blue" style="margin-left: 6px; font-size: 14px; font-weight: bold;" title="Skarbonka">+${sav.toFixed(2)} zł</span>`;
                    }
                } else {
                    // Zwykły przychód (z ewentualną skarbonką)
                    amountHtml = `<span class="amount-cell amount-income">+${baseAmount.toFixed(2)} zł</span>`;
                    if (sav > 0) {
                        amountHtml += `<span class="amount-savings-blue" style="margin-left: 6px; font-size: 14px; font-weight: bold;" title="Skarbonka">+${sav.toFixed(2)} zł</span>`;
                    }
                }

                tr.className = rowClass;
                tr.innerHTML = `
                    <td class="td-id">${t.id}</td>
                    <td class="td-name" style="font-weight: 500;">${escapeHtml(t.name)}</td>
                    <td class="td-type"><span class="type-badge">${escapeHtml(t.type || "Codzienny")}</span></td>
                    <td class="td-amount" style="text-align: right; white-space: nowrap;">${amountHtml}</td>
                    <td class="td-date" style="text-align: center; color: var(--color-text-muted); font-size: 14px;">${formatDateDisplay(t.date)}</td>
                    <td class="td-actions" style="text-align: center;">
                        <div class="row-actions-dropdown">
                            <button type="button" class="btn-row-more" title="Więcej akcji">•••</button>
                            <div class="row-actions-menu" style="display: none;">
                                <button type="button" class="row-action-item action-edit">Edytuj</button>
                            </div>
                        </div>
                    </td>
                `;
            }

            // Obsługa rozwijanego menu 3 kropek
            const btnMore = tr.querySelector(".btn-row-more");
            const menuMore = tr.querySelector(".row-actions-menu");
            if (btnMore && menuMore) {
                btnMore.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const isOpen = menuMore.style.display === "flex";
                    // Zamknij wszystkie inne otwarte menu w tabeli
                    document.querySelectorAll(".row-actions-menu").forEach(m => {
                        m.style.display = "none";
                    });
                    document.querySelectorAll(".btn-row-more").forEach(b => {
                        b.classList.remove("is-active");
                    });
                    if (!isOpen) {
                        menuMore.style.display = "flex";
                        btnMore.classList.add("is-active");
                    }
                });
            }

            const btnEdit = tr.querySelector(".action-edit");
            if (btnEdit) {
                btnEdit.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (menuMore) menuMore.style.display = "none";
                    if (btnMore) btnMore.classList.remove("is-active");
                    openEntryEditModal(t.id);
                });
            }

            const btnSaveTrans = tr.querySelector(".action-save-trans");
            if (btnSaveTrans) {
                btnSaveTrans.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (menuMore) menuMore.style.display = "none";
                    if (btnMore) btnMore.classList.remove("is-active");
                    if (state.currentDb === "debts") {
                        handleConvertDebtToTransaction(t);
                    } else if (state.currentDb === "subscriptions") {
                        handleConvertSubscriptionToTransaction(t);
                    }
                });
            }

            tbody.appendChild(tr);
        });
    }

    updateDashboardStats();
}

/**
 * Dynamiczne doładowanie kolejnej porcji (np. 30 rekordów) przy przewijaniu tabeli.
 * Zawiera pełne zabezpieczenie przed nadmiernym lub nieskończonym wywoływaniem.
 */
function loadMoreTableRecords() {
    if (state.infiniteScroll.allLoaded || state.infiniteScroll.isLoadingMore) {
        return;
    }

    const items = getCurrentDbList();
    const totalItems = items.length;

    if (state.infiniteScroll.renderedCount >= totalItems) {
        state.infiniteScroll.allLoaded = true;
        const endElem = document.getElementById("tableInfiniteEnd");
        if (endElem) endElem.style.display = "none";
        return;
    }

    state.infiniteScroll.isLoadingMore = true;

    // Zwiększenie liczby renderowanych rekordów o batchSize (30)
    state.infiniteScroll.renderedCount += state.infiniteScroll.batchSize;
    renderTransactionsTable();

    // Krótkie opóźnienie przed kolejnym potencjalnym wywołaniem, aby uniknąć pętli
    setTimeout(() => {
        state.infiniteScroll.isLoadingMore = false;
    }, 100);
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
        // Odczyt z pola kwoty oszczędności jeśli checkbox jest zaznaczony
        const inputSavingsAmount = document.getElementById("quickInputSavingsAmount");
        let savingsVal = 0;
        if (checkSavings && checkSavings.checked) {
            if (inputSavingsAmount && inputSavingsAmount.value) {
                savingsVal = Math.abs(parseFloat(inputSavingsAmount.value) || 0);
            } else {
                // Jeśli pole puste, oblicz grosze do pełnej złotówki
                const fractional = baseAmount % 1;
                if (fractional > 0.001) {
                    savingsVal = Math.round((1 - fractional) * 100) / 100;
                }
            }
        }

        newRecord = {
            id: newId,
            name: name,
            type: type,
            amount: finalAmount,
            savings: savingsVal,
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
    const inputSavingsAmount = document.getElementById("quickInputSavingsAmount");
    if (inputLoan) inputLoan.value = "";
    if (inputRepay) inputRepay.value = "";
    if (checkSavings) checkSavings.checked = false;
    if (inputSavingsAmount) {
        inputSavingsAmount.value = "";
        inputSavingsAmount.disabled = true;
    }
    inputName.focus();

    // Synchronizacja w tle
    enqueueSyncTask({
        type: "add" + capitalize(state.currentDb),
        db: state.currentDb,
        data: newRecord
    });
}

/**
 * Specjalna mechanika długów:
 * Po kliknięciu 'Zapisz transakcję' w tabeli długów, przełączamy bazę na transakcje
 * i otwieramy pop-up dodania nowego wpisu z uzupełnionymi danymi:
 * - Nazwa: Osoba - Za co (Typ długu)
 * - Kwota: kwota z długu
 * - Data: data pożyczki
 * - Kategoria (typ): Codzienny
 * - Rodzaj transakcji: Wydatek (-) lub Zysk (+) w zależności od długu
 */
function handleConvertDebtToTransaction(debt) {
    if (!debt) return;

    const person = (debt.person || "").trim();
    const what = (debt.name || "").trim();
    const debtType = (debt.debt_type || "").trim();

    // Łączenie: [Osoba] - [Za co] ([Typ długu])
    let combinedName = "";
    if (person && what) {
        combinedName = `${person} - ${what}`;
    } else {
        combinedName = person || what || "Dług";
    }
    if (debtType) {
        combinedName += ` (${debtType})`;
    }

    const rawAmt = Math.abs(parseFloat(debt.amount) || 0);
    const loanDate = debt.loan_date || new Date().toISOString().split("T")[0];

    // "Dług u mnie" to pożyczenie komuś pieniędzy (wydatek -) lub spłata (zysk +),
    // domyślnie przy pożyczce pieniądze od nas wyszły, więc wydatek:
    const isExpense = debt.debt_type === "Dług u mnie" ? true : false;

    // Przełączamy widok na transakcje
    openDashboardScreen("transactions");

    // Otwieramy pop-up dodania nowego wpisu z prefillem
    openEntryEditModal(null, {
        name: combinedName,
        amount: rawAmt,
        date: loanDate,
        type: "Codzienny",
        isExpense: isExpense
    });
}

/**
 * Specjalna mechanika subskrypcji / stałych kosztów:
 * Po kliknięciu 'Zapisz transakcję' w tabeli subskrypcji, przełączamy bazę na transakcje
 * i otwieramy pop-up dodania nowego wpisu z prefillem (Nazwa usługi, Koszt, Kategoria, dzisiejsza data).
 * Po zapisaniu transakcji aktualizujemy 'last_payment' w subskrypcji na wybraną datę.
 */
let pendingSubscriptionSource = null;

function handleConvertSubscriptionToTransaction(subscription) {
    if (!subscription) return;

    const subName = (subscription.name || "Usługa").trim();
    const subType = subscription.type || "Codzienny";
    const rawAmt = Math.abs(parseFloat(subscription.amount) || 0);
    const todayStr = new Date().toISOString().split("T")[0];

    pendingSubscriptionSource = {
        id: subscription.id
    };

    // Przełączamy widok na transakcje
    openDashboardScreen("transactions");

    // Otwieramy pop-up dodania nowego wpisu z prefillem
    openEntryEditModal(null, {
        name: subName,
        amount: rawAmt,
        date: todayStr,
        type: subType,
        isExpense: true
    });
}

// MODAL SZCZEGÓŁÓW / EDYCJI / NOWEGO WPISU (NA TELEFONIE I DESKTOPIE)
function openEntryEditModal(id = null, prefillData = null) {
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
        if (modalTitle) modalTitle.textContent = "Dodaj rekord";
        if (btnSave) btnSave.textContent = "Dodaj rekord";
        if (btnDelete) btnDelete.style.display = "none";
    } else {
        if (modalTitle) modalTitle.textContent = "Edycja rekordu";
        if (btnSave) btnSave.textContent = "Zapisz zmiany";
        if (btnDelete) btnDelete.style.display = "inline-flex";
    }

    let isExpense = true;
    let amtVal = "";
    let savVal = "";
    let prefillName = "";
    let prefillDate = todayStr;
    let prefillType = "Codzienny";

    if (isNew) {
        if (prefillData) {
            prefillName = prefillData.name || "";
            amtVal = prefillData.amount ? Math.abs(Number(prefillData.amount)).toFixed(2) : "";
            isExpense = prefillData.isExpense !== undefined ? prefillData.isExpense : true;
            prefillDate = prefillData.date || todayStr;
            prefillType = prefillData.type || "Codzienny";
        } else {
            isExpense = true;
        }
    } else {
        const rawAmt = Number(entry.amount || 0);
        isExpense = rawAmt < 0 || (rawAmt === 0 && (entry.type || "").toLowerCase() !== "praca" && (entry.type || "").toLowerCase() !== "fucha");
        amtVal = Math.abs(rawAmt) ? Math.abs(rawAmt).toFixed(2) : "";
        savVal = entry.savings ? Number(entry.savings).toFixed(2) : "";
    }

    const btnModalKindExpense = document.getElementById("btnModalKindExpense");
    const btnModalKindIncome = document.getElementById("btnModalKindIncome");
    const modalCheckSavings = document.getElementById("modalCheckSavings");

    if (btnModalKindExpense && btnModalKindIncome) {
        btnModalKindExpense.className = "btn-flow " + (isExpense ? "active flow-expense" : "");
        btnModalKindIncome.className = "btn-flow " + (!isExpense ? "active flow-income" : "");
    }

    if (modalCheckSavings && editEntrySavings) {
        modalCheckSavings.checked = Boolean(savVal && parseFloat(savVal) > 0);
        editEntrySavings.disabled = !modalCheckSavings.checked;
        editEntrySavings.value = savVal;
    }

    if (editEntryId) editEntryId.value = isNew ? "" : entry.id;
    if (editEntryName) editEntryName.value = isNew ? prefillName : (entry.name || "");
    if (editEntryAmount) editEntryAmount.value = amtVal;
    
    const rawDate = isNew ? prefillDate : (entry.date || entry.loan_date || entry.first_payment || todayStr);
    if (editEntryDate) editEntryDate.value = formatDateToInput(rawDate) || todayStr;

    const groupKind = document.getElementById("groupEditKind");
    const labelEditKind = document.getElementById("labelEditEntryKind");

    if (state.currentDb === "debts") {
        if (groupPerson) groupPerson.style.display = "block";
        if (editEntryPerson && !isNew) editEntryPerson.value = entry.person || "";
        
        // W długach ukrywamy zwykły select typu długu na rzecz przycisków rodzaju długu: Dług u mnie / Dług u osoby
        if (groupDebtType) groupDebtType.style.display = "none";
        if (groupType) groupType.style.display = "none";
        if (groupSavings) groupSavings.style.display = "none";

        if (groupRepaymentDate) groupRepaymentDate.style.display = "block";
        if (editEntryRepaymentDate && !isNew) {
            editEntryRepaymentDate.value = formatDateToInput(entry.repayment_date) || "";
        }

        // Rodzaj w długach: "Dług u mnie" vs "Dług u osoby"
        if (groupKind) groupKind.style.display = "block";
        if (labelEditKind) labelEditKind.textContent = "Rodzaj długu";
        if (btnModalKindExpense) btnModalKindExpense.textContent = "Dług u mnie";
        if (btnModalKindIncome) btnModalKindIncome.textContent = "Dług u osoby";

        const isDebtToMe = isNew ? true : ((entry.debt_type || "").trim() === "Dług u mnie");
        if (btnModalKindExpense && btnModalKindIncome) {
            btnModalKindExpense.className = "btn-flow " + (isDebtToMe ? "active flow-expense" : "");
            btnModalKindIncome.className = "btn-flow " + (!isDebtToMe ? "active flow-income" : "");
        }
    } else if (state.currentDb === "subscriptions") {
        if (groupPerson) groupPerson.style.display = "none";
        if (groupDebtType) groupDebtType.style.display = "none";
        if (groupRepaymentDate) groupRepaymentDate.style.display = "none";
        if (groupSavings) groupSavings.style.display = "none";

        if (groupType) groupType.style.display = "block";
        if (editEntryType) {
            editEntryType.value = isNew ? prefillType : (entry.type || "Codzienny");
        }

        // Rodzaj w subskrypcjach: Wydatek (-) / Zysk (+)
        if (groupKind) groupKind.style.display = "block";
        if (labelEditKind) labelEditKind.textContent = "Rodzaj transakcji";
        if (btnModalKindExpense) btnModalKindExpense.textContent = "Wydatek (-)";
        if (btnModalKindIncome) btnModalKindIncome.textContent = "Zysk (+)";

        const isSubExpense = isNew ? true : (Number(entry.amount || 0) <= 0);
        if (btnModalKindExpense && btnModalKindIncome) {
            btnModalKindExpense.className = "btn-flow " + (isSubExpense ? "active flow-expense" : "");
            btnModalKindIncome.className = "btn-flow " + (!isSubExpense ? "active flow-income" : "");
        }
    } else {
        // Transakcje
        if (groupPerson) groupPerson.style.display = "none";
        if (groupDebtType) groupDebtType.style.display = "none";
        if (groupRepaymentDate) groupRepaymentDate.style.display = "none";

        if (groupType) groupType.style.display = "block";
        if (editEntryType) {
            editEntryType.value = isNew ? prefillType : (entry.type || "Codzienny");
        }

        if (groupKind) groupKind.style.display = "block";
        if (labelEditKind) labelEditKind.textContent = "Rodzaj transakcji";
        if (btnModalKindExpense) btnModalKindExpense.textContent = "Wydatek (-)";
        if (btnModalKindIncome) btnModalKindIncome.textContent = "Zysk (+)";

        if (btnModalKindExpense && btnModalKindIncome) {
            btnModalKindExpense.className = "btn-flow " + (isExpense ? "active flow-expense" : "");
            btnModalKindIncome.className = "btn-flow " + (!isExpense ? "active flow-income" : "");
        }

        if (groupSavings) groupSavings.style.display = "flex";
    }

    const labelEditAmount = document.getElementById("labelEditEntryAmount");
    if (labelEditAmount) {
        labelEditAmount.textContent = (state.currentDb === "subscriptions") ? "Koszt *" : "Kwota *";
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
    const rawAmount = Math.abs(parseFloat(document.getElementById("editEntryAmount").value) || 0);
    const todayStr = new Date().toISOString().split("T")[0];

    const btnModalKindExpense = document.getElementById("btnModalKindExpense");
    const isExpense = btnModalKindExpense ? btnModalKindExpense.classList.contains("active") : true;
    const finalAmount = isExpense ? -rawAmount : rawAmount;

    const modalCheckSavings = document.getElementById("modalCheckSavings");
    const editEntrySavings = document.getElementById("editEntrySavings");
    let savingsVal = 0;
    if (modalCheckSavings && modalCheckSavings.checked && editEntrySavings) {
        savingsVal = Math.abs(parseFloat(editEntrySavings.value) || 0);
    }

    if (isNew) {
        const newId = list.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0) + 1;
        let newRecord = null;

        if (state.currentDb === "debts") {
            const debtTypeVal = isExpense ? "Dług u mnie" : "Dług u osoby";
            newRecord = {
                id: newId,
                person: document.getElementById("editEntryPerson").value.trim(),
                name: name,
                debt_type: debtTypeVal,
                amount: rawAmount,
                loan_date: document.getElementById("editEntryDate").value || todayStr,
                repayment_date: document.getElementById("editEntryRepaymentDate").value || "",
                update: todayStr
            };
        } else if (state.currentDb === "subscriptions") {
            newRecord = {
                id: newId,
                name: name,
                type: document.getElementById("editEntryType").value,
                amount: finalAmount,
                savings: 0,
                first_payment: document.getElementById("editEntryDate").value || todayStr,
                last_payment: todayStr
            };
        } else {
            newRecord = {
                id: newId,
                name: name,
                type: document.getElementById("editEntryType").value,
                amount: finalAmount,
                savings: savingsVal,
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

        // Jeśli transakcja pochodziła z akcji 'Zapisz transakcję' w subskrypcjach, aktualizujemy 'last_payment'
        if (pendingSubscriptionSource && pendingSubscriptionSource.id) {
            const subId = pendingSubscriptionSource.id;
            pendingSubscriptionSource = null;
            const subEntry = state.subscriptions.find(s => Number(s.id) === Number(subId));
            if (subEntry) {
                subEntry.last_payment = newRecord.date || todayStr;
                const cachedSubs = localStorage.getItem(CACHE_KEYS.SUBSCRIPTIONS_REAL);
                if (cachedSubs || state.isAdmin) {
                    try {
                        localStorage.setItem(CACHE_KEYS.SUBSCRIPTIONS_REAL, JSON.stringify(state.subscriptions));
                    } catch (e) {}
                }
                enqueueSyncTask({
                    type: "editSubscription",
                    db: "subscriptions",
                    id: subId,
                    data: subEntry
                });
            }
        }
        return;
    }

    const id = Number(idVal);
    const entry = list.find(t => Number(t.id) === id);
    if (!entry) return;

    entry.name = name;

    if (state.currentDb === "debts") {
        entry.amount = rawAmount;
        entry.person = document.getElementById("editEntryPerson").value.trim();
        entry.debt_type = isExpense ? "Dług u mnie" : "Dług u osoby";
        entry.loan_date = document.getElementById("editEntryDate").value;
        entry.repayment_date = document.getElementById("editEntryRepaymentDate").value;
        entry.update = todayStr;
    } else if (state.currentDb === "subscriptions") {
        entry.amount = finalAmount;
        entry.type = document.getElementById("editEntryType").value;
        entry.first_payment = document.getElementById("editEntryDate").value;
        entry.savings = 0;
    } else {
        entry.amount = finalAmount;
        entry.type = document.getElementById("editEntryType").value;
        entry.date = document.getElementById("editEntryDate").value;
        entry.savings = savingsVal;
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

let pendingDeleteAction = null;

function promptConfirmDelete({ title, message, onConfirm }) {
    const modal = document.getElementById("confirmDeleteModal");
    const modalTitle = document.getElementById("confirmDeleteModalTitle");
    const modalMessage = document.getElementById("confirmDeleteModalMessage");

    if (modalTitle && title) modalTitle.textContent = title;
    if (modalMessage && message) modalMessage.textContent = message;

    pendingDeleteAction = onConfirm;
    if (modal) modal.style.display = "flex";
}

function handleDeleteFromEditModal() {
    const id = Number(document.getElementById("editEntryId").value);
    if (!id) return;

    const list = getCurrentDbList();
    const entry = list.find(t => Number(t.id) === id);
    const entryName = entry ? (entry.name || "ten wpis") : "ten wpis";

    let dbNameLabel = "rekord";
    if (state.currentDb === "debts") dbNameLabel = "dług";
    else if (state.currentDb === "subscriptions") dbNameLabel = "subskrypcję / usługę";
    else dbNameLabel = "transakcję";

    promptConfirmDelete({
        title: "Usunąć " + dbNameLabel + "?",
        message: "Czy na pewno chcesz usunąć " + dbNameLabel + " \"" + entryName + "\"? Tej operacji nie można cofnąć.",
        onConfirm: () => {
            let currentList = getCurrentDbList();
            setCurrentDbList(currentList.filter(t => Number(t.id) !== id));
            saveCurrentDbToCache();
            renderTransactionsTable();
            closeModal("entryEditModal");

            enqueueSyncTask({
                type: "delete" + capitalize(state.currentDb),
                db: state.currentDb,
                id: id
            });
        }
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

        // Tryb normalny
        const displayDiv = document.createElement("div");
        displayDiv.style.display = "flex";
        displayDiv.style.justifyContent = "space-between";
        displayDiv.style.alignItems = "center";
        displayDiv.style.width = "100%";

        displayDiv.innerHTML = `
            <span class="type-name-label">${escapeHtml(type)}</span>
            <div class="type-row-actions">
                <button type="button" class="btn-type-edit">[Edytuj]</button>
                <button type="button" class="btn-type-delete">[Usuń]</button>
            </div>
        `;

        // Tryb edycji w wierszu
        const editDiv = document.createElement("div");
        editDiv.className = "type-edit-inline";
        editDiv.style.display = "none";
        editDiv.innerHTML = `
            <input type="text" class="form-input type-edit-input" value="${escapeHtml(type)}">
            <button type="button" class="btn-primary btn-type-save" style="padding: 4px 10px; font-size: 13px;">Zapisz</button>
            <button type="button" class="btn-secondary btn-type-cancel" style="padding: 4px 10px; font-size: 13px;">Anuluj</button>
        `;

        displayDiv.querySelector(".btn-type-edit").addEventListener("click", () => {
            displayDiv.style.display = "none";
            editDiv.style.display = "flex";
            const input = editDiv.querySelector(".type-edit-input");
            if (input) {
                input.focus();
                input.select();
            }
        });

        displayDiv.querySelector(".btn-type-delete").addEventListener("click", () => handleDeleteType(type));

        editDiv.querySelector(".btn-type-cancel").addEventListener("click", () => {
            editDiv.style.display = "none";
            displayDiv.style.display = "flex";
        });

        editDiv.querySelector(".btn-type-save").addEventListener("click", () => {
            const input = editDiv.querySelector(".type-edit-input");
            const newVal = input ? input.value.trim() : "";
            if (!newVal || newVal === type) {
                editDiv.style.display = "none";
                displayDiv.style.display = "flex";
                return;
            }
            handleRenameType(type, newVal);
        });

        editDiv.querySelector(".type-edit-input").addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                editDiv.querySelector(".btn-type-save").click();
            } else if (e.key === "Escape") {
                editDiv.querySelector(".btn-type-cancel").click();
            }
        });

        row.appendChild(displayDiv);
        row.appendChild(editDiv);
        container.appendChild(row);
    });
}

function handleRenameType(oldType, newType) {
    const errorBox = document.getElementById("newTypeError");
    if (state.types.includes(newType) && newType !== oldType) {
        if (errorBox) {
            errorBox.textContent = "Taki typ już istnieje.";
            errorBox.style.display = "block";
        }
        return;
    }
    if (errorBox) errorBox.style.display = "none";

    // Aktualizacja w liście typów
    const idx = state.types.indexOf(oldType);
    if (idx !== -1) {
        state.types[idx] = newType;
    }

    // Aktualizacja powiązanych wpisów w pamięci (transakcje i subskrypcje)
    state.transactions.forEach(t => {
        if (t.type === oldType) t.type = newType;
    });
    state.subscriptions.forEach(s => {
        if (s.type === oldType) s.type = newType;
    });

    saveCurrentDbToCache();
    populateTypeDropdowns();
    renderTypesManagementList();
    renderTransactionsTable();

    // Synchronizacja w tle (dodanie nowego i usunięcie starego ze skryptu)
    enqueueSyncTask({
        type: "addType",
        name: newType
    });
    enqueueSyncTask({
        type: "deleteType",
        name: oldType
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
    promptConfirmDelete({
        title: "Usunąć typ?",
        message: "Czy na pewno chcesz usunąć typ \"" + typeName + "\" z ustawień bazy? Tej operacji nie można cofnąć.",
        onConfirm: () => {
            state.types = state.types.filter(t => t !== typeName);
            populateTypeDropdowns();
            renderTypesManagementList();

            enqueueSyncTask({
                type: "deleteType",
                name: typeName
            });
        }
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
