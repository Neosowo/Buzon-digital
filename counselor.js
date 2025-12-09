// ============================================
// COUNSELOR DASHBOARD MODULE
// ============================================

// ===== AUTHENTICATION =====

const COUNSELOR_PASSWORD = 'consejeria'; // In production, use proper authentication

/**
 * Check if counselor is logged in
 * @returns {boolean}
 */
function isCounselorLoggedIn() {
  return sessionStorage.getItem('counselorLoggedIn') === 'true';
}

/**
 * Handle counselor login
 * @param {Event} e - Form event
 */
function handleCounselorLogin(e) {
  e.preventDefault();

  const password = document.getElementById('counselorPassword').value;

  if (password === COUNSELOR_PASSWORD) {
    sessionStorage.setItem('counselorLoggedIn', 'true');
    showCounselorDashboard();
  } else {
    alert('Contraseña incorrecta. Intenta nuevamente.');
    document.getElementById('counselorPassword').value = '';
  }
}

/**
 * Handle counselor logout
 */
function handleCounselorLogout() {
  sessionStorage.removeItem('counselorLoggedIn');
  document.getElementById('counselorLogin').classList.remove('hidden');
  document.getElementById('counselorDashboard').classList.add('hidden');
  document.getElementById('counselorPassword').value = '';
}

/**
 * Show counselor dashboard
 */
function showCounselorDashboard() {
  document.getElementById('counselorLogin').classList.add('hidden');
  document.getElementById('counselorDashboard').classList.remove('hidden');

  // Load dashboard data
  updateDashboardStats();
  loadMessages();
}

// ===== DASHBOARD STATISTICS =====

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
  const messages = getMessages();

  const total = messages.length;
  const urgent = messages.filter(m => m.urgency === 'urgente' || m.crisisDetected).length;
  const pending = messages.filter(m => m.status === 'new' || m.status === 'in-review').length;
  const resolved = messages.filter(m => m.status === 'resolved').length;

  document.getElementById('totalMessages').textContent = total;
  document.getElementById('urgentMessages').textContent = urgent;
  document.getElementById('pendingMessages').textContent = pending;
  document.getElementById('resolvedMessages').textContent = resolved;
}

// ===== MESSAGE FILTERING =====

/**
 * Get filtered messages based on current filters
 * @returns {Array} Filtered messages
 */
function getFilteredMessages() {
  let messages = getMessages();

  const statusFilter = document.getElementById('filterStatus')?.value || 'all';
  const urgencyFilter = document.getElementById('filterUrgency')?.value || 'all';
  const categoryFilter = document.getElementById('filterCategory')?.value || 'all';
  const searchQuery = document.getElementById('searchMessages')?.value.toLowerCase() || '';

  // Apply filters
  if (statusFilter !== 'all') {
    messages = messages.filter(m => m.status === statusFilter);
  }

  if (urgencyFilter !== 'all') {
    messages = messages.filter(m => m.urgency === urgencyFilter);
  }

  if (categoryFilter !== 'all') {
    messages = messages.filter(m => m.category === categoryFilter);
  }

  if (searchQuery) {
    messages = messages.filter(m =>
      m.message.toLowerCase().includes(searchQuery) ||
      m.trackingCode.toLowerCase().includes(searchQuery) ||
      m.category.toLowerCase().includes(searchQuery)
    );
  }

  return messages;
}

// ===== MESSAGE DISPLAY =====

/**
 * Load and display messages
 */
