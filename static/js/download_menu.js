// ==========================================
// МОДУЛ 1: ПОЧИСТВАНЕ НА ШЛЬОКАВИЦИ (LaTeX стрелки)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.innerHTML && node.innerHTML.includes('\\rightarrow')) {
                        node.innerHTML = node.innerHTML.replace(/\\rightarrow/g, '→');
                    }
                    node.querySelectorAll('*').forEach(el => {
                        if (el.innerHTML && el.innerHTML.includes('\\rightarrow')) {
                            el.innerHTML = el.innerHTML.replace(/\\rightarrow/g, '→');
                        }
                    });
                }
            });
        });
    });
    
    const chatContainer = document.getElementById('messages-container');
    if (chatContainer) {
        observer.observe(chatContainer, { childList: true, subtree: true });
    }
});


// ==========================================
// МОДУЛ 2: ПАДАЩО МЕНЮ ЗА ИЗТЕГЛЯНЕ (Google Docs стил - Скрито POST формулярче)
// ==========================================
function toggleDownloadMenu(event, btn) {
    event.stopPropagation();
    
    document.querySelectorAll('.download-dropdown-menu').forEach(m => m.remove());

    const messageText = btn.getAttribute('data-message') || '';

    const dropdown = document.createElement('div');
    dropdown.className = 'download-dropdown-menu';
    dropdown.style.position = 'absolute';
    dropdown.style.background = 'var(--bg-panel, #222)';
    dropdown.style.border = '1px solid var(--border-color, #444)';
    dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    dropdown.style.borderRadius = '6px';
    dropdown.style.padding = '6px 0';
    dropdown.style.zIndex = '1000';
    dropdown.style.minWidth = '220px';

    dropdown.innerHTML = `
        <div style="padding: 6px 14px; font-size: 0.75rem; color: var(--text-muted, #888); border-bottom: 1px solid var(--border-color, #333);">ИЗТЕГЛЯНЕ НА ФАЙЛ</div>
        <div class="dropdown-item docx-btn" style="padding: 8px 14px; cursor: pointer; font-size: 0.85rem; color: var(--text-main, #fff);">📄 Microsoft Word (.docx)</div>
        <div class="dropdown-item pdf-btn" style="padding: 8px 14px; cursor: pointer; font-size: 0.85rem; color: var(--text-main, #fff);">📑 PDF документ (.pdf)</div>
    `;

    dropdown.querySelector('.docx-btn').onclick = () => submitExportForm(messageText, 'docx');
    dropdown.querySelector('.pdf-btn').onclick = () => submitExportForm(messageText, 'pdf');

    const rect = btn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';

    document.body.appendChild(dropdown);

    const closeMenu = (e) => {
        if (!dropdown.contains(e.target) && e.target !== btn) {
            dropdown.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
}

function submitExportForm(text, format) {
    document.querySelectorAll('.download-dropdown-menu').forEach(m => m.remove());
    
    const endpoint = format === 'pdf' ? '/download_pdf_new' : '/download_docx_new';
    const currentWs = typeof currentWorkspace !== 'undefined' ? currentWorkspace : 'general';

    // Създаваме временна скритост форма, която праща POST заявка с пълен обем текст без лимити в URL-а
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = endpoint;
    form.target = '_blank';

    const textInput = document.createElement('input');
    textInput.type = 'hidden';
    textInput.name = 'text';
    textInput.value = text;
    form.appendChild(textInput);

    const wsInput = document.createElement('input');
    wsInput.type = 'hidden';
    wsInput.name = 'ws';
    wsInput.value = currentWs;
    form.appendChild(wsInput);

    document.body.appendChild(form);
    form.submit();
    form.remove();
}


// ==========================================
// МОДУЛ 3: УПРАВЛЕНИЕ НА ИЗЧИСТВАНЕТО И КОШЧЕТО ЗА ФАКТИ
// ==========================================
function confirmClearChat() {
    if (confirm("Сигурни ли сте, че искате да изчистите чата? Това ще премахсне съобщенията от екрана.")) {
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = "Изтрий всичко";
            const sendBtn = document.querySelector('.btn-send');
            if (sendBtn) sendBtn.click();
        }
    }
}

async function deleteAllFacts() {
    if (!confirm("Сигурни ли сте, че искате да изтриете ВСИЧКИ проверени факти и закони в този проект?")) {
        return;
    }
    
    try {
        const ws = typeof currentWorkspace !== 'undefined' ? currentWorkspace : 'general';
        const response = await fetch('/delete_all_facts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ws: ws })
        });
        
        if (response.ok) {
            if (typeof loadFacts === 'function') {
                loadFacts();
            } else {
                location.reload();
            }
        } else {
            alert("Възникна грешка при изтриването на фактите.");
        }
    } catch (e) {
        console.error("Грешка:", e);
        alert("Грешка при връзка със сървъра.");
    }
}
