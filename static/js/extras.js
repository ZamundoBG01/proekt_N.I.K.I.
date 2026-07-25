// ==========================================
// N.I.K.I. EXTRAS: Факти, Шаблони и Преместване
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("N.I.K.I. Extras модулът е зареден успешно!");
    initTemplatesAndExtras();
});

function initTemplatesAndExtras() {
    const factsHeader = document.querySelector("#facts-section-header") || document.querySelector(".facts-container") || document.body;
    
    // Проверяваме дали бутонът за шаблони вече съществува
    if (!document.getElementById("btn-fact-templates")) {
        const templateBtn = document.createElement("button");
        templateBtn.id = "btn-fact-templates";
        templateBtn.className = "btn-sm btn-secondary";
        templateBtn.style.margin = "5px 0";
        templateBtn.textContent = "📂 Готови шаблони за факти";
        templateBtn.onclick = showFactTemplatesModal;
        
        const targetArea = document.getElementById("facts-list") || factsHeader;
        if (targetArea && targetArea.parentNode) {
            targetArea.parentNode.insertBefore(templateBtn, targetArea);
        }
    }
}

// Меню/Прозорец с готови шаблони за факти в различни папки
function showFactTemplatesModal() {
    const templates = {
        "Маршрути": "Шаблон за Маршрут:\n1. Начална точка:\n2. Междинни спирки:\n3. Крайна дестинация:\n4. Времетраене и особености:",
        "Технически данни": "Шаблон за Технически данни:\n- Име на модула:\n- Версия:\n- Параметри и изисквания:\n- Бележки:",
        "Общи бележки": "Шаблон за Бележки:\n- Дата:\n- Основна тема:\n- Решения и задачи:"
    };

    let choice = prompt("Избери шаблон за факт:\n1. Маршрути\n2. Технически данни\n3. Общи бележки\n\nНапиши името на шаблона (Маршрути, Технически данни или Общи бележки):");
    
    if (choice && templates[choice]) {
        const contentArea = document.getElementById("fact-content-input") || document.getElementById("chat-input");
        if (contentArea) {
            contentArea.value = templates[choice];
            alert(`Шаблонът '${choice}' е зареден успешно! Можеш да го редактираш и запишеш.`);
        } else {
            alert(templates[choice]);
        }
    } else if (choice) {
        alert("Непознат шаблон. Моля, изберете точно име от списъка.");
    }
}

// ==========================================
// Функция за преместване на файл в друг проект
// ==========================================
document.addEventListener("click", async (e) => {
    if (e.target && e.target.classList.contains("btn-move-file")) {
        const filename = e.target.getAttribute("data-filename");
        const subfolder = e.target.getAttribute("data-subfolder") || "";
        
        try {
            const res = await fetch('/workspaces');
            const data = await res.json();
            
            if (!data.workspaces || data.workspaces.length === 0) {
                alert("Няма други проекти.");
                return;
            }
            
            let wsList = data.workspaces.filter(ws => ws !== currentWorkspace);
            if (wsList.length === 0) {
                alert("Няма други проекти, в които да преместите файла.");
                return;
            }
            
            let promptText = "Изберете целеви проект за преместване:\n" + wsList.map((ws, i) => `${i + 1}. ${ws}`).join("\n");
            let choice = prompt(promptText);
            
            if (!choice) return;
            
            let targetWorkspace = wsList[parseInt(choice) - 1] || choice.trim();
            
            if (!data.workspaces.includes(targetWorkspace)) {
                alert("Невалиден проект!");
                return;
            }
            
            const response = await fetch('/move_file_workspace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_workspace: currentWorkspace,
                    target_workspace: targetWorkspace,
                    filename: filename,
                    subfolder: subfolder
                })
            });
            
            if (response.ok) {
                alert(`Файлът '${filename}' беше преместен успешно в проект '${targetWorkspace.toUpperCase()}'!`);
                if (typeof loadWorkspaceData === 'function') {
                    loadWorkspaceData(currentWorkspace, currentSubfolder);
                } else {
                    location.reload();
                }
            } else {
                const errData = await response.json();
                alert("Грешка при преместване: " + (errData.message || 'Неизвестна грешка'));
            }
            
        } catch (err) {
            console.error("Грешка при преместване на файл:", err);
        }
    }
});
