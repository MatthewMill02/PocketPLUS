/**
 * PocketPLUS - Komunikacja z Google Apps Script (JSONP) oraz autoryzacja hasłem
 */

function callBackendJsonp(params) {
    return new Promise((resolve, reject) => {
        const callbackName = "jsonp_callback_" + Math.round(100000 * Math.random());
        window[callbackName] = function (data) {
            delete window[callbackName];
            if (script && script.parentNode) script.parentNode.removeChild(script);
            resolve(data);
        };

        const queryParts = [];
        for (const key in params) {
            if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined) {
                queryParts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
            }
        }
        queryParts.push("callback=" + callbackName);

        const script = document.createElement("script");
        script.src = GOOGLE_SCRIPT_URL + (GOOGLE_SCRIPT_URL.includes("?") ? "&" : "?") + queryParts.join("&");
        script.onerror = function () {
            delete window[callbackName];
            if (script && script.parentNode) script.parentNode.removeChild(script);
            reject(new Error("Błąd sieci JSONP"));
        };
        document.body.appendChild(script);
    });
}

function loadSavedAuth() {
    const saved = localStorage.getItem(CACHE_KEYS.ADMIN_AUTH);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.isAdmin = true;
            state.adminPassword = data.pass || "";
            updateAdminUi();
        } catch (e) {}
    }
}

async function handleAdminLoginSubmit(e) {
    e.preventDefault();
    const passInput = document.getElementById("adminPasswordInput");
    const errorBox = document.getElementById("adminLoginError");
    const pass = passInput ? passInput.value.trim() : "";

    if (!pass) return;

    try {
        const res = await callBackendJsonp({
            action: "verifyAuth",
            pass: pass
        });

        if (res && res.status === "success" && res.data.authorized) {
            state.isAdmin = true;
            state.adminPassword = pass;
            localStorage.setItem(CACHE_KEYS.ADMIN_AUTH, JSON.stringify({ pass: pass }));
            if (errorBox) errorBox.style.display = "none";
            closeModal("adminLoginModal");
            updateAdminUi();
            processSyncQueue();
        } else {
            if (errorBox) {
                errorBox.textContent = "Niepoprawne hasło dostępu.";
                errorBox.style.display = "block";
            }
        }
    } catch (err) {
        // Zezwolenie offline na testy
        state.isAdmin = true;
        state.adminPassword = pass;
        localStorage.setItem(CACHE_KEYS.ADMIN_AUTH, JSON.stringify({ pass: pass }));
        closeModal("adminLoginModal");
        updateAdminUi();
    }
}

function logoutAdmin() {
    state.isAdmin = false;
    state.adminPassword = "";
    localStorage.removeItem(CACHE_KEYS.ADMIN_AUTH);
    updateAdminUi();
}

function updateAdminUi() {
    const btnAdminModal = document.getElementById("btnAdminLoginModal");
    const syncWrapper = document.getElementById("syncStatusWrapper");

    if (state.isAdmin) {
        if (btnAdminModal) btnAdminModal.style.display = "none";
        if (syncWrapper) syncWrapper.style.display = "flex";
    } else {
        if (btnAdminModal) btnAdminModal.style.display = "inline-block";
        if (syncWrapper) syncWrapper.style.display = "none";
    }
}
