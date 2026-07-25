// Нова изолирана логика за падащото меню за изтегляне в стил Google Docs

function toggleDownloadMenu(event, btn) {
    event.stopPropagation();
    
    // Затваряме други отворени менюта
    document.querySelectorAll('.download-dropdown-menu').forEach(m => m.remove());

    // Взимаме текста сигурно от dataset
    const messageText = btn.getAttribute('data-message') || '';
    const encodedText = encodeURIComponent(messageText);

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
        <div style="border-top: 1px solid var(--border-color, #333); margin: 4px 0;"></div>
        <div class="dropdown-item docx-save-btn" style="padding: 8px 14px; cursor: pointer; font-size: 0.85rem; color: var(--accent-blue, #4a90e2);">💾 Запази в папка... (.docx)</div>
        <div class="dropdown-item pdf-save-btn" style="padding: 8px 14px; cursor: pointer; font-size: 0.85rem; color: var(--accent-blue, #4a90e2);">💾 Запази в папка... (.pdf)</div>
    `;

    // Закачаме събитията сигурно чрез JS (без рискове от счупване с кавички)
    dropdown.querySelector('.docx-btn').onclick = () => handleExport(encodedText, 'docx', false);
    dropdown.querySelector('.pdf-btn').onclick = () => handleExport(encodedText, 'pdf', false);
    dropdown.querySelector('.docx-save-btn').onclick = () => handleExport(encodedText, 'docx', true);
    dropdown.querySelector('.pdf-save-btn').onclick = () => handleExport(encodedText, 'pdf', true);

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

async function handleExport(encodedText, format, saveAsPrompt) {
    document.querySelectorAll('.download-dropdown-menu').forEach(m => m.remove());
    
    const text = decodeURIComponent(encodedText);
    const endpoint = format === 'pdf' ? '/download_pdf_new' : '/download_docx_new';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, ws: typeof currentWorkspace !== 'undefined' ? currentWorkspace : 'general' })
        });
        
        if (!response.ok) throw new Error("Грешка при генериране на файла.");
        const blob = await response.blob();
        
        const filename = `document.${format === 'pdf' ? 'pdf' : 'docx'}`;

        // Ако браузърът поддържа избор на папка (Запази в...)
        if (saveAsPrompt && window.showSaveFilePicker) {
            try {
                const options = {
                    suggestedName: filename,
                    types: [{
                        description: format === 'pdf' ? 'PDF документ' : 'Word документ',
                        accept: {
                            [format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']: [`.${format}`]
                        }
                    }]
                };
                const handle = await window.showSaveFilePicker(options);
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return;
            } catch (err) {
                if (err.name === 'AbortError') return; // Потребителят е отказал
            }
        }

        // Стандартно сваляне
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (e) {
        console.error("Грешка:", e);
        alert("Възникна грешка при изтеглянето на файла.");
    }
}
