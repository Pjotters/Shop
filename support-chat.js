class SupportChat {
    constructor() {
        this.bindElements();
        this.setupEventListeners();
        this.initializeAR();
        this.messages = [];
    }

    bindElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.arDemoButton = document.getElementById('arDemoButton');
        this.arPreview = document.getElementById('arPreview');
        this.actionButtons = document.querySelectorAll('.action-btn');
        this.featureButtons = document.querySelectorAll('.feature-btn');
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.arDemoButton.addEventListener('click', () => this.toggleARPreview());
        
        this.actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAction(e.target.dataset.action));
        });
        
        this.featureButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.demonstrateFeature(e.target.dataset.feature));
        });
    }

    initializeAR() {
        // Initialiseer AR componenten
        this.arActive = false;
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';

        // Simuleer agent antwoord
        setTimeout(() => {
            this.handleAgentResponse(message);
        }, 1000);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} animate__animated animate__fadeIn`;
        messageDiv.textContent = text;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    handleAgentResponse(userMessage) {
        // Simuleer intelligente responses
        const response = this.generateResponse(userMessage);
        this.addMessage(response, 'agent');
    }

    generateResponse(userMessage) {
        const responses = {
            setup: "Ik kan je helpen met de setup. Laat me je door het proces leiden met een AR-demonstratie.",
            battery: "Je batterij gaat ongeveer 8 uur mee bij normaal gebruik. Hier zijn enkele tips om dit te optimaliseren.",
            display: "Het OLED-display heeft een resolutie van 1920x1080. Laat me je de verschillende weergavemodi tonen.",
            default: "Ik help je graag verder. Wat wil je precies weten over de ZipZop AR-bril?"
        };

        for (const [key, response] of Object.entries(responses)) {
            if (userMessage.toLowerCase().includes(key)) {
                return response;
            }
        }
        return responses.default;
    }

    toggleARPreview() {
        this.arActive = !this.arActive;
        this.arPreview.classList.toggle('active');
        this.arDemoButton.textContent = this.arActive ? 'Stop AR Demo' : 'Start AR Demo';
    }

    handleAction(action) {
        const actions = {
            setup: () => {
                this.addMessage("Laat me je helpen met de setup van je ZipZop AR-bril", "agent");
                this.toggleARPreview();
            },
            calibrate: () => {
                this.addMessage("Volg deze stappen voor perfecte kalibratie:", "agent");
                this.showCalibrationSteps();
            },
            battery: () => {
                this.addMessage("Hier zijn enkele batterij optimalisatie tips:", "agent");
                this.showBatteryTips();
            },
            connect: () => {
                this.addMessage("Verbinding maken is eenvoudig. Ik laat je zien hoe:", "agent");
                this.showConnectionGuide();
            }
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    demonstrateFeature(feature) {
        // Implementeer specifieke AR-demonstraties voor elke feature
        this.toggleARPreview();
        this.addMessage(`Demonstratie van ${feature} feature wordt geladen...`, "agent");
    }

    showCalibrationSteps() {
        const steps = [
            "1. Zet de bril op",
            "2. Kijk recht vooruit",
            "3. Volg de blauwe stip met je ogen",
            "4. Wacht op de bevestiging"
        ];
        
        steps.forEach((step, index) => {
            setTimeout(() => {
                this.addMessage(step, "agent");
            }, index * 1000);
        });
    }

    showBatteryTips() {
        const tips = [
            "🔋 Gebruik de energiebesparende modus",
            "🌙 Activeer automatische helderheid",
            "📱 Sluit ongebruikte apps",
            "⚡ Laad op bij 20% voor optimale levensduur"
        ];
        
        tips.forEach((tip, index) => {
            setTimeout(() => {
                this.addMessage(tip, "agent");
            }, index * 1000);
        });
    }

    showConnectionGuide() {
        const steps = [
            "1. Open de ZipZop app",
            "2. Scan de QR-code op je bril",
            "3. Bevestig de verbinding",
            "4. Klaar voor gebruik!"
        ];
        
        steps.forEach((step, index) => {
            setTimeout(() => {
                this.addMessage(step, "agent");
            }, index * 1000);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SupportChat();
}); 