function loadMessages() {
  const messages = getFilteredMessages();
  const container = document.getElementById('messagesList');

  if (messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class='bx bx-inbox'></i>
        <p>No hay mensajes que coincidan con los filtros seleccionados.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = messages.map(message => createMessageCard(message)).join('');

  // Add click listeners
  container.querySelectorAll('.message-item').forEach(item => {
    item.addEventListener('click', () => {
      showMessageDetail(item.dataset.messageId);
    });
  });
}

/**
 * Create message card HTML
 * @param {Object} message - Message object
 * @returns {string} HTML string
 */
function createMessageCard(message) {
  const urgencyEmoji = {
    urgente: '🔴',
    alta: '🟠',
    media: '🟡',
    baja: '🟢'
  };

  const crisisBadge = message.crisisDetected ?
    `<span class="crisis-badge"><i class='bx bx-error-circle'></i> CRISIS DETECTADA</span>` : '';

  return `
    <div class="message-item priority-${message.urgency}" data-message-id="${message.id}">
      <div class="message-header">
        <div class="message-meta">
          <span class="badge badge-primary">${message.trackingCode}</span>
          <span class="badge badge-${getUrgencyColor(message.urgency)}">
            ${urgencyEmoji[message.urgency]} ${message.urgency.toUpperCase()}
          </span>
          <span class="badge badge-${getStatusBadgeColor(message.status)}">
            ${getStatusLabel(message.status)}
          </span>
          ${crisisBadge}
        </div>
      </div>
      
      <div class="message-preview">
        <strong>${getCategoryEmoji(message.category)} ${message.category.charAt(0).toUpperCase() + message.category.slice(1)}</strong>
        <p>${message.message.substring(0, 150)}${message.message.length > 150 ? '...' : ''}</p>
      </div>
      
      <div class="message-footer">
        <span>${formatDate(message.timestamp)}</span>
        <span>${message.replies.length} respuesta${message.replies.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  `;
}

/**
 * Get status badge color
 * @param {string} status - Status
 * @returns {string} Color class
 */
function getStatusBadgeColor(status) {
  const colors = {
    new: 'primary',
    'in-review': 'warning',
    responded: 'success',
    resolved: 'success'
  };
  return colors[status] || 'primary';
}

// ===== MESSAGE DETAIL MODAL =====

/**
 * Show message detail modal
 * @param {string} messageId - Message ID
 */
function showMessageDetail(messageId) {
  const message = getMessages().find(m => m.id === messageId);
  if (!message) return;

  const modal = document.getElementById('messageModal');
  const modalBody = document.getElementById('modalBody');

  // Build crisis alert if detected
  let crisisAlert = '';
  if (message.crisisDetected) {
    const analysis = CrisisDetection.analyze(message.message);
    crisisAlert = `
      <div class="alert alert-danger mb-lg">
        <i class='bx bx-error-circle' style="font-size: 1.5rem;"></i>
        <div>
          <strong>⚠️ ALERTA DE CRISIS</strong>
          <p><strong>Nivel:</strong> ${message.crisisLevel.toUpperCase()}</p>
          <p><strong>Palabras clave detectadas:</strong> ${message.crisisKeywords.join(', ')}</p>
          <p><strong>Recomendación:</strong> ${analysis.recommendation}</p>
        </div>
      </div>
    `;
  }

  // Build conversation thread
  let conversationHtml = '';
  if (message.replies.length > 0) {
    conversationHtml = `
      <div class="conversation-thread">
        <h4>Historial de Conversación</h4>
        <div class="conversation-message student">
          <div class="message-sender">
            👤 Estudiante
            <span class="message-time">${formatDate(message.timestamp)}</span>
          </div>
          <p>${message.message}</p>
        </div>
        ${message.replies.map(reply => `
          <div class="conversation-message ${reply.from}">
            <div class="message-sender">
              ${reply.from === 'counselor' ? '👨‍⚕️ Consejero' : '👤 Estudiante'}
              <span class="message-time">${formatDate(reply.timestamp)}</span>
            </div>
            <p>${reply.message}</p>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    conversationHtml = `
      <div class="mb-lg">
        <h4>Mensaje Original</h4>
        <div class="conversation-message student">
          <div class="message-sender">
            👤 Estudiante
            <span class="message-time">${formatDate(message.timestamp)}</span>
          </div>
          <p>${message.message}</p>
        </div>
      </div>
    `;
  }

  modalBody.innerHTML = `
    <div class="mb-lg">
      <div class="flex justify-between items-center mb-md">
        <span class="badge badge-primary">${message.trackingCode}</span>
        <span class="text-secondary">${formatDate(message.timestamp)}</span>
      </div>
      
      <div class="flex gap-sm mb-md">
        <span class="badge badge-${getUrgencyColor(message.urgency)}">
          ${message.urgency.toUpperCase()}
        </span>
        <span class="badge badge-primary">
          ${getCategoryEmoji(message.category)} ${message.category}
        </span>
        <span class="badge badge-primary">
          Estado de ánimo: ${message.mood}
        </span>
      </div>
    </div>
    
    ${crisisAlert}
    
    ${conversationHtml}
    
    <div class="reply-form">
      <h4>Actualizar Estado</h4>
      <div class="status-selector">
        <button class="status-btn ${message.status === 'new' ? 'active' : ''}" data-status="new">Nuevo</button>
        <button class="status-btn ${message.status === 'in-review' ? 'active' : ''}" data-status="in-review">En Revisión</button>
        <button class="status-btn ${message.status === 'responded' ? 'active' : ''}" data-status="responded">Respondido</button>
        <button class="status-btn ${message.status === 'resolved' ? 'active' : ''}" data-status="resolved">Resuelto</button>
      </div>
      
      <h4 class="mt-lg">Enviar Respuesta</h4>
      <form id="replyForm" data-message-id="${message.id}">
        <div class="form-group">
          <textarea 
            id="replyMessage" 
            class="form-textarea" 
            placeholder="Escribe tu respuesta al estudiante (será anónima)..."
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Notas Internas (solo para consejeros)</label>
          <textarea 
            id="counselorNotes" 
            class="form-textarea" 
            placeholder="Notas privadas sobre este caso..."
          >${message.counselorNotes || ''}</textarea>
        </div>
        
        <button type="submit" class="btn btn-primary">
          <i class='bx bx-send'></i>
          Enviar Respuesta
        </button>
      </form>
    </div>
  `;

  // Add event listeners
  modalBody.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const newStatus = e.target.dataset.status;
      updateMessageStatus(message.id, newStatus);

      // Update UI
      modalBody.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  modalBody.querySelector('#replyForm').addEventListener('submit', handleReplySubmit);

  modal.classList.remove('hidden');
}

/**
 * Update message status
 * @param {string} messageId - Message ID
 * @param {string} newStatus - New status
 */
function updateMessageStatus(messageId, newStatus) {
  const messages = getMessages();
  const message = messages.find(m => m.id === messageId);

  if (message) {
    message.status = newStatus;
    saveMessages(messages);
    updateDashboardStats();
    loadMessages();
  }
}

/**
 * Handle reply form submission
 * @param {Event} e - Form event
 */
function handleReplySubmit(e) {
  e.preventDefault();

  const messageId = e.target.dataset.messageId;
  const replyText = document.getElementById('replyMessage').value;
  const notes = document.getElementById('counselorNotes').value;

  const messages = getMessages();
  const message = messages.find(m => m.id === messageId);

  if (message) {
    // Add reply
    message.replies.push({
      from: 'counselor',
      message: replyText,
      timestamp: new Date().toISOString()
    });

    // Update notes
    message.counselorNotes = notes;

    // Update status to responded if not already
    if (message.status === 'new' || message.status === 'in-review') {
      message.status = 'responded';
    }

    saveMessages(messages);

    // Show success and refresh
    alert('Respuesta enviada con éxito');
    closeModal('messageModal');
    updateDashboardStats();
    loadMessages();
  }
}

// ===== FILTER EVENT LISTENERS =====

/**
 * Initialize counselor dashboard
 */
function initCounselorDashboard() {
  // Check if already logged in
  if (isCounselorLoggedIn()) {
    showCounselorDashboard();
  }

  // Login form
  document.getElementById('counselorLoginForm')?.addEventListener('submit', handleCounselorLogin);

  // Logout button
  document.getElementById('logoutBtn')?.addEventListener('click', handleCounselorLogout);

  // Filter listeners
  const filters = ['filterStatus', 'filterUrgency', 'filterCategory', 'searchMessages'];
  filters.forEach(filterId => {
    const element = document.getElementById(filterId);
    if (element) {
      element.addEventListener('change', loadMessages);
      if (filterId === 'searchMessages') {
        element.addEventListener('input', loadMessages);
      }
    }
  });

  console.log('Counselor dashboard initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCounselorDashboard);
} else {
  initCounselorDashboard();
}
