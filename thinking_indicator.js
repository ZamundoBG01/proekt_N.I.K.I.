// Автоматичен индикатор за мислене за Н.И.К.И. (v2.0)
(function() {
    let thinkingInterval = null;
    let dotCount = 1;

    function showNikThinking() {
        // Проверяваме дали вече има индикатор, за да не го дублираме
        if (document.getElementById('niki-thinking-indicator')) return;

        // Търсим контейнера за чат по стандартните имена на класове или ID-та
        const chatContainer = document.querySelector('#chat-container') || document.querySelector('.chat-messages') || document.querySelector('main') || document.body;
        
        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'niki-thinking-indicator';
        thinkingDiv.style.cssText = 'padding: 10px 15px; margin: 10px 0; background: rgba(0, 255, 100, 0.1); border-left: 3px solid #00ff66; color: #fff; font-family: monospace; border-radius: 4px; width: fit-content; z-index: 9999;';
        thinkingDiv.innerHTML = 'Н.И.К.И. мисли <span id="thinking-dots">.</span> (<span id="thinking-timer">1</span>s)';
        
        chatContainer.appendChild(thinkingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        let seconds = 1;
        thinkingInterval = setInterval(() => {
            seconds++;
            const timerSpan = document.getElementById('thinking-timer');
            const dotsSpan = document.getElementById('thinking-dots');
            
            if (timerSpan) timerSpan.innerText = seconds;
            
            if (dotsSpan) {
                dotCount = (dotCount % 3) + 1;
                dotsSpan.innerText = '.'.repeat(dotCount);
            }
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

    // Автоматично засичане при клик на бутона "Изпрати" или натискане на Enter
    document.addEventListener('DOMContentLoaded', () => {
        // Търсим всички възможни бутони за изпращане
        const sendButtons = document.querySelectorAll('button, input[type="submit"]');
        sendButtons.forEach(btn => {
            if (btn.innerText.includes('Изпрати') || btn.id.includes('send') || btn.className.includes('send')) {
                btn.addEventListener('click', () => {
                    showNikThinking();
                    // Скриваме го автоматично след максимум 30 секунди за сигурност
                    setTimeout(hideNikThinking, 30000);
                });
            }
        });

        // Следим и за натискане на Enter в полето за въвеждане
        const inputs = document.querySelectorAll('textarea, input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    showNikThinking();
                    setTimeout(hideNikThinking, 30000);
                }
            });
        });
    });

    // Излагаме глобално функциите, ако поискаме да ги управляваме ръчно от други скриптове
    window.showNikThinking = showNikThinking;
    window.hideNikThinking = hideNikThinking;
})();
