class AIVoiceCommandDemo {
    constructor(apiKey) {
        this.API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
        const HF_API_KEY = config.API_KEY;
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.synthesis = window.speechSynthesis;
        this.setupRecognition();
        this.bindElements();
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.lang = 'nl-NL';
        this.recognition.interimResults = false;

        this.recognition.onresult = async (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            this.displayRecognizedText(command);
            await this.processWithAI(command);
        };
    }

    async processWithAI(text) {
        try {
            const response = await fetch(this.API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: text }),
            });

            const result = await response.json();
            const aiResponse = this.formatAIResponse(result[0].generated_text);
            
            this.displayAIResponse(aiResponse);
            this.speakResponse(aiResponse);
            this.updateARVisualization(aiResponse);
        } catch (error) {
            console.error("AI Processing Error:", error);
        }
    }

    speakResponse(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nl-NL';
        utterance.pitch = 1;
        utterance.rate = 1;
        this.synthesis.speak(utterance);
    }

    formatAIResponse(response) {
        // Vertaal Engelse responses naar Nederlands en pas ze aan voor AR context
        const translations = {
            "open menu": "Menu wordt geopend in je AR-weergave",
            "take photo": "Foto wordt gemaakt met je AR-bril",
            "start video": "Video-opname gestart in AR-modus",
            "zoom in": "Inzoomen met AR-weergave",
            "zoom out": "Uitzoomen met AR-weergave"
        };

        return translations[response.toLowerCase()] || response;
    }

    updateARVisualization(response) {
        const arVisualization = document.querySelector('.ar-visualization');
        // Update de AR-preview op basis van het commando
        arVisualization.innerHTML = `
            <div class="ar-effect animate__animated animate__fadeIn">
                <model-viewer 
                    src="models/ar-command-${this.getCommandType(response)}.glb"
                    camera-controls
                    auto-rotate
                    ar>
                </model-viewer>
            </div>
        `;
    }

    getCommandType(response) {
        // Bepaal welk 3D-model te laden op basis van het commando
        if (response.includes("menu")) return "menu";
        if (response.includes("foto")) return "camera";
        if (response.includes("video")) return "video";
        if (response.includes("zoom")) return "zoom";
        return "default";
    }

    bindElements() {
        this.startButton = document.querySelector('.start-demo-btn');
        this.indicator = document.querySelector('.voice-indicator');
        this.statusText = document.querySelector('.status-text');
        this.recognizedTextDiv = document.querySelector('.recognized-text');
        this.arVisualization = document.querySelector('.ar-visualization');

        this.startButton.addEventListener('click', () => this.startListening());
    }

    startListening() {
        this.indicator.classList.add('active');
        this.statusText.textContent = 'Luisteren...';
        this.recognition.start();
    }

    displayRecognizedText(text) {
        this.recognizedTextDiv.textContent = `Herkend commando: "${text}"`;
    }

    displayAIResponse(response) {
        this.recognizedTextDiv.textContent = `AI-respons: "${response}"`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AIVoiceCommandDemo();
}); 