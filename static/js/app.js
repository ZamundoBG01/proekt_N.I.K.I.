let currentWorkspace = 'general';
let currentSubfolder = '';
let thinkingInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    initClock();
    loadWorkspaces();
    loadWorkspaceData('general');
    setupEventListeners();
});

function initClock() {
    const clockEl = document.getElementById("live-clock");
    if (!clockEl) return;
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString();
    }, 1000);
}

function getLocalTimeString() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Помощни функции за индикатора за мислене
function showThinkingIndicator() {
    const indicator = document.getElementById("thinking-indicator");
    if (!indicator) return;
    indicator.style.display = 'block';
    let count = 1;
    indicator.textContent = `N.I.K.I. анализира параметрите и физичните закони... [ ${count} ]`;
    if (thinkingInterval) clearInterval(thinkingInterval);
    thinkingInterval = setInterval(() => {
        count++;
        indicator.textContent = `N.I.K.I. анализира параметрите и физичните закони... [ ${count} ]`;
    }, 1000);
}

function hideThinkingIndicator() {
    if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
    }
    const indicator = document.getElementById("thinking-indicator");
    if (indicator) {
        indicator.style.display = 'none';
    }
}

async function loadWorkspaces() {
    try {
        const res = await fetch('/workspaces');
        const data = await res.json();
        const select = document.getElementById("workspace-select");
        if (!select) return;
        select.innerHTML = '';
        data.workspaces.forEach(ws => {
            const opt = document.createElement("option");
            opt.value = ws;
            opt.textContent = ws.toUpperCase();
            if (ws === currentWorkspace) opt.selected = true;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Грешка при зареждане на проектите:", e);
    }
}

async function changeWorkspace() {
    const select = document.getElementById("workspace-select");
    currentWorkspace = select.value;
    currentSubfolder = '';
    document.getElementById("current-ws-badge").textContent = `Проект: ${currentWorkspace.toUpperCase()}`;
    await loadWorkspaceData(currentWorkspace);
}

async function createNewWorkspace() {
    const nameInput = document.getElementById("new-workspace-name");
    const name = nameInput.value.trim();
    if (!name) return alert("Въведете име на новия проект.");

    try {
        const res = await fetch('/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'success') {
            nameInput.value = '';
            await loadWorkspaces();
            document.getElementById("workspace-select").value = data.workspace;
            changeWorkspace();
        }
    } catch (e) {
        console.error("Грешка при създаване на проект:", e);
    }
}

async function deleteCurrentWorkspace() {
    if (currentWorkspace === 'general') {
        return alert("Основният проект 'general' не може да бъде изтрит.");
    }
    if (!confirm(`Сигурни ли сте, че искате да изтриете целия проект '${currentWorkspace}' с всички негови факти и библиотека?`)) return;

    try {
        await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "изтрий всичко", workspace: currentWorkspace })
        });
        currentWorkspace = 'general';
        await loadWorkspaces();
        loadWorkspaceData('general');
        alert("Проектът беше изтрит успешно.");
    } catch (e) {
        console.error("Грешка при изтриване на проект:", e);
    }
}

async function loadWorkspaceData(wsName, subfolder = '') {
    try {
        const res = await fetch(`/workspace_data/${encodeURIComponent(wsName)}?subfolder=${encodeURIComponent(subfolder)}`);
        const data = await res.json();
        
        renderFacts(data.facts);
        renderChatHistory(data.chat_history);
        renderLibrary(data.files, data.folders, data.current_subfolder);
    } catch (e) {
        console.error("Грешка при зареждане на данните за проекта:", e);
    }
}

