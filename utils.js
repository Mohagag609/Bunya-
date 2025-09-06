import { state, saveState } from './state.js';
import { persist } from './data.js';
import { nav } from './app.js';

/* ===== UTILS & HELPERS ===== */
export function uid(p){ return p+'-'+Math.random().toString(36).slice(2,9); }
export function today(){ return new Date().toISOString().slice(0,10); }
export function logAction(description, details = {}) { if (!state.auditLog) state.auditLog = []; state.auditLog.push({ id: uid('LOG'), timestamp: new Date().toISOString(), description, details }); }
export const fmt = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function egp(v){ v=Number(v||0); return isFinite(v)?fmt.format(v)+' ج.م':'' }
export function applySettings(){ if(state && state.settings) { document.documentElement.setAttribute('data-theme', state.settings.theme||'dark'); document.documentElement.style.fontSize=(state.settings.font||16)+'px'; } }
export function checkLock(){ if(state.locked){ const p=prompt('اكتب كلمة المرور للدخول'); if(p!==state.settings.pass){ alert('كلمة مرور غير صحيحة'); location.reload(); } } }
export function unitById(id){ return state.units.find(u=>u.id===id); }
export function custById(id){ return state.customers.find(c=>c.id===id); }
export function partnerById(id){ return state.partners.find(p=>p.id===id); }
export function brokerById(id){ return state.brokers.find(b=>b.id===id); }
export function unitCode(id){ return (unitById(id)||{}).code||'—'; }
export function getUnitDisplayName(unit) { if (!unit) return '—'; const name = unit.name ? `اسم الوحدة (${unit.name})` : ''; const floor = unit.floor ? `رقم الدور (${unit.floor})` : ''; const building = unit.building ? `رقم العمارة (${unit.building})` : ''; return [name, floor, building].filter(Boolean).join(' '); }
export function parseNumber(v){ v=String(v||'').replace(/[^\d.]/g,''); return Number(v||0); }
export function exportCSV(headers, rows, name){
  const csv=[headers.join(','), ...rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
}
export function delRow(coll,id) {
  const nameMap = {
    customers: 'العميل',
    units: 'الوحدة',
    partners: 'الشريك',
    unitPartners: 'ربط شريك بوحدة',
    contracts: 'العقد',
    installments: 'القسط',
    safes: 'الخزنة'
  };
  const collName = nameMap[coll] || coll;
  const itemToDelete = state[coll] ? state[coll].find(x=>x.id===id) : undefined;
  const itemName = itemToDelete?.name || itemToDelete?.code || id;

  if(confirm(`هل أنت متأكد من حذف ${collName} "${itemName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)){
    saveState();
    logAction(`حذف ${collName}`, { collection: coll, id, deletedItem: JSON.stringify(itemToDelete) });
    state[coll]=state[coll].filter(x=>x.id!==id);
    persist();
    if (coll === 'unitPartners') {
      nav('unit-details', itemToDelete.unitId);
    } else {
      nav(coll);
    }
  }
}

export function inlineUpd(coll,id,key,val){
  saveState();
  const o=state[coll].find(x=>x.id===id);
  if(o){
    const oldValue = o[key];
    o[key]=val;
    logAction(`تعديل مباشر في ${coll}`, { collection: coll, id, key, oldValue, newValue: val });
    persist();
  }
};
