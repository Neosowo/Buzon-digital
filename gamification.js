// ============================================
// GAMIFICATION MODULE
// ============================================

const GamificationSystem = {
    // User progress
    progress: {
        points: 0,
        level: 1,
        streak: 0,
        lastCheckin: null,
        achievements: [],
        challenges: []
    },

    // Achievement definitions
    achievements: [
        {
            id: 'first_voice',
            name: 'Primera Voz',
            description: 'Enviaste tu primer mensaje',
            icon: '🌟',
            points: 10,
            unlocked: false
        },
        {
            id: 'help_seeker',
            name: 'Buscando Ayuda',
            description: 'Usaste 3 recursos de autoayuda',
            icon: '💪',
            points: 20,
            unlocked: false,
            progress: 0,
            target: 3
        },
        {
            id: 'week_streak',
            name: 'Racha de 7 Días',
            description: 'Check-in diario por una semana',
            icon: '🔥',
            points: 50,
            unlocked: false
        },
        {
            id: 'challenge_master',
            name: 'Completador',
            description: 'Completaste 5 desafíos',
            icon: '🎯',
            points: 30,
            unlocked: false,
            progress: 0,
            target: 5
        },
        {
            id: 'resilient',
            name: 'Resiliente',
            description: 'Mejoraste tu estado de ánimo en 30 días',
            icon: '🌈',
            points: 100,
            unlocked: false
        },
        {
            id: 'communicator',
            name: 'Comunicador',
            description: 'Enviaste 5 mensajes',
            icon: '💬',
            points: 25,
            unlocked: false,
            progress: 0,
            target: 5
        },
        {
            id: 'tracker',
            name: 'Rastreador de Ánimo',
            description: 'Registraste tu ánimo 10 veces',
            icon: '📊',
            points: 30,
            unlocked: false,
            progress: 0,
            target: 10
        }
    ],

    // Daily challenges
    dailyChallenges: [
        { id: 'breathe', name: 'Respira Profundo', description: 'Completa el ejercicio de respiración', icon: '🌬️', points: 5 },
        { id: 'gratitude', name: 'Gratitud', description: 'Escribe 3 cosas por las que estés agradecido', icon: '🙏', points: 5 },
        { id: 'walk', name: 'Camina', description: 'Da un paseo de 10 minutos', icon: '🚶', points: 5 },
        { id: 'water', name: 'Hidrátate', description: 'Bebe 8 vasos de agua', icon: '💧', points: 5 },
        { id: 'sleep', name: 'Duerme Bien', description: 'Duerme 8 horas', icon: '😴', points: 5 },
        { id: 'connect', name: 'Conecta', description: 'Habla con un amigo o familiar', icon: '👥', points: 5 },
        { id: 'hobby', name: 'Hobby', description: 'Dedica 30 min a algo que disfrutes', icon: '🎨', points: 5 }
    ],

    /**
     * Initialize gamification system
     */
    init() {
        this.loadProgress();
        this.checkDailyStreak();
        this.assignDailyChallenge();
        this.updateUI();
    },

    /**
     * Load progress from localStorage
     */
    loadProgress() {
        const saved = localStorage.getItem('gamificationProgress');
        if (saved) {
            const loadedProgress = JSON.parse(saved);
            this.progress = { ...this.progress, ...loadedProgress };

            // Update achievements with saved unlock status
            this.achievements.forEach(achievement => {
                const saved = this.progress.achievements.find(a => a.id === achievement.id);
                if (saved) {
                    achievement.unlocked = saved.unlocked;
                    achievement.progress = saved.progress || 0;
                }
            });
        }
    },

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        // Save achievement status
        this.progress.achievements = this.achievements.map(a => ({
            id: a.id,
            unlocked: a.unlocked,
            progress: a.progress || 0
        }));

        localStorage.setItem('gamificationProgress', JSON.stringify(this.progress));
    },

    /**
     * Add points
     * @param {number} points - Points to add
     * @param {string} reason - Reason for points
     */
    addPoints(points, reason = '') {
        this.progress.points += points;

        // Check for level up
        const newLevel = Math.floor(this.progress.points / 100) + 1;
        if (newLevel > this.progress.level) {
            this.progress.level = newLevel;
            this.showLevelUp(newLevel);
        }

        this.saveProgress();
        this.updateUI();

        // Show points notification
        if (reason) {
            this.showPointsNotification(points, reason);
        }
    },

    /**
     * Check and update daily streak
     */
    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastCheckin = this.progress.lastCheckin;

        if (!lastCheckin) {
            // First check-in
            this.progress.streak = 1;
            this.progress.lastCheckin = today;
            this.saveProgress();
            return;
        }

        const lastDate = new Date(lastCheckin);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already checked in today
            return;
        } else if (diffDays === 1) {
            // Consecutive day
            this.progress.streak++;
            this.progress.lastCheckin = today;
            this.addPoints(5, 'Racha diaria');

            // Check for week streak achievement
            if (this.progress.streak >= 7) {
                this.unlockAchievement('week_streak');
            }
        } else {
            // Streak broken
            this.progress.streak = 1;
            this.progress.lastCheckin = today;
        }

        this.saveProgress();
    },

    /**
     * Assign daily challenge
     */
    assignDailyChallenge() {
        const today = new Date().toDateString();
        const lastChallengeDate = localStorage.getItem('lastChallengeDate');

        if (lastChallengeDate !== today) {
            // Assign new random challenge
            const randomChallenge = this.dailyChallenges[Math.floor(Math.random() * this.dailyChallenges.length)];
            this.progress.todayChallenge = randomChallenge;
            this.progress.challengeCompleted = false;
            localStorage.setItem('lastChallengeDate', today);
            this.saveProgress();
        }
    },

    /**
     * Complete daily challenge
     */
    completeChallenge() {
        if (!this.progress.challengeCompleted && this.progress.todayChallenge) {
            this.progress.challengeCompleted = true;
            this.addPoints(this.progress.todayChallenge.points, `Desafío: ${this.progress.todayChallenge.name}`);

            // Track for achievement
            const achievement = this.achievements.find(a => a.id === 'challenge_master');
            if (achievement && !achievement.unlocked) {
                achievement.progress = (achievement.progress || 0) + 1;
                if (achievement.progress >= achievement.target) {
                    this.unlockAchievement('challenge_master');
                }
            }

            this.saveProgress();
            this.updateUI();
        }
    },

    /**
     * Unlock achievement
     * @param {string} achievementId - Achievement ID
     */
    unlockAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);

        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.addPoints(achievement.points, `Logro: ${achievement.name}`);

            // Show achievement notification
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.notifyAchievement(achievement);
            }

            this.showAchievementUnlock(achievement);
            this.saveProgress();
            this.updateUI();
        }
    },

    /**
     * Track message sent
     */
    trackMessageSent() {
        // First message achievement
        if (this.progress.points === 0) {
            this.unlockAchievement('first_voice');
        }

        // Communicator achievement
        const achievement = this.achievements.find(a => a.id === 'communicator');
        if (achievement && !achievement.unlocked) {
            achievement.progress = (achievement.progress || 0) + 1;
            if (achievement.progress >= achievement.target) {
                this.unlockAchievement('communicator');
            }
            this.saveProgress();
        }

        this.addPoints(2, 'Mensaje enviado');
    },

    /**
     * Track resource used
     */
    trackResourceUsed() {
        const achievement = this.achievements.find(a => a.id === 'help_seeker');
        if (achievement && !achievement.unlocked) {
            achievement.progress = (achievement.progress || 0) + 1;
            if (achievement.progress >= achievement.target) {
                this.unlockAchievement('help_seeker');
            }
            this.saveProgress();
        }

        this.addPoints(3, 'Recurso utilizado');
    },

    /**
     * Track mood registered
     */
    trackMoodRegistered() {
        const achievement = this.achievements.find(a => a.id === 'tracker');
        if (achievement && !achievement.unlocked) {
            achievement.progress = (achievement.progress || 0) + 1;
            if (achievement.progress >= achievement.target) {
                this.unlockAchievement('tracker');
            }
            this.saveProgress();
        }

        this.addPoints(1, 'Estado de ánimo registrado');
    },

    /**
     * Show level up animation
     * @param {number} level - New level
     */
    showLevelUp(level) {
        const modal = document.getElementById('levelUpModal');
        if (modal) {
            document.getElementById('newLevel').textContent = level;
            modal.classList.remove('hidden');

            setTimeout(() => {
                modal.classList.add('hidden');
            }, 3000);
        }
    },

    /**
     * Show achievement unlock animation
     * @param {Object} achievement - Achievement object
     */
    showAchievementUnlock(achievement) {
        const modal = document.getElementById('achievementModal');
        if (modal) {
            document.getElementById('achievementIcon').textContent = achievement.icon;
            document.getElementById('achievementName').textContent = achievement.name;
            document.getElementById('achievementDesc').textContent = achievement.description;
            document.getElementById('achievementPoints').textContent = `+${achievement.points} puntos`;

            modal.classList.remove('hidden');

            setTimeout(() => {
                modal.classList.add('hidden');
            }, 4000);
        }
    },

    /**
     * Show points notification
     * @param {number} points - Points earned
     * @param {string} reason - Reason
     */
    showPointsNotification(points, reason) {
        // Create floating notification
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `<strong>+${points} puntos</strong><br>${reason}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2000);
    },

    /**
     * Update UI with current progress
     */
    updateUI() {
        // Update points display
        const pointsEl = document.getElementById('userPoints');
        if (pointsEl) pointsEl.textContent = this.progress.points;

        // Update level display
        const levelEl = document.getElementById('userLevel');
        if (levelEl) levelEl.textContent = this.progress.level;

        // Update streak display
        const streakEl = document.getElementById('userStreak');
        if (streakEl) streakEl.textContent = this.progress.streak;

        // Update progress bar
        const progressBar = document.getElementById('levelProgress');
        if (progressBar) {
            const pointsInLevel = this.progress.points % 100;
            progressBar.style.width = `${pointsInLevel}%`;
        }

        // Update achievements list
        this.updateAchievementsList();

        // Update daily challenge
        this.updateDailyChallengeUI();
    },

    /**
     * Update achievements list in UI
     */
    updateAchievementsList() {
        const container = document.getElementById('achievementsList');
        if (!container) return;

        container.innerHTML = this.achievements.map(achievement => {
            const progressText = achievement.target ?
                `${achievement.progress || 0}/${achievement.target}` : '';

            return `
        <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-info">
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
            ${progressText ? `<div class="achievement-progress">${progressText}</div>` : ''}
          </div>
          <div class="achievement-points">+${achievement.points}</div>
        </div>
      `;
        }).join('');
    },

    /**
     * Update daily challenge UI
     */
    updateDailyChallengeUI() {
        const container = document.getElementById('dailyChallengeCard');
        if (!container || !this.progress.todayChallenge) return;

        const challenge = this.progress.todayChallenge;
        const completed = this.progress.challengeCompleted;

        container.innerHTML = `
      <div class="challenge-icon">${challenge.icon}</div>
      <div class="challenge-info">
        <h4>${challenge.name}</h4>
        <p>${challenge.description}</p>
        <span class="challenge-points">+${challenge.points} puntos</span>
      </div>
      <button 
        class="btn ${completed ? 'btn-secondary' : 'btn-primary'}" 
        ${completed ? 'disabled' : ''}
        onclick="GamificationSystem.completeChallenge()"
      >
        ${completed ? '✓ Completado' : 'Completar'}
      </button>
    `;
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GamificationSystem.init();
    });
} else {
    GamificationSystem.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamificationSystem;
}
