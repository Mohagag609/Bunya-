/* 🎯 النسخة الثالثة والعشرون - مدير الاستثمار العقاري */

/* ===== PSI APP ===== */
class PsiApp {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupPsiApp();
    }
    
    setupPsiApp() {
        console.log('Psi app initialized! 🎯');
    }
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    window.psiApp = new PsiApp();
});

/* ===== EXPORT ===== */
window.PsiApp = PsiApp;