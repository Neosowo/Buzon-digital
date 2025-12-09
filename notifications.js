// ============================================
// NOTIFICATIONS MODULE
// ============================================

const NotificationSystem = {
    // Notification preferences
    preferences: {
        enabled: true,
        newResponse: true,
        appointments: true,
        achievements: true,
        dailyCheckin: true,
        doNotDisturb: {
            enabled: false,
            start: '22:00',
            end: '08:00'
        }
    },

    /**
     * Initialize notification system
     */
    init() {
        this.loadPreferences();
        this.requestPermission();
        this.setupDailyCheckin();
    },

    /**
     * Load preferences from localStorage
     */
    loadPreferences() {
        const saved = localStorage.getItem('notificationPreferences');
        if (saved) {
            this.preferences = { ...this.preferences, ...JSON.parse(saved) };
        }
    },

    /**
     * Save preferences to localStorage
     */
    savePreferences() {
        localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
    },

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    /**
     * Check if we're in Do Not Disturb period
     */
    isDoNotDisturb() {
        if (!this.preferences.doNotDisturb.enabled) return false;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const { start, end } = this.preferences.doNotDisturb;

        // Handle overnight periods (e.g., 22:00 to 08:00)
        if (start > end) {
            return currentTime >= start || currentTime < end;
        }

        return currentTime >= start && currentTime < end;
    },

    /**
     * Send a notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     */
    async send(title, options = {}) {
        if (!this.preferences.enabled) return;
        if (this.isDoNotDisturb()) return;

        const hasPermission = await this.requestPermission();
        if (!hasPermission) return;

        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        notification.onclick = () => {
            window.focus();
            notification.close();
            if (options.onClick) options.onClick();
        };

        return notification;
    },

    /**
     * Notify about new counselor response
     * @param {string} trackingCode - Message tracking code
     */
    notifyNewResponse(trackingCode) {
        if (!this.preferences.newResponse) return;

        this.send('Nueva Respuesta 💬', {
            body: `El consejero ha respondido a tu mensaje (${trackingCode})`,
            tag: 'new-response',
            onClick: () => {
                // Navigate to tracking section
                document.getElementById('trackingCodeInput').value = trackingCode;
                document.getElementById('trackBtn').click();
            }
        });
    },

    /**
     * Notify about appointment reminder
     * @param {Object} appointment - Appointment data
     * @param {number} hoursUntil - Hours until appointment
     */
    notifyAppointment(appointment, hoursUntil) {
        if (!this.preferences.appointments) return;

        const timeText = hoursUntil === 24 ? 'mañana' : `en ${hoursUntil} hora${hoursUntil > 1 ? 's' : ''}`;

        this.send('Recordatorio de Cita 📅', {
            body: `Tienes una cita ${timeText} a las ${appointment.time}`,
            tag: 'appointment-reminder',
            requireInteraction: true
        });
    },

    /**
     * Notify about achievement unlocked
     * @param {Object} achievement - Achievement data
     */
    notifyAchievement(achievement) {
        if (!this.preferences.achievements) return;

        this.send('¡Logro Desbloqueado! 🎉', {
            body: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
            tag: 'achievement',
            requireInteraction: false
        });
    },

    /**
     * Daily check-in notification
     */
    notifyDailyCheckin() {
        if (!this.preferences.dailyCheckin) return;

        this.send('¿Cómo te sientes hoy? 💭', {
            body: 'Tómate un momento para registrar tu estado de ánimo',
            tag: 'daily-checkin',
            onClick: () => {
                // Navigate to mood tracker
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    },

    /**
     * Setup daily check-in schedule
     */
    setupDailyCheckin() {
        // Check if we've already sent today's check-in
        const lastCheckin = localStorage.getItem('lastCheckinDate');
        const today = new Date().toDateString();

        if (lastCheckin !== today) {
            // Schedule for 9 AM if not already past
            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(9, 0, 0, 0);

            if (now < scheduledTime) {
                const delay = scheduledTime - now;
                setTimeout(() => {
                    this.notifyDailyCheckin();
                    localStorage.setItem('lastCheckinDate', today);
                }, delay);
            }
        }
    },

    /**
     * Show notification preferences modal
     */
    showPreferencesModal() {
        const modal = document.getElementById('notificationPreferencesModal');
        if (modal) {
            // Update form with current preferences
            document.getElementById('notifEnabled').checked = this.preferences.enabled;
            document.getElementById('notifNewResponse').checked = this.preferences.newResponse;
            document.getElementById('notifAppointments').checked = this.preferences.appointments;
            document.getElementById('notifAchievements').checked = this.preferences.achievements;
            document.getElementById('notifDailyCheckin').checked = this.preferences.dailyCheckin;
            document.getElementById('dndEnabled').checked = this.preferences.doNotDisturb.enabled;
            document.getElementById('dndStart').value = this.preferences.doNotDisturb.start;
            document.getElementById('dndEnd').value = this.preferences.doNotDisturb.end;

            modal.classList.remove('hidden');
        }
    },

    /**
     * Save notification preferences from form
     */
    savePreferencesFromForm() {
        this.preferences.enabled = document.getElementById('notifEnabled').checked;
        this.preferences.newResponse = document.getElementById('notifNewResponse').checked;
        this.preferences.appointments = document.getElementById('notifAppointments').checked;
        this.preferences.achievements = document.getElementById('notifAchievements').checked;
        this.preferences.dailyCheckin = document.getElementById('notifDailyCheckin').checked;
        this.preferences.doNotDisturb.enabled = document.getElementById('dndEnabled').checked;
        this.preferences.doNotDisturb.start = document.getElementById('dndStart').value;
        this.preferences.doNotDisturb.end = document.getElementById('dndEnd').value;

        this.savePreferences();

        // Show confirmation
        alert('Preferencias de notificaciones guardadas');
    }
};

// ============================================
// SECURITY MODULE
// ============================================

const SecuritySystem = {
    sessionTimeout: 15 * 60 * 1000, // 15 minutes
    lastActivity: Date.now(),
    timeoutTimer: null,

    /**
     * Initialize security system
     */
    init() {
        this.setupActivityTracking();
        this.setupSessionTimeout();
        this.addPanicButton();
    },

    /**
     * Track user activity
     */
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
                this.resetTimeout();
            }, true);
        });
    },

    /**
     * Setup session timeout
     */
    setupSessionTimeout() {
        this.resetTimeout();
    },

    /**
     * Reset timeout timer
     */
    resetTimeout() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
        }

        this.timeoutTimer = setTimeout(() => {
            this.handleTimeout();
        }, this.sessionTimeout);
    },

    /**
     * Handle session timeout
     */
    handleTimeout() {
        const inactive = Date.now() - this.lastActivity;

        if (inactive >= this.sessionTimeout) {
            // Show timeout warning
            const shouldContinue = confirm(
                'Tu sesión ha estado inactiva por 15 minutos.\\n\\n' +
                '¿Deseas continuar tu sesión?'
            );

            if (shouldContinue) {
                this.lastActivity = Date.now();
                this.resetTimeout();
            } else {
                // Clear sensitive data and reload
                this.clearHistory();
                window.location.reload();
            }
        }
    },

    /**
     * Clear browsing history
     */
    clearHistory() {
        if (confirm('¿Estás seguro de que deseas borrar tu historial local?\\n\\nEsto eliminará todos tus mensajes guardados en este dispositivo.')) {
            // Clear localStorage
            const theme = localStorage.getItem('vocesAnonimas_theme');
            const notifPrefs = localStorage.getItem('notificationPreferences');

            localStorage.clear();

            // Restore non-sensitive data
            if (theme) localStorage.setItem('vocesAnonimas_theme', theme);
            if (notifPrefs) localStorage.setItem('notificationPreferences', notifPrefs);

            alert('Historial borrado exitosamente');
            window.location.reload();
        }
    },

    /**
     * Show emergency panic modal
     */
    showPanicModal() {
        const modal = document.getElementById('panicModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    /**
     * Add panic button to page
     */
    addPanicButton() {
        // Panic button is added in HTML
        const panicBtn = document.getElementById('panicBtn');
        if (panicBtn) {
            panicBtn.addEventListener('click', () => this.showPanicModal());
        }
    },

    /**
     * Quick exit - close window or navigate away
     */
    quickExit() {
        // Try to close window
        window.close();

        // If that doesn't work, navigate to a neutral site
        setTimeout(() => {
            window.location.href = 'https://www.google.com';
        }, 100);
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NotificationSystem.init();
        SecuritySystem.init();
    });
} else {
    NotificationSystem.init();
    SecuritySystem.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationSystem, SecuritySystem };
}
