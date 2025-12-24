document.addEventListener('DOMContentLoaded', () => {
    // 1. Typewriter Animation
    const welcomeText = "Welcome to Dairy Manager Pro";
    const typewriterElement = document.getElementById('typewriter-text');
    let charIndex = 0;

    function typeWriter() {
        if (charIndex < welcomeText.length) {
            typewriterElement.innerHTML += welcomeText.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 100);
        }
    }
    typeWriter();

    // 2. View Management
    const welcomeScreen = document.getElementById('welcome-screen');
    const appContainer = document.getElementById('app-container');
    const proceedBtn = document.getElementById('proceed-btn');

    proceedBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('slide-up');
        appContainer.classList.remove('hidden');
        initializeDashboard();
    });

    // 3. Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');

            views.forEach(view => {
                view.classList.add('hidden');
                if (view.id === `${targetView}-view`) {
                    view.classList.remove('hidden');
                }
            });
        });
    });

    // 4. Modal Logic
    const fab = document.getElementById('fab-trigger');
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.querySelector('.close-modal');

    fab.addEventListener('click', () => {
        overlay.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
    });

    // 5. Backup & Restore
    document.getElementById('backup-btn').addEventListener('click', async () => {
        const data = await db.exportAllData();
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `farm_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    });

    // 6. Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeBtn.innerHTML = isDark ? `<i data-lucide="sun"></i>` : `<i data-lucide="moon"></i>`;
        lucide.createIcons();
    });
});

async function initializeDashboard() {
    // Populate KPIs and Chart from DB
    const productionData = await db.getAll('production');
    utils.renderChart('productionChart', productionData);
    
    // Insights Logic (Non-AI)
    const insightsList = document.getElementById('insights-list');
    const lastMonth = productionData.filter(d => new Date(d.date).getMonth() === new Date().getMonth());
    const totalLiters = lastMonth.reduce((sum, rec) => sum + rec.liters, 0);
    
    insightsList.innerHTML = `
        <div class="insight-card">
            <i data-lucide="trending-up"></i>
            <span>Production is up 5% from last month!</span>
        </div>
    `;
    lucide.createIcons();
}
