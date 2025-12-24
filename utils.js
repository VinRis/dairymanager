const utils = {
    formatCurrency(value, currency = 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
    },

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    async exportToCSV(data, filename) {
        if (!data.length) return alert('No data to export');
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    async backupData() {
        const stores = ['settings', 'production', 'finance', 'health', 'inventory'];
        const backup = {};
        for (const store of stores) {
            backup[store] = await db.getAll(store);
        }
        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dairy_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    },

    async restoreData(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                for (const store in data) {
                    await db.clearStore(store);
                    for (const item of data[store]) {
                        await db.save(store, item);
                    }
                }
                alert('Restore successful! Restarting...');
                window.location.reload();
            } catch (err) {
                alert('Invalid backup file');
            }
        };
        reader.readAsText(file);
    },

    async generatePDF(farmInfo, production, finance, inventory) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(22, 163, 74);
        doc.text(farmInfo.farmName || 'Dairy Manager Pro Report', 20, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Manager: ${farmInfo.managerName || 'N/A'}`, 20, 30);
        doc.text(`Location: ${farmInfo.location || 'N/A'}`, 20, 37);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 44);

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('Production Summary', 20, 60);
        doc.setFontSize(10);
        let y = 70;
        production.slice(-5).forEach(p => {
            doc.text(`${p.date}: ${p.amount} Liters - ${p.cattleId}`, 25, y);
            y += 7;
        });

        doc.text('Inventory Status', 20, y + 10);
        y += 20;
        inventory.forEach(i => {
            doc.text(`${i.itemName}: ${i.quantity} ${i.unit}`, 25, y);
            y += 7;
        });

        doc.save(`${farmInfo.farmName}_Report.pdf`);
    },

    renderChart(ctx, labels, data, label = 'Production') {
        if (window.myChart) window.myChart.destroy();
        window.myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};
