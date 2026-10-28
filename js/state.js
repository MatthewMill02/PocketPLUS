/**
 * PocketPLUS - Stan aplikacji i stałe konfiguracyjne
 */

// Adres wdrożonej aplikacji Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxaR4Ie3JK4SnwCvKDM95REK-jVQQ3MJX4Midj9wxMIZa2LoUZnp2py0bp7hPnvLf88/exec";

// Klucze LocalStorage
const CACHE_KEYS = {
    TRANSACTIONS: "pocketplus_cache_transactions",
    TYPES: "pocketplus_cache_types",
    ADMIN_AUTH: "pocketplus_admin_auth",
    SYNC_QUEUE: "pocketplus_sync_queue",
    LOCKDOWN_UNTIL: "pocketplus_lockdown_until"
};

// Globalny stan aplikacji
const state = {
    currentScreen: "welcome", // "welcome" | "dashboard"
    transactions: [],
    types: ["Codzienny", "Studia", "Prezent", "Praca", "Hobby", "Fucha"],
    isAdmin: false,
    adminPassword: "",
    syncQueue: [],
    isSyncing: false,
    lockdownTimerId: null,
    quickKind: "expense", // "expense" | "income"
    filters: {
        search: "",
        type: "all",
        sort: "date_desc"
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1
    }
};

function saveTransactionsToCache() {
    localStorage.setItem(CACHE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
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
