// Индикатор за мислене и напредък за Н.И.К.И. (v2.2)
(function() {
    let thinkingInterval = null;

    function showNikThinking() {
        // Премахваме стар индикатор, ако има такъв
        hideNikThinking();

        // Търсим контейнера за чат
        const chatContainer = document.querySelector('.chat-messages') || document.querySelector('#chat-container') || document.querySelector('main');
        if (!chatContainer) return;

        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'niki-thinking-indicator';
        thinkingDiv.style.cssText = 'padding: 10px 15px; margin: 15px 0; background: rgba(0, 255, 100, 0.08); border-left: 3px solid #00ff66; color: #fff; font-family: monospace; border-radius: 4px; width: fit-content; max-width: 80%; display: block; clear: both;';
        thinkingDiv.innerHTML = '<strong>Н.И.К.И. обработва задачата</strong> <span id="thinking-progress">0%</span> (Изминати: <span id="thinking-timer">0</span>s)';
        
        chatContainer.appendChild(thinkingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        let seconds = 0;
        let progress = 0;

        thinkingInterval = setInterval(() => {
            seconds++;
            // Симулираме прогрес, който бавно расте (достига до 99% и чака реалния отговор)
            if (progress < 95) {
                progress += Math.floor(Math.random() * 5) + 1; // качва се с 1 до 5% на всяка секунда
                if (progress > 95) progress = 95;
            }

            const timerSpan = document.getElementById('thinking-timer');
            const progressSpan = document.getElementById('thinking-progress');
            
            if (timerSpan) timerSpan.innerText = seconds;
            if (progressSpan) progressSpan.innerText = progress + '%';
        }, 1000);
    }

    function hideNikThinking() {
        if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
        }
        const existing = document.getElementById('niki-thinking-indicator');
        if (existing) {
            existing.remove();
        }
    }

    // Слушаме директно за изпращане на съобщение
    document.addEventListener('DOMContentLoaded', () => {
        // Хващаме клика върху бутона за изпращане
        const sendButtons = document.querySelectorAll('button, input[type="submit"]');
        sendButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Пускаме индикатора веднага щом потребителят кликне
                setTimeout(showNikThinking, 50);
            });
        });

        // Хващаме натискането на Enter в полетата за писане
        const inputs = document.querySelectorAll('textarea, input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    setTimeout(showNikThinking, 50);
                }
            });
        });
    });

    // Глобални функции, за да може и основният код да ги скрива, когато отговорът е готов
    window.showNikThinking = showNikThinking;
    window.hideNikThinking = hideNikThinking;
})();
