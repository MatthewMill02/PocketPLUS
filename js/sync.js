/**
 * PocketPLUS - Kolejka synchronizacji w tle (Optimistic UI)
 */

function enqueueSyncTask(task) {
    state.syncQueue.push({
        id: Date.now() + Math.random().toString(36).substr(2, 4),
        task: task,
        status: "pending",
        timestamp: new Date().toLocaleTimeString()
    });
    saveSyncQueue();
    updateSyncStatusBadge();
    processSyncQueue();
}

function saveSyncQueue() {
    localStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(state.syncQueue));
}

function loadSyncQueue() {
    const cached = localStorage.getItem(CACHE_KEYS.SYNC_QUEUE);
    if (cached) {
        try {
            state.syncQueue = JSON.parse(cached);
        } catch (e) {
            state.syncQueue = [];
        }
    }
    updateSyncStatusBadge();
}

function updateSyncStatusBadge() {
    const wrapper = document.getElementById("syncStatusWrapper");
    const countBadge = document.getElementById("syncQueueCount");
    const queueList = document.getElementById("syncQueueList");
    const syncImg = document.getElementById("syncStatusImg");

    if (wrapper) wrapper.style.display = "flex";

    const pending = state.syncQueue.filter(t => t.status === "pending" || t.status === "in_progress");
    if (countBadge) countBadge.textContent = `${pending.length} w kolejce`;

    if (syncImg) {
        syncImg.src = state.isSyncing ? "assets/sync.gif" : "assets/sync.png";
    }

    if (queueList) {
        if (!state.syncQueue || state.syncQueue.length === 0) {
            queueList.innerHTML = `
                <div class="queue-empty-box">
                    <span class="queue-empty-dash">-</span>
                    <p class="queue-empty-msg">Brak elementów w kolejce do synchronizacji</p>
                    <span class="queue-empty-sub">Wszystkie dane są aktualne</span>
                </div>
            `;
        } else {
            const statusLabels = {
                pending: "Oczekuje",
                in_progress: "Wysyłanie...",
                completed: "Zsynchronizowano",
                failed: "Błąd",
                error: "Błąd połączenia"
            };

            const typeLabels = {
                addTransactions: "Dodanie transakcji",
                addTransaction: "Dodanie transakcji",
                editTransaction: "Edycja transakcji",
                deleteTransaction: "Usunięcie transakcji",
                addSavings: "Dodanie oszczędności",
                editSaving: "Edycja oszczędności",
                deleteSavings: "Usunięcie oszczędności",
                addDebts: "Dodanie długu",
                addDebt: "Dodanie długu",
                editDebt: "Edycja długu",
                deleteDebt: "Usunięcie długu",
                addSubscriptions: "Dodanie subskrypcji",
                addSubscription: "Dodanie subskrypcji",
                editSubscription: "Edycja subskrypcji",
                deleteSubscription: "Usunięcie subskrypcji",
                addInvestments: "Dodanie inwestycji",
                addInvestment: "Dodanie inwestycji",
                editInvestment: "Edycja inwestycji",
                deleteInvestments: "Usunięcie inwestycji",
                addType: "Nowy typ",
                deleteType: "Usunięcie typu"
            };

            queueList.innerHTML = state.syncQueue.map(q => {
                const label = typeLabels[q.task.type] || q.task.type;
                const detail = q.task.data && q.task.data.name ? q.task.data.name : (q.task.name ? q.task.name : (q.task.id ? `ID #${q.task.id}` : ''));
                const statusText = statusLabels[q.status] || q.status;
                return `
                    <div class="queue-item status-${q.status}">
                        <div class="queue-item-info">
                            <span class="queue-item-name">${escapeHtml(label)}</span>
                            ${detail ? `<span class="queue-item-detail">${escapeHtml(detail)}</span>` : ''}
                        </div>
                        <span class="queue-item-status queue-status-${q.status}">${escapeHtml(statusText)}</span>
                    </div>
                `;
            }).join("");
        }
    }
}

async function processSyncQueue() {
    if (state.isSyncing || !state.isAdmin || !state.adminPassword) return;

    const nextTaskObj = state.syncQueue.find(t => t.status === "pending");
    if (!nextTaskObj) {
        updateSyncStatusBadge();
        return;
    }

    state.isSyncing = true;
    nextTaskObj.status = "in_progress";
    updateSyncStatusBadge();

    const { task } = nextTaskObj;

    try {
        let params = {
            action: task.type,
            pass: state.adminPassword
        };

        if (task.type === "addType") {
            params.name = task.name;
        } else if (task.type === "deleteType") {
            params.name = task.name;
        } else if (task.type.startsWith("edit")) {
            params.id = task.id;
            params.data = JSON.stringify(task.data);
        } else if (task.type.startsWith("add")) {
            params.data = JSON.stringify(task.data);
        } else if (task.type.startsWith("delete")) {
            params.id = task.id;
        }

        const res = await callBackendJsonp(params);
        if (res && res.status === "success") {
            nextTaskObj.status = "completed";
            state.syncQueue = state.syncQueue.filter(q => q.id !== nextTaskObj.id);
            saveSyncQueue();
        } else {
            nextTaskObj.status = "failed";
        }
    } catch (err) {
        nextTaskObj.status = "error";
    } finally {
        state.isSyncing = false;
        updateSyncStatusBadge();
        if (state.syncQueue.some(t => t.status === "pending")) {
            setTimeout(processSyncQueue, 500);
        }
    }
}
