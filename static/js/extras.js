// ==========================================
// N.I.K.I. EXTRAS: Факти, Шаблони и Влачене
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("N.I.K.I. Extras модулът е зареден успешно!");
    
    // Тук добавяме слушатели или начални настройки, ако е нужно
    initTemplatesAndExtras();
});

function initTemplatesAndExtras() {
    // Създаваме бутон за шаблони до полето за добавяне на факти, ако вече го няма
    const factsHeader = document.querySelector("#facts-section-header") || document.querySelector(".facts-container") || document.body;
    
    // Проверяваме дали бутонът за шаблони вече съществува
    if (!document.getElementById("btn-fact-templates")) {
        const templateBtn = document.createElement("button");
        templateBtn.id = "btn-fact-templates";
        templateBtn.className = "btn-sm btn-secondary";
        templateBtn.style.margin = "5px 0";
        templateBtn.textContent = "📂 Готови шаблони за факти";
        templateBtn.onclick = showFactTemplatesModal;
        
        // Поставяме го на удобно място (например най-горе в секцията с факти)
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
            alert(`Шаблонът '${choice'}' е зареден успешно! Можеш да го редактираш и запишеш.`);
        } else {
            alert(templates[choice]);
        }
    } else if (choice) {
        alert("Непознат шаблон. Моля, изберете точно име от списъка.");
    }
}
