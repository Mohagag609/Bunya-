/* 🎯 النسخة الأولى - مدير الاستثمار العقاري */

/* ===== ALPHA APP ===== */
class AlphaApp {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupAlphaApp();
    }
    
    setupAlphaApp() {
        console.log('Alpha app initialized! 🎯');
    }
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    window.alphaApp = new AlphaApp();
});

/* ===== EXPORT ===== */
window.AlphaApp = AlphaApp;