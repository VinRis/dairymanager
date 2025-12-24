const app = {
    settings: {
        farmName: 'My Dairy Farm',
        managerName: '',
        location: 'Not Set',
        currency: 'USD',
        theme: 'light'
    },

    async init() {
        lucide.createIcons();
        await db.init();
        await this.loadSettings();
        this.setupEventListeners();
        this.checkNotifications();
    },

    async loadSettings() {
        const saved = await db.getAll('settings');
        if (saved.length > 0) {
            this.settings = { ...this.settings, ...saved[0] };
            document.getElementById('header-farm-name').textContent = this.settings.farmName;
            document.getElementById('header-location').textContent = this.settings.location;
            document.body.setAttribute('data-theme', this.settings.theme);
            
            // Fill settings form
            document.getElementById('set-farm-name').value = this.settings.farmName;
            document.getElementById('set-manager-name').value = this.settings.managerName;
            document.getElementById('set-location').value = this.settings.location;
            document.getElementById('set-currency').value = this.settings.currency;
            document.getElementById('theme-toggle').checked = this.settings.theme === 'dark';
        }
    },

    setupEventListeners() {
        // Proceed from Welcome
        document.getElementById('proceed-btn').addEventListener('click', () => {
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
            this.updateDashboard();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // FAB Modal
        document.getElementById('main-fab').addEventListener('click', () => {
            document.getElementById('fab-modal').classList.add('active');
        });

        // Settings Form
        document.getElementById('settings-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newSettings = {
                id: 1,
                farmName: formData.get('farmName'),
                managerName: formData.get('managerName'),
                location: formData.get('location'),
                currency: formData.get('currency'),
                theme: document.getElementById('theme-toggle').checked ? 'dark' : 'light'
            };
            await db.save('settings', newSettings);
            location.reload();
        });

        // Chart Toggle
        document.getElementById('chart-toggle').addEventListener('change', () => this.updateDashboard());
        
        // Modal Backdrop closing
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.addEventListener('click', (e) => {
                if(e.target === m) this.closeModals();
            });
        });
    },

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const activeView = document.getElementById(`view-${viewId}`);
        const activeNav = document.querySelector(`[data-view="${viewId}"]`);
        
        if (activeView) activeView.classList.add('active');
        if (activeNav) activeNav.classList.add('active');

        this.closeModals();

        // Refresh specific view data
        if (viewId === 'dashboard') this.updateDashboard();
        if (viewId === 'history') this.loadHistory();
        if (viewId === 'finance') this.loadFinance();
        if (viewId === 'health') this.loadHealth();
        if (viewId === 'reports') this.loadReports();
    },

    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    },

    async updateDashboard() {
        const production = await db.getAll('production');
        const finance = await db.getAll('finance');
        
        // KPI: Today's Milk
        const todayStr = new Date().toISOString().split('T')[0];
        const todayMilk = production
            .filter(p => p.date === todayStr)
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);
        document.getElementById('kpi-milk').textContent = `${todayMilk} L`;

        // KPI: Month Revenue
        const monthStr = todayStr.substring(0, 7);
        const monthRev = finance
            .filter(f => f.date.startsWith(monthStr) && f.type === 'income')
            .reduce((sum, f) => sum + parseFloat(f.amount), 0);
        document.getElementById('kpi-revenue').textContent = utils.formatCurrency(monthRev, this.settings.currency);

        // Chart
        const isAnnual = document.getElementById('chart-toggle').value === 'annual';
        const labels = [];
        const data = [];
        
        if (isAnnual) {
            const currentYear = new Date().getFullYear();
            for(let i=1; i<=12; i++) {
                const m = i.toString().padStart(2, '0');
                labels.push(m);
                const monthTotal = production
                    .filter(p => p.date.startsWith(`${currentYear}-${m}`))
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                data.push(monthTotal);
            }
        } else {
            // Last 7 days
            for(let i=6; i>=0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                labels.push(dStr.split('-')[2]); // Just day number
                const dayTotal = production
                    .filter(p => p.date === dStr)
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                data.push(dayTotal);
            }
        }
        
        const ctx = document.getElementById('prodChart').getContext('2d');
        utils.renderChart(ctx, labels, data, isAnnual ? 'Monthly Prod' : 'Daily Prod');

        // Insights
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const max = Math.max(...data);
        document.getElementById('insight-text').textContent = `Your ${isAnnual ? 'annual' : 'weekly'} average is ${avg.toFixed(1)}L. Peak production reached ${max}L. Keep it up!`;
    },

    showForm(type) {
        this.closeModals();
        const form = document.getElementById('dynamic-form');
        const title = document.getElementById('form-title');
        form.innerHTML = '';
        
        let fields = [];
        if (type === 'production') {
            title.textContent = 'Add Milk Record';
            fields = [
                { name: 'date', type: 'date', label: 'Date', value: new Date().toISOString().split('T')[0] },
                { name: 'cattleId', type: 'text', label: 'Cattle ID/Name' },
                { name: 'amount', type: 'number', label: 'Amount (Liters)' }
            ];
        } else if (type === 'finance') {
            title.textContent = 'Add Transaction';
            fields = [
                { name: 'date', type: 'date', label: 'Date', value: new Date().toISOString().split('T')[0] },
                { name: 'type', type: 'select', label: 'Type', options: ['income', 'expense'] },
                { name: 'category', type: 'text', label: 'Category (e.g. Feed, Milk Sale)' },
                { name: 'amount', type: 'number', label: 'Amount' }
            ];
        } else if (type === 'inventory') {
            title.textContent = 'Inventory Update';
            fields = [
                { name: 'itemName', type: 'text', label: 'Item Name (e.g. Hay, Salt)' },
                { name: 'quantity', type: 'number', label: 'Quantity' },
                { name: 'unit', type: 'text', label: 'Unit (kg, bags)' }
            ];
        } else if (type === 'health') {
            title.textContent = 'Health Event';
            fields = [
                { name: 'date', type: 'date', label: 'Date', value: new Date().toISOString().split('T')[0] },
                { name: 'cattleId', type: 'text', label: 'Cattle ID' },
                { name: 'event', type: 'text', label: 'Event (Vaccination, Checkup)' },
                { name: 'notes', type: 'textarea', label: 'Notes' }
            ];
        }

        fields.forEach(f => {
            const group = document.createElement('div');
            group.className = 'form-group';
            group.innerHTML = `<label>${f.label}</label>`;
            
            let input;
            if (f.type === 'select') {
                input = document.createElement('select');
                f.options.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt; o.textContent = opt.toUpperCase();
                    input.appendChild(o);
                });
            } else if (f.type === 'textarea') {
                input = document.createElement('textarea');
            } else {
                input = document.createElement('input');
                input.type = f.type;
                if(f.value) input.value = f.value;
            }
            input.name = f.name;
            input.required = true;
            group.appendChild(input);
            form.appendChild(group);
        });

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'primary mt-4';
        submit.textContent = 'Save Record';
        form.appendChild(submit);

        form.onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form));
            await db.save(type, data);
            this.closeModals();
            alert('Saved successfully');
            this.updateDashboard();
        };

        document.getElementById('form-modal').classList.add('active');
    },

    async loadHistory() {
        const container = document.getElementById('history-list');
        container.innerHTML = 'Loading...';
        
        const production = (await db.getAll('production')).map(p => ({...p, cat: 'Production'}));
        const health = (await db.getAll('health')).map(h => ({...h, cat: 'Health'}));
        
        const combined = [...production, ...health].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = combined.map(item => `
            <div class="record-item">
                <div>
                    <strong>${item.cat}: ${item.amount || item.event}</strong><br>
                    <small>${item.cattleId} | ${utils.formatDate(item.date)}</small>
                </div>
                <button onclick="app.deleteRecord('${item.cat.toLowerCase()}', ${item.id})" style="border:none; background:none; color:var(--danger)"><i data-lucide="trash-2"></i></button>
            </div>
        `).join('');
        lucide.createIcons();
    },

    async loadFinance() {
        const container = document.getElementById('finance-list');
        const transactions = await db.getAll('finance');
        
        const income = transactions.filter(t => t.type === 'income').reduce((s,t) => s + parseFloat(t.amount), 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(t.amount), 0);
        
        document.getElementById('fin-income').textContent = utils.formatCurrency(income, this.settings.currency);
        document.getElementById('fin-expense').textContent = utils.formatCurrency(expense, this.settings.currency);

        container.innerHTML = transactions.reverse().map(t => `
            <div class="record-item" style="border-left: 5px solid ${t.type === 'income' ? 'var(--primary)' : 'var(--danger)'}">
                <div>
                    <strong>${t.category}</strong><br>
                    <small>${utils.formatDate(t.date)}</small>
                </div>
                <strong>${t.type === 'income' ? '+' : '-'}${utils.formatCurrency(t.amount, this.settings.currency)}</strong>
            </div>
        `).join('');
    },

    async loadHealth() {
        const container = document.getElementById('health-list');
        const alerts = document.getElementById('health-alerts');
        const records = await db.getAll('health');
        
        const today = new Date();
        const upcoming = records.filter(r => new Date(r.date) >= today);
        
        alerts.innerHTML = upcoming.length ? upcoming.map(u => `
            <div style="font-size:0.85rem; margin-bottom:5px;">📅 ${utils.formatDate(u.date)}: ${u.event} for ${u.cattleId}</div>
        `).join('') : 'No upcoming health events';

        container.innerHTML = records.reverse().map(r => `
            <div class="record-item">
                <div>
                    <strong>${r.event}</strong><br>
                    <small>${r.cattleId} | ${utils.formatDate(r.date)}</small>
                </div>
            </div>
        `).join('');
    },

    async loadReports() {
        const invContainer = document.getElementById('inventory-list');
        const items = await db.getAll('inventory');
        invContainer.innerHTML = items.map(i => `
            <div class="record-item">
                <span>${i.itemName}</span>
                <strong>${i.quantity} ${i.unit}</strong>
            </div>
        `).join('') || 'No inventory data';
    },

    async generateFullReport() {
        const prod = await db.getAll('production');
        const fin = await db.getAll('finance');
        const inv = await db.getAll('inventory');
        utils.generatePDF(this.settings, prod, fin, inv);
    },

    async exportHistoryCSV() {
        const data = await db.getAll('production');
        utils.exportToCSV(data, 'production_history');
    },

    async deleteRecord(store, id) {
        if(confirm('Delete this record?')) {
            await db.delete(store, id);
            this.loadHistory();
        }
    },

    checkNotifications() {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }
};

window.addEventListener('DOMContentLoaded', () => app.init());
