/**
 * PocketPLUS - Stan aplikacji i stałe konfiguracyjne
 */

// Adres wdrożonej aplikacji Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxaR4Ie3JK4SnwCvKDM95REK-jVQQ3MJX4Midj9wxMIZa2LoUZnp2py0bp7hPnvLf88/exec";

// Klucze LocalStorage
const CACHE_KEYS = {
    TRANSACTIONS_REAL: "pocketplus_cache_transactions_real",
    SAVINGS_REAL: "pocketplus_cache_savings_real",
    DEBTS_REAL: "pocketplus_cache_debts_real",
    SUBSCRIPTIONS_REAL: "pocketplus_cache_subscriptions_real",
    INVESTMENTS_REAL: "pocketplus_cache_investments_real",
    TYPES: "pocketplus_cache_types",
    SOURCES: "pocketplus_cache_sources",
    INVTYPES: "pocketplus_cache_invtypes",
    ADMIN_AUTH: "pocketplus_admin_auth",
    SYNC_QUEUE: "pocketplus_sync_queue",
    LOCKDOWN_UNTIL: "pocketplus_lockdown_until"
};

// Konfiguracja baz danych (Matthew, Oszczędności, Marco, Manhattan, Inwestycje)
const DATABASES = {
    transactions: {
        id: "transactions",
        name: "Matthew",
        title: "Transakcje",
        avatar: "assets/Matthew.PNG",
        avatarClass: "",
        themeClass: "",
        csvFile: "assets/test_data/transactions.csv"
    },
    savings: {
        id: "savings",
        name: "Oszczędności",
        title: "Oszczędności",
        avatar: "assets/Matthew.PNG",
        avatarClass: "avatar-blue",
        themeClass: "theme-savings",
        csvFile: "assets/test_data/savings.csv"
    },
    debts: {
        id: "debts",
        name: "Marco",
        title: "Długi",
        avatar: "assets/Matthew.PNG",
        avatarClass: "avatar-purple",
        themeClass: "theme-debts",
        csvFile: "assets/test_data/debts.csv"
    },
    subscriptions: {
        id: "subscriptions",
        name: "Manhattan",
        title: "Subskrypcje",
        avatar: "assets/Matthew.PNG",
        avatarClass: "avatar-red",
        themeClass: "theme-subscriptions",
        csvFile: "assets/test_data/subscriptions.csv"
    },
    investments: {
        id: "investments",
        name: "Inwestycje",
        title: "Inwestycje",
        avatar: "assets/Matthew.PNG",
        avatarClass: "avatar-burgundy",
        themeClass: "theme-investments",
        csvFile: "assets/test_data/investments.csv"
    }
};

// Globalny stan aplikacji
const state = {
    currentScreen: "welcome", // "welcome" | "dashboard"
    currentDb: "transactions", // "transactions" | "savings" | "debts" | "subscriptions" | "investments"
    transactions: [],
    savings: [],
    debts: [],
    subscriptions: [],
    investments: [],
    types: ["Codzienny", "Studia", "Prezent", "Praca", "Hobby", "Fucha", "Specjalny", "Natan", "Transakcja", "Oszczędności", "Subskrypcja", "Wyrównanie", "Inwestycja"],
    sources: ["Oszczędności", "Końcówka rachunku", "Oprocentowanie", "Wyrównanie"],
    invtypes: ["ETFy", "Złoto", "Srebro"],
    isAdmin: false,
    adminPassword: "",
    syncQueue: [],
    isSyncing: false,
    lockdownTimerId: null,
    quickKind: "expense", // "expense" | "income" (lub "Dług u mnie" / "Dług u osoby" dla debts)
    filters: {
        search: "",
        type: "all",
        sort: "date_desc"
    },
    // Dynamiczne ładowanie rekordów (Infinite Scroll)
    infiniteScroll: {
        batchSize: 30,
        renderedCount: 30,
        isLoadingMore: false,
        allLoaded: false
    }
};

function saveCurrentDbToCache() {
    if (!state.isAdmin) return; // Niezalogowany nie nadpisuje cache realnymi danymi
    if (state.currentDb === "transactions") {
        localStorage.setItem(CACHE_KEYS.TRANSACTIONS_REAL, JSON.stringify(state.transactions));
    } else if (state.currentDb === "savings") {
        localStorage.setItem(CACHE_KEYS.SAVINGS_REAL, JSON.stringify(state.savings));
    } else if (state.currentDb === "debts") {
        localStorage.setItem(CACHE_KEYS.DEBTS_REAL, JSON.stringify(state.debts));
    } else if (state.currentDb === "subscriptions") {
        localStorage.setItem(CACHE_KEYS.SUBSCRIPTIONS_REAL, JSON.stringify(state.subscriptions));
    } else if (state.currentDb === "investments") {
        localStorage.setItem(CACHE_KEYS.INVESTMENTS_REAL, JSON.stringify(state.investments));
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "flex";
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}
