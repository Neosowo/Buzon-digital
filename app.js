// ============================================
// VOCES ANÓNIMAS - MAIN APPLICATION
// ============================================

// ===== STATE MANAGEMENT =====
const AppState = {
    messages: [],
    currentView: 'student',
    theme: 'light',
    selectedMood: null
};

// ===== UTILITY FUNCTIONS =====

/**
 * Generate unique tracking code
 * @returns {string} 8-character alphanumeric code
 */
function generateTrackingCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    const messages = getMessages();
    if (messages.some(m => m.trackingCode === code)) {
        return generateTrackingCode(); // Recursive call if duplicate
    }
    return code;
}

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get category emoji
 * @param {string} category - Category name
 * @returns {string} Emoji
 */
function getCategoryEmoji(category) {
    const emojis = {
        ansiedad: '😰',
        depresion: '😔',
        bullying: '😢',
        familiar: '🏠',
        academico: '📚',
        autoestima: '💭',
        relaciones: '💔',
        otro: '💬'
    };
    return emojis[category] || '💬';
}

/**
 * Get urgency color
 * @param {string} urgency - Urgency level
 * @returns {string} Color class
 */
function getUrgencyColor(urgency) {
    const colors = {
        urgente: 'danger',
        alta: 'warning',
        media: 'warning',
        baja: 'success'
    };
    return colors[urgency] || 'primary';
}

/**
 * Get status label
 * @param {string} status - Status code
 * @returns {string} Status label
 */
function getStatusLabel(status) {
    const labels = {
        new: 'Nuevo',
        'in-review': 'En Revisión',
        responded: 'Respondido',
        resolved: 'Resuelto'
    };
    return labels[status] || status;
}

// ===== LOCAL STORAGE FUNCTIONS =====

/**
 * Get all messages from localStorage
 * @returns {Array} Array of messages
 */
function getMessages() {
    const data = localStorage.getItem('vocesAnonimas_messages');
    return data ? JSON.parse(data) : [];
}

/**
 * Save messages to localStorage
 * @param {Array} messages - Messages array
 */
function saveMessages(messages) {
    localStorage.setItem('vocesAnonimas_messages', JSON.stringify(messages));
    AppState.messages = messages;
}

/**
 * Add new message
 * @param {Object} messageData - Message data
 * @returns {Object} Created message
 */
function addMessage(messageData) {
    const messages = getMessages();
    const trackingCode = generateTrackingCode();

    // Analyze for crisis
    const crisisAnalysis = CrisisDetection.analyze(messageData.message);

    // Adjust urgency if crisis detected
    const adjustedUrgency = CrisisDetection.adjustUrgency(messageData.urgency, crisisAnalysis);

    const newMessage = {
        id: Date.now().toString(),
        trackingCode,
        category: messageData.category,
        urgency: adjustedUrgency,
        message: messageData.message,
        mood: messageData.mood,
        timestamp: new Date().toISOString(),
        status: 'new',
        crisisDetected: crisisAnalysis.isCrisis,
        crisisLevel: crisisAnalysis.crisisLevel,
        crisisKeywords: crisisAnalysis.detectedKeywords,
        replies: [],
        counselorNotes: ''
    };

    messages.unshift(newMessage); // Add to beginning
    saveMessages(messages);

    return newMessage;
}

/**
 * Get message by tracking code
 * @param {string} code - Tracking code
 * @returns {Object|null} Message or null
 */
function getMessageByCode(code) {
    const messages = getMessages();
    return messages.find(m => m.trackingCode.toUpperCase() === code.toUpperCase());
}

// ===== THEME MANAGEMENT =====

/**
 * Initialize theme from localStorage
 */
function initTheme() {
    const savedTheme = localStorage.getItem('vocesAnonimas_theme') || 'light';
    AppState.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

/**
 * Toggle theme
 */
function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    localStorage.setItem('vocesAnonimas_theme', AppState.theme);
    updateThemeIcon();
}

/**
 * Update theme toggle icon
 */
function updateThemeIcon() {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = AppState.theme === 'light' ? 'bx bx-moon' : 'bx bx-sun';
    }
}

// ===== VIEW MANAGEMENT =====

/**
 * Switch between student and counselor views
 * @param {string} view - 'student' or 'counselor'
 */
function switchView(view) {
    AppState.currentView = view;
    const studentView = document.getElementById('studentView');
    const counselorView = document.getElementById('counselorView');

    if (view === 'student') {
        studentView.classList.remove('hidden');
        counselorView.classList.add('hidden');
    } else {
        studentView.classList.add('hidden');
        counselorView.classList.remove('hidden');
    }
}

// ===== FORM HANDLERS =====

/**
 * Handle message form submission
 * @param {Event} e - Form event
 */