function renderFacts(facts) {
    const list = document.getElementById("fact-list");
    if (!list) return;
    list.innerHTML = '';
    if (!facts || facts.length === 0) {
        list.innerHTML = '<li class="item-row" style="color:var(--text-muted);">Няма записани факти.</li>';
        return;
    }
    facts.forEach((f, index) => {
        const li = document.createElement("li");
        li.className = "item-row";
        li.style.flexDirection = "column";
        li.style.alignItems = "flex-start";
        
        const safeContent = encodeURIComponent(f.content);

        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <span style="font-size:0.8rem; font-weight:bold; color:var(--accent-blue);">Факт #${index + 1}</span>
                <div class="item-actions">
                    <button class="btn-sm btn-secondary" onclick="toggleFactContent(this)">[+]</button>
                    <button class="btn-sm btn-danger" onclick="deleteSingleFactFromEncoded('${safeContent}')">Изтрий</button>
                </div>
            </div>
            <div class="fact-content-box" style="display:none; font-size:0.8rem; margin-top:6px; color:var(--text-main); white-space:pre-wrap; word-break:break-word;">${f.content}</div>
        `;
        list.appendChild(li);
    });
}

function toggleFactContent(btn) {
    const box = btn.parentElement.parentElement.nextElementSibling;
    if (box.style.display === 'none') {
        box.style.display = 'block';
        btn.textContent = '[-]';
    } else {
        box.style.display = 'none';
        btn.textContent = '[+]';
    }
}

function toggleSection(btnId, contentId) {
    const content = document.getElementById(contentId);
    const btn = document.getElementById(btnId);
    if (content.style.display === 'none') {
        content.style.display = 'flex';
        btn.textContent = '[-]';
    } else {
        content.style.display = 'none';
        btn.textContent = '[+]';
    }
}

async function deleteSingleFactFromEncoded(encodedContent) {
    const factContent = decodeURIComponent(encodedContent);
    if (!confirm("Сигурни ли сте, че искате да изтриете този факт?")) return;
    try {
        await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `изтрий факт: ${factContent}`, workspace: currentWorkspace })
        });
        loadWorkspaceData(currentWorkspace, currentSubfolder);
    } catch (e) {
        console.error("Грешка при изтриване на факт:", e);
    }
}

function renderChatHistory(history) {
    const container = document.getElementById("messages-container");
    if (!container) return;
    
    const indicator = document.getElementById("thinking-indicator");
    container.innerHTML = '';
    if (indicator) container.appendChild(indicator);

    if (!history || history.length === 0) return;

    history.forEach(h => {
        const row = document.createElement("div");
        row.className = `message-row ${h.sender === 'user' ? 'user' : 'niki'}`;
        
        let monologueHtml = '';
        if (h.sender === 'niki' && h.monologue) {
            monologueHtml = `
                <button class="monologue-toggle" onclick="toggleMonologue(this)">[+] Върху какво мислех...</button>
                <div class="monologue-content monologue-box">${h.monologue}</div>
            `;
        }

        let actionsHtml = '';
        if (h.sender === 'niki') {
            actionsHtml = `
               <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; align-items:center;">
                    <button class="btn-sm btn-primary" onclick="copyMessageText(this)">📋 Копирай</button>
                    <button class="btn-sm btn-success" onclick="downloadMessageFile(this, 'docx')">📥 Word</button>
                    <button class="btn-sm btn-secondary" onclick="downloadMessageFile(this, 'pdf')">📥 PDF</button>
                    <button class="btn-sm btn-secondary" onclick="shareMessageText(this)">📤 Сподели</button>
                </div>
            `;
        }

        row.innerHTML = `
            ${monologueHtml}
            <div class="bubble">${h.message}</div>
            ${actionsHtml}
            <span class="timestamp">${getLocalTimeString()}</span>
        `;
        container.appendChild(row);
    });
    container.scrollTop = container.scrollHeight;
}

function renderLibrary(files, folders, subfolder) {
    currentSubfolder = subfolder;
    const list = document.getElementById("file-list");
    const pathSpan = document.getElementById("current-path");
    if (!list) return;
    
    if (pathSpan) {
        pathSpan.innerHTML = subfolder ? `📁 /${subfolder}` : '📁 / (главна)';
    }

    list.innerHTML = '';

    if (subfolder) {
        const parentLi = document.createElement("li");
        parentLi.className = "item-row";
        parentLi.innerHTML = `<span class="folder-item" onclick="navigateUp()">⬅ [Назад]</span>`;
        list.appendChild(parentLi);
    }

    folders.forEach(folder => {
        const li = document.createElement("li");
        li.className = "item-row";
        const nextSub = subfolder ? `${subfolder}/${folder}` : folder;
        
        li.innerHTML = `
            <span class="folder-item" onclick="loadWorkspaceData('${currentWorkspace}', '${nextSub}')">📁 ${folder}</span>
            <div class="item-actions">
                <button class="btn-sm btn-danger" onclick="deleteFolder('${folder}')">Изтрий</button>
            </div>
        `;

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            li.style.background = 'var(--bg-hover, #333)';
        });

        li.addEventListener('dragleave', () => {
            li.style.background = 'transparent';
        });

        li.addEventListener('drop', async (e) => {
            e.preventDefault();
            li.style.background = 'transparent';
            
            const dataStr = e.dataTransfer.getData('text/plain');
            if (!dataStr) return;
            
            try {
                const data = JSON.parse(dataStr);
                if (data.type === 'file') {
                    const targetSubfolder = currentSubfolder ? currentSubfolder + '/' + folder : folder;
                    
                    const response = await fetch('/move_file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            workspace: currentWorkspace,
                            filename: data.name,
                            source_subfolder: data.subfolder,
                            target_subfolder: targetSubfolder
                        })
                    });
                    
                    if (response.ok) {
                        loadWorkspaceData(currentWorkspace, currentSubfolder);
                    } else {
                        const errData = await response.json();
                        alert("Грешка при преместване: " + (errData.message || 'Неизвестна грешка'));
                    }
                }
            } catch (err) {
                console.error("Drag and Drop Error:", err);
            }
        });

        list.appendChild(li);
    });

    files.forEach(file => {
        const li = document.createElement("li");
        li.className = "item-row";
        li.setAttribute('draggable', 'true');
        
        li.innerHTML = `
            <a class="file-item" href="/download/${encodeURIComponent(currentWorkspace)}/${encodeURIComponent(subfolder ? subfolder + '/' + file : file)}" target="_blank">📄 ${file}</a>
            <div class="item-actions">
                <button class="btn-sm btn-danger" onclick="deleteFile('${file}')">Изтрий</button>
            </div>
        `;

        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'file',
                name: file,
                subfolder: currentSubfolder
            }));
        });

        list.appendChild(li);
    });
}

function toggleMonologue(btn) {
    const content = btn.nextElementSibling;
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        btn.textContent = "[+] Върху какво мислех...";
    } else {
        content.classList.add('show');
        btn.textContent = "[-] Скрий монолога";
    }
}

function copyMessageText(btn) {
    const bubbleText = btn.parentElement.previousElementSibling.textContent;
    navigator.clipboard.writeText(bubbleText).then(() => {
        btn.textContent = '✅ Копирано!';
        setTimeout(() => { btn.textContent = '📋 Копирай'; }, 2000);
    });
}

async function sendMessage() {
    const textarea = document.getElementById("chat-input");
    const message = textarea.value.trim();
    const autoRun = document.getElementById("auto-run-checkbox")?.checked || false;
    
    if (!message) return;

    textarea.value = '';
    textarea.style.height = 'auto';

    appendMessageLocally('user', message);
    showThinkingIndicator();

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, workspace: currentWorkspace, auto_run: autoRun })
        });
        const data = await res.json();
        
        hideThinkingIndicator();
        appendMessageLocally('niki', data.reply, data.monologue);
        loadWorkspaceData(currentWorkspace, currentSubfolder);
    } catch (e) {
        hideThinkingIndicator();
        console.error("Грешка при изпращане на съобщение:", e);
    }
}

function appendMessageLocally(sender, message, monologue = null) {
    const container = document.getElementById("messages-container");
    if (!container) return;
    
    const row = document.createElement("div");
    row.className = `message-row ${sender === 'user' ? 'user' : 'niki'}`;
    
    let monologueHtml = '';
    if (sender === 'niki' && monologue) {
        monologueHtml = `
            <button class="monologue-toggle" onclick="toggleMonologue(this)">[+] Върху какво мислех...</button>
            <div class="monologue-content monologue-box">${monologue}</div>
        `;
    }

    let actionsHtml = '';
    if (sender === 'niki') {
        actionsHtml = `
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; align-items:center;">
                <button class="btn-sm btn-primary" onclick="copyMessageText(this)">📋 Копирай</button>
                <button class="btn-sm btn-success" onclick="downloadMessageFile(this, 'docx')">📥 Word</button>
                <button class="btn-sm btn-secondary" onclick="downloadMessageFile(this, 'pdf')">📥 PDF</button>
                <button class="btn-sm btn-secondary" onclick="shareMessageText(this)">📤 Сподели</button>
            </div>
        `;
    }

    row.innerHTML = `
        ${monologueHtml}
        <div class="bubble">${message}</div>
        ${actionsHtml}
        <span class="timestamp">${getLocalTimeString()}</span>
    `;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
}

function setQuickPrompt(text) {
    const textarea = document.getElementById("chat-input");
    if (!textarea) return;

    const currentInputText = textarea.value.trim();

    if (text === "Изтрий всичко") {
        textarea.value = '';
        textarea.style.height = 'auto';
        sendMessageUserDirect("изтрий всичко");
        return;
    }

    let finalMessage = text;
    if (currentInputText) {
        if (text.includes("Запиши факт")) {
            finalMessage = `Запиши факт: ${currentInputText}`;
        } else if (text.includes("Пеперуден ефект") || text.includes("Физичен анализ")) {
            finalMessage = `${text} върху следния елемент: ${currentInputText}`;
        } else {
            finalMessage = `${text}: ${currentInputText}`;
        }
    }

    textarea.value = '';
    textarea.style.height = 'auto';
    sendMessageUserDirect(finalMessage);
}

async function sendMessageUserDirect(msg) {
    appendMessageLocally('user', msg);
    showThinkingIndicator();

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, workspace: currentWorkspace })
        });
        const data = await res.json();
        
        hideThinkingIndicator();
        appendMessageLocally('niki', data.reply, data.monologue);
        loadWorkspaceData(currentWorkspace, currentSubfolder);
    } catch (e) {
        hideThinkingIndicator();
        console.error("Грешка:", e);
    }
}

function navigateUp() {
    const parts = currentSubfolder.split('/');
    parts.pop();
    loadWorkspaceData(currentWorkspace, parts.join('/'));
}

async function createNewFolder() {
    const folderName = prompt("Въведете име на новата папка:");
    if (!folderName) return;

    try {
        const res = await fetch('/create_folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace: currentWorkspace, subfolder: currentSubfolder, folder_name: folderName })
        });
        const data = await res.json();
        alert(data.message);
        loadWorkspaceData(currentWorkspace, currentSubfolder);
    } catch (e) {
        console.error("Грешка при създаване на папка:", e);
    }
}

async function deleteFolder(folderName) {
    if (!confirm(`Сигурни ли сте, че искате да изтриете папка '${folderName}' и цялото ѝ съдържание?`)) return;

    try {
        const res = await fetch('/delete_folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace: currentWorkspace, subfolder: currentSubfolder, folder_name: folderName })
        });
        const data = await res.json();
        alert(data.message);
        loadWorkspaceData(currentWorkspace, currentSubfolder);
    } catch (e) {
        console.error("Грешка при изтриване на папка:", e);
    }
}

async function uploadFile() {
    const fileInput = document.getElementById("file-upload-input");
    if (!fileInput.files.length) return alert("Изберете файл за качване.");

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('workspace', currentWorkspace);
    formData.append('subfolder', currentSubfolder);

    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        alert(data.message);
        fileInput.value = '';
        loadWorkspaceData(currentWorkspace, currentSubfolder);
    } catch (e) {
        console.error("Грешка при качване на файл:", e);
    }
}

async function shareMessageText(btn) {
    const bubbleText = btn.parentElement.previousElementSibling.textContent;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'N.I.K.I. Отговор',
                text: bubbleText,
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("Грешка при споделяне:", err);
            }
        }
    } else {
        navigator.clipboard.writeText(bubbleText).then(() => {
            alert("Текстът е копиран в клипборда, защото устройството не поддържа директно споделяне към външни приложения.");
        });
    }
}

async function deleteFile(filename) {
    if (!confirm(`Сигурни ли сте, че искате да изтриете файла '${filename}'?`)) return;

    try {
        const res = await fetch('/delete_file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace: currentWorkspace, subfolder: currentSubfolder, filename })
        });
        const data = await res.json();
        alert(data.message);
        loadWorkspaceData(currentWorkspace, currentSubfolder);
    } catch (e) {
        console.error("Грешка при изтриване на файл:", e);
    }
}

function toggleFullscreen() {
    const chatArea = document.getElementById("main-chat-area");
    chatArea.classList.toggle("fullscreen");
}

function setupEventListeners() {
    const textarea = document.getElementById("chat-input");
    if (textarea) {
        textarea.addEventListener("input", function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        textarea.addEventListener("keydown", (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    return;
                } else {
                    e.preventDefault();
                    sendMessage();
                }
            }
        });
    }
}

function downloadMessageFile(btn, format) {
    const bubbleText = btn.parentElement.previousElementSibling.textContent;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/download_text_file';
    form.target = '_blank';

    const textInput = document.createElement('input');
    textInput.type = 'hidden';
    textInput.name = 'text';
    textInput.value = bubbleText;
    form.appendChild(textInput);

    const wsInput = document.createElement('input');
    wsInput.type = 'hidden';
    wsInput.name = 'ws';
    wsInput.value = currentWorkspace;
    form.appendChild(wsInput);

    const formatInput = document.createElement('input');
    formatInput.type = 'hidden';
    formatInput.name = 'format';
    formatInput.value = format;
    form.appendChild(formatInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}
