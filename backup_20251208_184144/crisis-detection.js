// ============================================
// CRISIS DETECTION MODULE
// ============================================

const CrisisDetection = {
    // Crisis keywords in Spanish
    keywords: {
        suicide: ['suicidio', 'suicidarme', 'quitarme la vida', 'acabar con todo', 'no quiero vivir', 'mejor muerto', 'matarme'],
        selfHarm: ['cortarme', 'hacerme daño', 'lastimarme', 'autolesión', 'herirme', 'golpearme'],
        violence: ['matar', 'violencia', 'arma', 'pistola', 'cuchillo', 'atacar', 'venganza'],
        severe: ['desesperado', 'sin salida', 'no puedo más', 'insoportable', 'horrible', 'terrible'],
        death: ['muerte', 'morir', 'muerto', 'funeral', 'despedida final']
    },

    /**
     * Analyze message for crisis indicators
     * @param {string} message - The message to analyze
     * @returns {Object} Analysis result with crisis detection info
     */
    analyze(message) {
        const lowerMessage = message.toLowerCase();
        const detectedKeywords = [];
        let severityScore = 0;

        // Check for crisis keywords
        for (const [category, words] of Object.entries(this.keywords)) {
            for (const word of words) {
                if (lowerMessage.includes(word)) {
                    detectedKeywords.push({ word, category });

                    // Assign severity scores
                    if (category === 'suicide') severityScore += 10;
                    else if (category === 'selfHarm') severityScore += 8;
                    else if (category === 'violence') severityScore += 9;
                    else if (category === 'death') severityScore += 7;
                    else if (category === 'severe') severityScore += 5;
                }
            }
        }

        // Determine crisis level
        let crisisLevel = 'none';
        let isCrisis = false;

        if (severityScore >= 10) {
            crisisLevel = 'critical';
            isCrisis = true;
        } else if (severityScore >= 7) {
            crisisLevel = 'high';
            isCrisis = true;
        } else if (severityScore >= 5) {
            crisisLevel = 'moderate';
            isCrisis = true;
        }

        return {
            isCrisis,
            crisisLevel,
            severityScore,
            detectedKeywords: detectedKeywords.map(k => k.word),
            categories: [...new Set(detectedKeywords.map(k => k.category))],
            recommendation: this.getRecommendation(crisisLevel)
        };
    },

    /**
     * Get recommendation based on crisis level
     * @param {string} level - Crisis level
     * @returns {string} Recommendation text
     */
    getRecommendation(level) {
        const recommendations = {
            critical: 'ACCIÓN INMEDIATA REQUERIDA: Contactar al estudiante de inmediato. Considerar intervención de emergencia.',
            high: 'ALTA PRIORIDAD: Responder dentro de las próximas 2 horas. Evaluar necesidad de intervención.',
            moderate: 'PRIORIDAD MEDIA: Responder dentro del mismo día. Monitorear de cerca.',
            none: 'Seguimiento estándar según protocolo.'
        };
        return recommendations[level] || recommendations.none;
    },

    /**
     * Auto-escalate urgency based on crisis detection
     * @param {string} currentUrgency - Current urgency level
     * @param {Object} analysis - Crisis analysis result
     * @returns {string} Adjusted urgency level
     */
    adjustUrgency(currentUrgency, analysis) {
        if (analysis.crisisLevel === 'critical') return 'urgente';
        if (analysis.crisisLevel === 'high') return 'alta';
        if (analysis.crisisLevel === 'moderate' && currentUrgency === 'baja') return 'media';
        return currentUrgency;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrisisDetection;
}
