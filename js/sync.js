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

    if (!state.isAdmin) {
        if (wrapper) wrapper.style.display = "none";
        return;
    }

    if (wrapper) wrapper.style.display = "flex";

    const pending = state.syncQueue.filter(t => t.status === "pending" || t.status === "in_progress");
    if (countBadge) countBadge.textContent = `${pending.length} zadań`;

    if (syncImg) {
        syncImg.src = state.isSyncing ? "assets/sync.gif" : "assets/sync.png";
    }

    if (queueList) {
        if (state.syncQueue.length === 0) {
            queueList.innerHTML = '<p class="queue-empty-msg">Wszystkie zmiany są zsynchronizowane.</p>';
        } else {
            queueList.innerHTML = state.syncQueue.slice(-6).map(q => `
                <div class="queue-item status-${q.status}">
                    <span>${escapeHtml(q.task.type)} (${escapeHtml(q.task.data ? q.task.data.name : 'ID ' + q.task.id)})</span>
                    <small>${escapeHtml(q.status)}</small>
                </div>
            `).join("");
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
