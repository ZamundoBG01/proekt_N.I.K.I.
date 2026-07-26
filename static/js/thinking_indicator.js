// Поправен индикатор за мислене за Н.И.К.И. (v2.1)
(function() {
    let thinkingInterval = null;
    let dotCount = 1;

    function showNikThinking() {
        // Проверяваме дали вече има индикатор, за да не го дублираме
        if (document.getElementById('niki-thinking-indicator')) return;

        // Търсим точното място на чата (където се появяват съобщенията)
        // Проверяваме за стандартни контейнери в твоя интерфейс
        const chatContainer = document.querySelector('.chat-messages') || document.querySelector('#chat-container') || document.querySelector('main');
        
        if (!chatContainer) return;

        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'niki-thinking-indicator';
        // Стил, който го прави да изглежда като нормално съобщение в чата отляво
        thinkingDiv.style.cssText = 'padding: 10px 15px; margin: 15px 0; background: rgba(0, 255, 100, 0.08); border-left: 3px solid #00ff66; color: #fff; font-family: monospace; border-radius: 4px; width: fit-content; max-width: 80%; display: block; clear: both;';
        thinkingDiv.innerHTML = '<strong>Н.И.К.И. мисли</strong> <span id="thinking-dots">.</span> (<span id="thinking-timer">1</span>s)';
        
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
        const sendButtons = document.querySelectorAll('button, input[type="submit"]');
        sendButtons.forEach(btn => {
            if (btn.innerText.includes('Изпрати') || btn.id.includes('send') || btn.className.includes('send') || btn.classList.contains('btn-success')) {
                btn.addEventListener('click', () => {
                    // Малко закъснение, за да улови началото на заявката
                    setTimeout(showNikThinking, 100);
                    setTimeout(hideNikThinking, 45000); // Предпазна мрежа
                });
            }
        });

        const inputs = document.querySelectorAll('textarea, input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    setTimeout(showNikThinking, 100);
                    setTimeout(hideNikThinking, 45000);
                }
            });
        });
    });

    // Глобални функции за ръчно управление при нужда
    window.showNikThinking = showNikThinking;
    window.hideNikThinking = hideNikThinking;
})();
