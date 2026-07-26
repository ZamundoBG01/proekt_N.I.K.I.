// Индикатор за мислене за Н.И.К.И. (v2.0)
// Създава анимиран брояч, когато се очаква отговор от AI.

(function() {
    let thinkingInterval = null;
    let dotCount = 1;

    // Функция за показване на индикатора в чата
    window.showNikThinking = function() {
        const chatContainer = document.querySelector('#chat-container') || document.querySelector('.chat-messages') || document.body;
        
        // Премахваме стар индикатор, ако има такъв
        window.hideNikThinking();

        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'niki-thinking-indicator';
        thinkingDiv.style.cssText = 'padding: 10px 15px; margin: 10px 0; background: rgba(0, 255, 100, 0.1); border-left: 3px solid #00ff66; color: #fff; font-family: monospace; border-radius: 4px; width: fit-content;';
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
    };

    // Функция за скриване на индикатора, когато отговорът е готов
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
})();
