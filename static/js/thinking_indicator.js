// Компактен индикатор за мислене за Н.И.К.И.
(function() {
    let thinkingInterval = null;

    window.showNikThinking = function() {
        window.hideNikThinking();

        // Търсим точното място където се показват съобщенията в чата
        const chatContainer = document.querySelector('#messages-container') || document.querySelector('.chat-messages') || document.querySelector('#chat-container') || document.querySelector('main');
        if (!chatContainer) return;

        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'niki-thinking-indicator';
        thinkingDiv.style.cssText = 'display: inline-block; padding: 6px 12px; margin: 10px 0; background: rgba(0, 255, 100, 0.15); border: 1px solid #00ff66; color: #00ff66; font-family: monospace; font-size: 13px; border-radius: 6px; width: fit-content; clear: both; box-shadow: 0 2px 5px rgba(0,0,0,0.2);';
        thinkingDiv.innerHTML = '⚙️ Н.И.К.И. мисли... (<span id="thinking-timer">1</span>s)';
        
        chatContainer.appendChild(thinkingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        let seconds = 1;
        thinkingInterval = setInterval(() => {
            seconds++;
            const timerSpan = document.getElementById('thinking-timer');
            if (timerSpan) timerSpan.innerText = seconds;
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

    // Автоматично засичане при клик или Enter ( с изключение за бутоните за сваляне)
    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('click', (e) => {
            if (e.target && (e.target.matches('button') || e.target.closest('button'))) {
                const btn = e.target.matches('button') ? e.target : e.target.closest('button');
                
                // ИЗКЛЮЧЕНИЕ: Ако се цъка бутон за Word, PDF или сваляне, НЕ пускай таймера
                const btnText = btn.innerText.toLowerCase();
                if (btnText.includes('word') || btnText.includes('pdf') || btnText.includes('свали') || btnText.includes('download')) {
                    return; 
                }

                if (btn.innerText.includes('Изпрати') || btn.classList.contains('btn-success') || btn.id.includes('send')) {
                    setTimeout(window.showNikThinking, 100);
                }
            }
        });

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