function handleMessageSubmit(e) {
    e.preventDefault();

    const formData = {
        category: document.getElementById('category').value,
        urgency: document.getElementById('urgency').value,
        message: document.getElementById('message').value,
        mood: AppState.selectedMood
    };

    // Validate mood selection
    if (!formData.mood) {
        alert('Por favor selecciona cómo te sientes');
        return;
    }

    // Add message
    const newMessage = addMessage(formData);

    // Track gamification
    if (typeof GamificationSystem !== 'undefined') {
        GamificationSystem.trackMessageSent();
        GamificationSystem.trackMoodRegistered();
    }

    // Show success message
    document.getElementById('messageForm').classList.add('hidden');
    document.getElementById('successMessage').classList.remove('hidden');
    document.getElementById('generatedCode').textContent = newMessage.trackingCode;

    // Scroll to success message
    document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Reset message form
 */
function resetMessageForm() {
    document.getElementById('messageForm').reset();
    document.getElementById('messageForm').classList.remove('hidden');
    document.getElementById('successMessage').classList.add('hidden');
    AppState.selectedMood = null;

    // Clear mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Handle mood selection
 * @param {Event} e - Click event
 */
function handleMoodSelect(e) {
    const btn = e.currentTarget;
    const mood = btn.dataset.mood;

    // Remove active from all
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));

    // Add active to clicked
    btn.classList.add('active');

    // Update state
    AppState.selectedMood = mood;
    document.getElementById('mood').value = mood;
}

/**
 * Handle tracking code search
 */
function handleTrackMessage() {
    const code = document.getElementById('trackingCodeInput').value.trim();

    if (!code) {
        alert('Por favor ingresa un código de seguimiento');
        return;
    }

    const message = getMessageByCode(code);
    const resultsDiv = document.getElementById('trackingResults');

    if (!message) {
        resultsDiv.innerHTML = `
      <div class="alert alert-warning">
        <i class='bx bx-error-circle' style="font-size: 1.5rem;"></i>
        <div>
          <strong>Código no encontrado</strong>
          <p>No se encontró ningún mensaje con el código <code>${code}</code>. Verifica que lo hayas ingresado correctamente.</p>
        </div>
      </div>
    `;
        resultsDiv.classList.remove('hidden');
        return;
    }

    // Display message details
    const statusColor = getUrgencyColor(message.urgency);
    let repliesHtml = '';

    if (message.replies && message.replies.length > 0) {
        repliesHtml = `
      <div class="conversation-thread mt-lg">
        <h4>Conversación</h4>
        ${message.replies.map(reply => `
          <div class="conversation-message ${reply.from}">
            <div class="message-sender">
              ${reply.from === 'counselor' ? '👨‍⚕️ Consejero' : '👤 Tú'}
              <span class="message-time">${formatDate(reply.timestamp)}</span>
            </div>
            <p>${reply.message}</p>
          </div>
        `).join('')}
      </div>
    `;
    }

    resultsDiv.innerHTML = `
    <div class="alert alert-success">
      <i class='bx bx-check-circle' style="font-size: 1.5rem;"></i>
      <div>
        <strong>Mensaje encontrado</strong>
        <p>Aquí está el estado de tu mensaje:</p>
      </div>
    </div>
    
    <div class="glass-card mt-md">
      <div class="flex justify-between items-center mb-md">
        <span class="badge badge-${statusColor}">${getStatusLabel(message.status)}</span>
        <span class="text-secondary">${formatDate(message.timestamp)}</span>
      </div>
      
      <div class="mb-md">
        <strong>Categoría:</strong> ${getCategoryEmoji(message.category)} ${message.category.charAt(0).toUpperCase() + message.category.slice(1)}
      </div>
      
      <div class="mb-md">
        <strong>Tu mensaje:</strong>
        <p class="mt-sm">${message.message}</p>
      </div>
      
      ${repliesHtml}
      
      ${message.status === 'new' || message.status === 'in-review' ? `
        <div class="alert alert-primary mt-lg">
          <i class='bx bx-info-circle'></i>
          <p>Tu mensaje está siendo revisado. Recibirás una respuesta pronto. Vuelve a consultar usando tu código.</p>
        </div>
      ` : ''}
      
      ${message.status === 'responded' || message.replies.length > 0 ? `
        <div class="mt-lg">
          <h4>Responder al Consejero</h4>
          <form id="studentReplyForm" class="mt-md">
            <div class="form-group">
              <label class="form-label">Tu respuesta</label>
              <textarea id="studentReplyText" class="form-textarea" rows="4" placeholder="Escribe tu respuesta aquí..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">
              <i class='bx bx-send'></i>
              Enviar Respuesta
            </button>
          </form>
        </div>
      ` : ''}
    </div>
  `;

    resultsDiv.classList.remove('hidden');
    resultsDiv.scrollIntoView({ behavior: 'smooth' });

    // Add event listener for student reply form
    const replyForm = document.getElementById('studentReplyForm');
    if (replyForm) {
        replyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleStudentReply(message.trackingCode);
        });
    }
}

/**
 * Handle student reply to counselor
 * @param {string} trackingCode - Message tracking code
 */
