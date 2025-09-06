/* 🎯 النسخة التاسعة - مدير الاستثمار العقاري */

/* ===== IOTA APP ===== */
class IotaApp {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupIotaApp();
    }
    
    setupIotaApp() {
        console.log('Iota app initialized! 🎯');
    }
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    window.iotaApp = new IotaApp();
});

/* ===== EXPORT ===== */
window.IotaApp = IotaApp;