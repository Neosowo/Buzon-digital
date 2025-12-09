// ============================================
// ANALYTICS MODULE
// ============================================

const AnalyticsSystem = {
    /**
     * Get all messages for analytics
     */
    getMessages() {
        const messages = localStorage.getItem('vocesAnonimas_messages');
        return messages ? JSON.parse(messages) : [];
    },

    /**
     * Get total message count
     */
    getTotalMessages() {
        return this.getMessages().length;
    },

    /**
     * Get messages by status
     * @param {string} status - Message status
     */
    getByStatus(status) {
        return this.getMessages().filter(m => m.status === status);
    },

    /**
     * Get urgent cases count
     */
    getUrgentCases() {
        const messages = this.getMessages();
        return messages.filter(m =>
            m.urgency === 'urgente' || m.crisisDetected
        ).length;
    },

    /**
     * Get pending messages count
     */
    getPendingCount() {
        const messages = this.getMessages();
        return messages.filter(m =>
            m.status === 'new' || m.status === 'in-review'
        ).length;
    },

    /**
     * Get resolved messages count
     */
    getResolvedCount() {
        return this.getByStatus('resolved').length;
    },

    /**
     * Get category distribution
     */
    getCategoryDistribution() {
        const messages = this.getMessages();
        const distribution = {};

        messages.forEach(m => {
            distribution[m.category] = (distribution[m.category] || 0) + 1;
        });

        return distribution;
    },

    /**
     * Get urgency distribution
     */
    getUrgencyDistribution() {
        const messages = this.getMessages();
        const distribution = {
            baja: 0,
            media: 0,
            alta: 0,
            urgente: 0
        };

        messages.forEach(m => {
            distribution[m.urgency] = (distribution[m.urgency] || 0) + 1;
        });

        return distribution;
    },

    /**
     * Get messages by date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     */
    getByDateRange(startDate, endDate) {
        const messages = this.getMessages();
        return messages.filter(m => {
            const msgDate = new Date(m.timestamp);
            return msgDate >= startDate && msgDate <= endDate;
        });
    },

    /**
     * Get messages per day (last 30 days)
     */
    getMessagesPerDay(days = 30) {
        const messages = this.getMessages();
        const data = {};
        const today = new Date();

        // Initialize all days
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            data[dateStr] = 0;
        }

        // Count messages per day
        messages.forEach(m => {
            const msgDate = new Date(m.timestamp);
            const dateStr = msgDate.toISOString().split('T')[0];
            if (data.hasOwnProperty(dateStr)) {
                data[dateStr]++;
            }
        });

        return data;
    },

    /**
     * Get average response time (in hours)
     */
    getAverageResponseTime() {
        const messages = this.getMessages().filter(m => m.replies && m.replies.length > 0);

        if (messages.length === 0) return 0;

        const totalTime = messages.reduce((sum, m) => {
            const msgTime = new Date(m.timestamp);
            const firstReply = new Date(m.replies[0].timestamp);
            const diff = (firstReply - msgTime) / (1000 * 60 * 60); // hours
            return sum + diff;
        }, 0);

        return (totalTime / messages.length).toFixed(1);
    },

    /**
     * Get resolution rate
     */
    getResolutionRate() {
        const total = this.getTotalMessages();
        if (total === 0) return 0;

        const resolved = this.getResolvedCount();
        return ((resolved / total) * 100).toFixed(1);
    },

    /**
     * Get crisis detection stats
     */
    getCrisisStats() {
        const messages = this.getMessages();
        const crisisMessages = messages.filter(m => m.crisisDetected);

        return {
            total: crisisMessages.length,
            critical: crisisMessages.filter(m => m.crisisLevel === 'critical').length,
            high: crisisMessages.filter(m => m.crisisLevel === 'high').length,
            moderate: crisisMessages.filter(m => m.crisisLevel === 'moderate').length
        };
    },

    /**
     * Get peak hours (messages by hour of day)
     */
    getPeakHours() {
        const messages = this.getMessages();
        const hours = Array(24).fill(0);

        messages.forEach(m => {
            const hour = new Date(m.timestamp).getHours();
            hours[hour]++;
        });

        return hours;
    },

    /**
     * Get peak days (messages by day of week)
     */
    getPeakDays() {
        const messages = this.getMessages();
        const days = Array(7).fill(0);
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        messages.forEach(m => {
            const day = new Date(m.timestamp).getDay();
            days[day]++;
        });

        return days.map((count, index) => ({
            day: dayNames[index],
            count
        }));
    },

    /**
     * Generate summary report
     */
    generateReport() {
        return {
            overview: {
                total: this.getTotalMessages(),
                urgent: this.getUrgentCases(),
                pending: this.getPendingCount(),
                resolved: this.getResolvedCount(),
                avgResponseTime: this.getAverageResponseTime(),
                resolutionRate: this.getResolutionRate()
            },
            categories: this.getCategoryDistribution(),
            urgencies: this.getUrgencyDistribution(),
            crisis: this.getCrisisStats(),
            trends: {
                daily: this.getMessagesPerDay(),
                peakHours: this.getPeakHours(),
                peakDays: this.getPeakDays()
            }
        };
    },

    /**
     * Export report to JSON
     */
    exportReport() {
        const report = this.generateReport();
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `voces-anonimas-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    },

    /**
     * Render analytics dashboard
     */
    renderDashboard() {
        const report = this.generateReport();

        // Update KPIs
        document.getElementById('kpiTotal').textContent = report.overview.total;
        document.getElementById('kpiUrgent').textContent = report.overview.urgent;
        document.getElementById('kpiPending').textContent = report.overview.pending;
        document.getElementById('kpiResolved').textContent = report.overview.resolved;
        document.getElementById('kpiAvgResponse').textContent = `${report.overview.avgResponseTime}h`;
        document.getElementById('kpiResolutionRate').textContent = `${report.overview.resolutionRate}%`;

        // Render charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.renderCharts(report);
        }
    },

    /**
     * Render charts using Chart.js
     * @param {Object} report - Analytics report
     */
    renderCharts(report) {
        // Category distribution pie chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx) {
            new Chart(categoryCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(report.categories),
                    datasets: [{
                        data: Object.values(report.categories),
                        backgroundColor: [
                            '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
                            '#10b981', '#3b82f6', '#ef4444', '#6b7280'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Daily trend line chart
        const trendCtx = document.getElementById('trendChart');
        if (trendCtx) {
            const dailyData = report.trends.daily;
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: Object.keys(dailyData),
                    datasets: [{
                        label: 'Mensajes por Día',
                        data: Object.values(dailyData),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Urgency distribution bar chart
        const urgencyCtx = document.getElementById('urgencyChart');
        if (urgencyCtx) {
            new Chart(urgencyCtx, {
                type: 'bar',
                data: {
                    labels: ['Baja', 'Media', 'Alta', 'Urgente'],
                    datasets: [{
                        label: 'Mensajes por Urgencia',
                        data: [
                            report.urgencies.baja,
                            report.urgencies.media,
                            report.urgencies.alta,
                            report.urgencies.urgente
                        ],
                        backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsSystem;
}
