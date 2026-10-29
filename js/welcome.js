/**
 * PocketPLUS - Ekran powitalny i zabezpieczenie kafelków (15s blokada)
 */

function showWelcomeScreen() {
    state.currentScreen = "welcome";
    document.body.className = "screen-welcome";
    document.body.classList.remove("theme-debts", "theme-subscriptions");
    const appHeader = document.getElementById("appHeader");
    const welcomeScreen = document.getElementById("welcomeScreen");
    const dashboardScreen = document.getElementById("dashboardScreen");

    if (appHeader) appHeader.style.display = "none";
    if (dashboardScreen) dashboardScreen.style.display = "none";
    if (welcomeScreen) welcomeScreen.style.display = "flex";

    renderWelcomeScatterHeads();
}

function renderWelcomeScatterHeads() {
    const container = document.getElementById("headsScatterContainer");
    if (!container) return;
    container.innerHTML = "";

    // 3 kafelki faktycznych danych + atrapy z icon.png
    const tiles = [
        { type: "db", dbId: "transactions", name: "Matthew", img: "assets/Matthew.PNG", avatarClass: "" },
        { type: "db", dbId: "debts", name: "Marco", img: "assets/Matthew.PNG", avatarClass: "avatar-purple" },
        { type: "db", dbId: "subscriptions", name: "Manhattan", img: "assets/Matthew.PNG", avatarClass: "avatar-red" },
        { type: "decoy", name: "Gość", img: "assets/icon.png", avatarClass: "" },
        { type: "decoy", name: "Archiwum", img: "assets/icon.png", avatarClass: "" },
        { type: "decoy", name: "Audyt", img: "assets/icon.png", avatarClass: "" }
    ];

    const shuffled = [...tiles].sort(() => Math.random() - 0.5);

    const positions = [
        { top: "18%", left: "15%" },
        { top: "20%", right: "18%" },
        { bottom: "18%", left: "18%" },
        { bottom: "22%", right: "16%" },
        { top: "50%", left: "10%" },
        { top: "52%", right: "12%" }
    ];

    const isLocked = isCurrentlyLocked();

    shuffled.forEach((tile, index) => {
        const card = document.createElement("div");
        card.className = "scatter-head-card" + (isLocked ? " is-locked" : "");

        const pos = positions[index % positions.length];
        Object.keys(pos).forEach(key => {
            card.style[key] = pos[key];
        });

        card.innerHTML = `
            <img src="${tile.img}" alt="${escapeHtml(tile.name)}" class="scatter-head-img ${tile.avatarClass}" onerror="this.src='assets/icon.png'">
            <span class="scatter-head-name">${escapeHtml(tile.name)}</span>
        `;

        card.addEventListener("click", () => {
            if (isCurrentlyLocked()) return;

            if (tile.type === "db") {
                openDashboardScreen(tile.dbId);
            } else {
                triggerLockdown();
            }
        });

        container.appendChild(card);
    });
}

function isCurrentlyLocked() {
    const until = parseInt(localStorage.getItem(CACHE_KEYS.LOCKDOWN_UNTIL) || "0", 10);
    return Date.now() < until;
}

function loadLockdownState() {
    if (isCurrentlyLocked()) {
        const remainingMs = parseInt(localStorage.getItem(CACHE_KEYS.LOCKDOWN_UNTIL), 10) - Date.now();
        startLockdownCountdown(Math.ceil(remainingMs / 1000));
    }
}

function triggerLockdown() {
    const lockDurationSec = 15;
    const lockUntil = Date.now() + lockDurationSec * 1000;
    localStorage.setItem(CACHE_KEYS.LOCKDOWN_UNTIL, lockUntil.toString());
    startLockdownCountdown(lockDurationSec);
    renderWelcomeScatterHeads();
}

function startLockdownCountdown(seconds) {
    if (state.lockdownTimerId) clearInterval(state.lockdownTimerId);

    const banner = document.getElementById("lockdownBanner");
    const timerSpan = document.getElementById("lockdownTimer");
    if (banner) banner.style.display = "block";

    let remaining = seconds;
    if (timerSpan) timerSpan.textContent = remaining;

    state.lockdownTimerId = setInterval(() => {
        remaining--;
        if (timerSpan) timerSpan.textContent = remaining;

        if (remaining <= 0) {
            clearInterval(state.lockdownTimerId);
            state.lockdownTimerId = null;
            localStorage.removeItem(CACHE_KEYS.LOCKDOWN_UNTIL);
            if (banner) banner.style.display = "none";
            renderWelcomeScatterHeads();
        }
    }, 1000);
}
