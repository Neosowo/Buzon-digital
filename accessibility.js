// ============================================
// ACCESSIBILITY MODULE
// ============================================

const AccessibilitySystem = {
    // Settings
    settings: {
        highContrast: false,
        fontSize: 100, // percentage
        textToSpeech: false,
        voiceInput: false
    },

    // Voice recording
    mediaRecorder: null,
    audioChunks: [],

    /**
     * Initialize accessibility system
     */
    init() {
        this.loadSettings();
        this.applySettings();
        this.setupControls();
    },

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    },

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
    },

    /**
     * Apply accessibility settings
     */
    applySettings() {
        // High contrast mode
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }

        // Font size
        document.documentElement.style.fontSize = `${this.settings.fontSize}%`;
    },

    /**
     * Toggle high contrast mode
     */
    toggleHighContrast() {
        this.settings.highContrast = !this.settings.highContrast;
        this.applySettings();
        this.saveSettings();
    },

    /**
     * Increase font size
     */
    increaseFontSize() {
        if (this.settings.fontSize < 150) {
            this.settings.fontSize += 10;
            this.applySettings();
            this.saveSettings();
        }
    },

    /**
     * Decrease font size
     */
    decreaseFontSize() {
        if (this.settings.fontSize > 80) {
            this.settings.fontSize -= 10;
            this.applySettings();
            this.saveSettings();
        }
    },

    /**
     * Reset font size
     */
    resetFontSize() {
        this.settings.fontSize = 100;
        this.applySettings();
        this.saveSettings();
    },

    /**
     * Read text aloud using Web Speech API
     * @param {string} text - Text to read
     */
    readText(text) {
        if (!('speechSynthesis' in window)) {
            alert('Tu navegador no soporta texto a voz');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        window.speechSynthesis.speak(utterance);
    },

    /**
     * Stop reading text
     */
    stopReading() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    },

    /**
     * Start voice recording
     */
    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.addEventListener('dataavailable', event => {
                this.audioChunks.push(event.data);
            });

            this.mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Show audio player
                this.showAudioPlayer(audioUrl);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            });

            this.mediaRecorder.start();
            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('No se pudo acceder al micrófono');
            return false;
        }
    },

    /**
     * Stop voice recording
     */
    stopVoiceRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    },

    /**
     * Show audio player
     * @param {string} audioUrl - Audio URL
     */
    showAudioPlayer(audioUrl) {
        const player = document.getElementById('audioPlayer');
        if (player) {
            player.src = audioUrl;
            player.classList.remove('hidden');
        }
    },

    /**
     * Setup accessibility controls
     */
    setupControls() {
        // Add event listeners for accessibility buttons
        const highContrastBtn = document.getElementById('toggleHighContrast');
        const fontIncreaseBtn = document.getElementById('increaseFontSize');
        const fontDecreaseBtn = document.getElementById('decreaseFontSize');
        const fontResetBtn = document.getElementById('resetFontSize');

        if (highContrastBtn) {
            highContrastBtn.addEventListener('click', () => this.toggleHighContrast());
        }

        if (fontIncreaseBtn) {
            fontIncreaseBtn.addEventListener('click', () => this.increaseFontSize());
        }

        if (fontDecreaseBtn) {
            fontDecreaseBtn.addEventListener('click', () => this.decreaseFontSize());
        }

        if (fontResetBtn) {
            fontResetBtn.addEventListener('click', () => this.resetFontSize());
        }

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + + : Increase font
            if (e.ctrlKey && e.key === '+') {
                e.preventDefault();
                this.increaseFontSize();
            }

            // Ctrl + - : Decrease font
            if (e.ctrlKey && e.key === '-') {
                e.preventDefault();
                this.decreaseFontSize();
            }

            // Ctrl + 0 : Reset font
            if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                this.resetFontSize();
            }
        });
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AccessibilitySystem.init();
    });
} else {
    AccessibilitySystem.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilitySystem;
}
