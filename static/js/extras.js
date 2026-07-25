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
    const choice = prompt(
        "Изберете шаблон с цифра:\n" +
        "1 - Маршрути\n" +
        "2 - Технически данни\n" +
        "3 - Общи бележки"
    );

    if (!choice) return;

    let selectedText = "";
    let templateName = "";

    if (choice.trim() === "1") {
        selectedText = "Шаблон за Маршрут:\n1. Начална точка:\n2. Междинни спирки:\n3. Крайна дестинация:\n4. Времетраене и особености:";
        templateName = "Маршрути";
    } else if (choice.trim() === "2") {
        selectedText = "Шаблон за Технически данни:\n- Име на модула:\n- Версия:\n- Параметри и изисквания:\n- Бележки:";
        templateName = "Технически данни";
    } else if (choice.trim() === "3") {
        selectedText = "Шаблон за Общи бележки:\n- Дата:\n- Основна тема:\n- Решения и задачи:";
        templateName = "Общи бележки";
    } else {
        alert("Невалиден избор. Моля, въведете 1, 2 или 3.");
        return;
    }

    const contentArea = document.getElementById("fact-content-input") || document.getElementById("chat-input");
    if (contentArea) {
        contentArea.value = selectedText;
        contentArea.focus();
        alert(`Шаблонът '${templateName}' е зареден успешно!`);
    } else {
        alert(selectedText);
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
