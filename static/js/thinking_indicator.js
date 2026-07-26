// Индикатор за мислене с таймер за Н.И.К.И.
(function() {
    let thinkingInterval = null;

    window.showNikThinking = function() {
        window.hideNikThinking();

        // Търсим контейнера за съобщения в твоя интерфейс
        const chatContainer = document.querySelector('.chat-messages') || document.querySelector('#chat-container') || document.querySelector('main') || document.body;
        if (!chatContainer) return;

        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'niki-thinking-indicator';
        thinkingDiv.style.cssText = 'padding: 10px 15px; margin: 10px 0; background: rgba(0, 255, 100, 0.1); border-left: 3px solid #00ff66; color: #fff; font-family: monospace; border-radius: 4px; width: fit-content; display: block; clear: both;';
        thinkingDiv.innerHTML = 'Н.И.К.И. мисли <span id="thinking-dots">.</span> (<span id="thinking-timer">1</span>s)';
        
        chatContainer.appendChild(thinkingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        let seconds = 1;
        let dotCount = 1;
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
    };

    window.hideNikThinking = function() {
        if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
        }
        const existing = document.getElementById('niki-thinking-indicator');
        if (existing) {
            existing.remove();
        }
    };

    // Автоматично засичане при клик на зеления бутон "Изпрати" или натисканe на Enter
    document.addEventListener('DOMContentLoaded', () => {
        // Следим за клик върху бутона за изпращане
        document.addEventListener('click', (e) => {
            if (e.target && (e.target.matches('button') || e.target.closest('button'))) {
                const btn = e.target.matches('button') ? e.target : e.target.closest('button');
                if (btn.innerText.includes('Изпрати') || btn.classList.contains('btn-success') || btn.id.includes('send')) {
                    setTimeout(window.showNikThinking, 100);
                }
            }
        });

        // Следим за натискане на Enter в полето за писане
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeEl = document.activeElement;
                if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
                    setTimeout(window.showNikThinking, 100);
                }
            }
        });
    });
})();