function handleStudentReply(trackingCode) {
    const replyText = document.getElementById('studentReplyText').value.trim();

    if (!replyText) {
        alert('Por favor escribe una respuesta');
        return;
    }

    const messages = getMessages();
    const messageIndex = messages.findIndex(m => m.trackingCode === trackingCode);

    if (messageIndex === -1) {
        alert('Mensaje no encontrado');
        return;
    }

    // Add student reply to conversation
    const reply = {
        from: 'student',
        message: replyText,
        timestamp: new Date().toISOString()
    };

    messages[messageIndex].replies.push(reply);
    messages[messageIndex].status = 'responded'; // Keep as responded to show conversation is active

    saveMessages(messages);

    // Clear form and refresh view
    document.getElementById('studentReplyText').value = '';

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'alert alert-success mt-md';
    successMsg.innerHTML = `
        <i class='bx bx-check-circle'></i>
        <div>
            <strong>¡Respuesta enviada!</strong>
            <p>El consejero recibirá tu mensaje.</p>
        </div>
    `;

    const form = document.getElementById('studentReplyForm');
    form.parentNode.insertBefore(successMsg, form);

    // Refresh the tracking view after a moment
    setTimeout(() => {
        handleTrackMessage();
    }, 2000);
}

/**
 * Copy tracking code to clipboard
 */
function copyTrackingCode() {
    const code = document.getElementById('generatedCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyCodeBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="bx bx-check"></i> Copiado';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    });
}

// ===== MODAL FUNCTIONS =====

/**
 * Show breathing exercise modal
 */
function showBreathingExercise() {
    const modal = document.getElementById('breathingModal');
    modal.classList.remove('hidden');

    const instruction = document.getElementById('breathingInstruction');
    const circle = document.querySelector('.breathing-circle');

    // Reset state
    instruction.textContent = 'Prepárate...';
    circle.className = 'breathing-circle'; // Remove grow/shrink classes

    let phase = 0;

    // Cycle function
    const runCycle = () => {
        // Remove all state classes first
        circle.classList.remove('grow', 'shrink');

        switch (phase) {
            case 0: // Inhala
                instruction.textContent = 'Inhala...';
                circle.classList.add('grow');
                break;
            case 1: // Sostén
                instruction.textContent = 'Sostén...';
                // No class change, keeps size from previous state (grow) or just stays
                break;
            case 2: // Exhala
                instruction.textContent = 'Exhala...';
                circle.classList.remove('grow'); // Return to base size
                circle.classList.add('shrink');  // Explicit shrink class if needed, or just let it transition back
                break;
            case 3: // Sostén (empty)
                instruction.textContent = 'Sostén...';
                circle.classList.remove('shrink');
                break;
        }

        phase = (phase + 1) % 4;
    };

    // Initial delay then start
    setTimeout(() => {
        runCycle();
        const interval = setInterval(runCycle, 4000); // 4 seconds per phase
        modal.dataset.intervalId = interval;
    }, 1000);
}

/**
 * Close modal
 * @param {string} modalId - Modal ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');

    // Clear breathing interval if exists
    if (modal.dataset.intervalId) {
        clearInterval(parseInt(modal.dataset.intervalId));
        delete modal.dataset.intervalId;
    }
}

// ===== CHARACTER COUNTER =====

/**
 * Update character counter
 */
function updateCharCounter() {
    const textarea = document.getElementById('message');
    const counter = document.getElementById('charCount');
    counter.textContent = textarea.value.length;
}

// ===== INITIALIZATION =====

/**
 * Initialize application
 */
function initApp() {
    // Initialize theme
    initTheme();

    // Load messages into state
    AppState.messages = getMessages();

    // Event Listeners

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    // View switching
    document.getElementById('counselorAccessBtn')?.addEventListener('click', () => {
        switchView('counselor');
    });

    document.getElementById('backToStudentBtn')?.addEventListener('click', () => {
        switchView('student');
    });

    // Message form
    document.getElementById('messageForm')?.addEventListener('submit', handleMessageSubmit);
    document.getElementById('sendAnotherBtn')?.addEventListener('click', resetMessageForm);

    // Mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', handleMoodSelect);
    });

    // Character counter
    document.getElementById('message')?.addEventListener('input', updateCharCounter);

    // Tracking
    document.getElementById('trackBtn')?.addEventListener('click', handleTrackMessage);
    document.getElementById('trackingCodeInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleTrackMessage();
    });

    // Copy code
    document.getElementById('copyCodeBtn')?.addEventListener('click', copyTrackingCode);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Modal overlay clicks
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Show gamification panel for students
    const gamifPanel = document.getElementById('gamificationPanel');
    if (gamifPanel && AppState.currentView === 'student') {
        gamifPanel.style.display = 'block';
    }



    // Mobile counselor button
    document.getElementById('mobileCounselorBtn')?.addEventListener('click', () => {
        switchView('counselor');
    });

    // Mobile nav active state (simple implementation)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked (if it's not the FAB which is handled separately)
            e.currentTarget.classList.add('active');
        });
    });

    console.log('Voces Anónimas initialized successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
