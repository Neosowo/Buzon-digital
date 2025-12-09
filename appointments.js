// ============================================
// APPOINTMENTS MODULE
// ============================================

const AppointmentSystem = {
    appointments: [],

    /**
     * Initialize appointment system
     */
    init() {
        this.loadAppointments();
        this.setupReminders();
    },

    /**
     * Load appointments from localStorage
     */
    loadAppointments() {
        const saved = localStorage.getItem('appointments');
        if (saved) {
            this.appointments = JSON.parse(saved);
        }
    },

    /**
     * Save appointments to localStorage
     */
    saveAppointments() {
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
    },

    /**
     * Request new appointment
     * @param {Object} data - Appointment data
     */
    requestAppointment(data) {
        const appointment = {
            id: Date.now().toString(),
            trackingCode: data.trackingCode,
            date: data.date,
            time: data.time,
            reason: data.reason,
            status: 'pending', // pending, confirmed, cancelled
            createdAt: new Date().toISOString(),
            reminders: {
                day: false,
                hour: false
            }
        };

        this.appointments.push(appointment);
        this.saveAppointments();

        return appointment;
    },

    /**
     * Update appointment status
     * @param {string} id - Appointment ID
     * @param {string} status - New status
     */
    updateStatus(id, status) {
        const appointment = this.appointments.find(a => a.id === id);
        if (appointment) {
            appointment.status = status;
            this.saveAppointments();
        }
    },

    /**
     * Get appointments by tracking code
     * @param {string} trackingCode - Message tracking code
     */
    getByTrackingCode(trackingCode) {
        return this.appointments.filter(a => a.trackingCode === trackingCode);
    },

    /**
     * Get all pending appointments
     */
    getPending() {
        return this.appointments.filter(a => a.status === 'pending');
    },

    /**
     * Get upcoming appointments
     */
    getUpcoming() {
        const now = new Date();
        return this.appointments.filter(a => {
            const appointmentDate = new Date(`${a.date} ${a.time}`);
            return appointmentDate > now && a.status === 'confirmed';
        }).sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });
    },

    /**
     * Setup appointment reminders
     */
    setupReminders() {
        setInterval(() => {
            this.checkReminders();
        }, 60000); // Check every minute
    },

    /**
     * Check and send reminders
     */
    checkReminders() {
        const now = new Date();

        this.appointments.forEach(appointment => {
            if (appointment.status !== 'confirmed') return;

            const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
            const hoursUntil = (appointmentDate - now) / (1000 * 60 * 60);

            // 24 hour reminder
            if (hoursUntil <= 24 && hoursUntil > 23 && !appointment.reminders.day) {
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.notifyAppointment(appointment, 24);
                }
                appointment.reminders.day = true;
                this.saveAppointments();
            }

            // 1 hour reminder
            if (hoursUntil <= 1 && hoursUntil > 0 && !appointment.reminders.hour) {
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.notifyAppointment(appointment, 1);
                }
                appointment.reminders.hour = true;
                this.saveAppointments();
            }
        });
    },

    /**
     * Cancel appointment
     * @param {string} id - Appointment ID
     */
    cancelAppointment(id) {
        this.updateStatus(id, 'cancelled');
    },

    /**
     * Reschedule appointment
     * @param {string} id - Appointment ID
     * @param {string} newDate - New date
     * @param {string} newTime - New time
     */
    rescheduleAppointment(id, newDate, newTime) {
        const appointment = this.appointments.find(a => a.id === id);
        if (appointment) {
            appointment.date = newDate;
            appointment.time = newTime;
            appointment.reminders = { day: false, hour: false };
            this.saveAppointments();
        }
    }
};

// ============================================
// COUNSELOR TEMPLATES MODULE
// ============================================

const TemplateSystem = {
    templates: [],

    defaultTemplates: [
        {
            id: 'welcome',
            name: 'Agradecimiento por Compartir',
            content: 'Gracias por confiar en nosotros y compartir lo que sientes. Tu bienestar es importante y estamos aquí para apoyarte. ¿Hay algo específico en lo que pueda ayudarte hoy?'
        },
        {
            id: 'referral',
            name: 'Derivación a Servicio Especializado',
            content: 'Basándome en lo que me has compartido, creo que sería beneficioso que hables con un especialista. Te recomiendo contactar a [SERVICIO]. ¿Te gustaría que te ayude a coordinar esto?'
        },
        {
            id: 'followup',
            name: 'Seguimiento Semanal',
            content: 'Hola, quería saber cómo te has sentido esta semana. ¿Has notado algún cambio? Recuerda que estoy aquí si necesitas hablar.'
        },
        {
            id: 'resources',
            name: 'Recursos Recomendados',
            content: 'Te comparto algunos recursos que podrían ayudarte:\n\n1. [Recurso 1]\n2. [Recurso 2]\n3. [Recurso 3]\n\n¿Hay alguno que te gustaría explorar primero?'
        },
        {
            id: 'closure',
            name: 'Cierre de Caso Satisfactorio',
            content: 'Me alegra saber que te sientes mejor. Has hecho un gran progreso. Recuerda que siempre puedes volver si necesitas apoyo. ¡Cuídate mucho!'
        },
        {
            id: 'crisis',
            name: 'Respuesta a Crisis',
            content: 'Gracias por confiar en mí. Lo que sientes es muy importante. Si estás en peligro inmediato, por favor llama al [NÚMERO DE EMERGENCIA]. Estoy aquí para ayudarte y quiero que sepas que no estás solo/a.'
        }
    ],

    /**
     * Initialize template system
     */
    init() {
        this.loadTemplates();
    },

    /**
     * Load templates from localStorage
     */
    loadTemplates() {
        const saved = localStorage.getItem('counselorTemplates');
        if (saved) {
            this.templates = JSON.parse(saved);
        } else {
            this.templates = [...this.defaultTemplates];
            this.saveTemplates();
        }
    },

    /**
     * Save templates to localStorage
     */
    saveTemplates() {
        localStorage.setItem('counselorTemplates', JSON.stringify(this.templates));
    },

    /**
     * Get all templates
     */
    getAll() {
        return this.templates;
    },

    /**
     * Get template by ID
     * @param {string} id - Template ID
     */
    getById(id) {
        return this.templates.find(t => t.id === id);
    },

    /**
     * Add new template
     * @param {Object} template - Template data
     */
    addTemplate(template) {
        const newTemplate = {
            id: Date.now().toString(),
            name: template.name,
            content: template.content,
            custom: true
        };

        this.templates.push(newTemplate);
        this.saveTemplates();
        return newTemplate;
    },

    /**
     * Update template
     * @param {string} id - Template ID
     * @param {Object} updates - Updated data
     */
    updateTemplate(id, updates) {
        const template = this.templates.find(t => t.id === id);
        if (template) {
            Object.assign(template, updates);
            this.saveTemplates();
        }
    },

    /**
     * Delete template
     * @param {string} id - Template ID
     */
    deleteTemplate(id) {
        this.templates = this.templates.filter(t => t.id !== id);
        this.saveTemplates();
    },

    /**
     * Insert template into reply field
     * @param {string} templateId - Template ID
     * @param {string} fieldId - Textarea field ID
     */
    insertTemplate(templateId, fieldId) {
        const template = this.getById(templateId);
        const field = document.getElementById(fieldId);

        if (template && field) {
            field.value = template.content;
            field.focus();
        }
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AppointmentSystem.init();
        TemplateSystem.init();
    });
} else {
    AppointmentSystem.init();
    TemplateSystem.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppointmentSystem, TemplateSystem };
}
