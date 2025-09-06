/* ===== SKELETON LOADING SYSTEM ===== */

class SkeletonSystem {
  constructor() {
    this.skeletons = new Map();
  }

  // Create skeleton for table rows
  createTableSkeleton(rows = 5, columns = 4) {
    const skeletonId = this.generateId();
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-table';
    skeleton.setAttribute('data-skeleton-id', skeletonId);

    let rowsHTML = '';
    for (let i = 0; i < rows; i++) {
      let cellsHTML = '';
      for (let j = 0; j < columns; j++) {
        const width = j === 0 ? 'long' : j === columns - 1 ? 'short' : 'medium';
        cellsHTML += `<div class="skeleton-cell"><div class="skeleton skeleton-text ${width}"></div></div>`;
      }
      rowsHTML += `<div class="skeleton-row">${cellsHTML}</div>`;
    }

    skeleton.innerHTML = `
      <div class="skeleton-header">
        ${Array.from({ length: columns }, (_, i) => 
          `<div class="skeleton-cell"><div class="skeleton skeleton-text medium"></div></div>`
        ).join('')}
      </div>
      ${rowsHTML}
    `;

    this.skeletons.set(skeletonId, skeleton);
    return { id: skeletonId, element: skeleton };
  }

  // Create skeleton for KPI cards
  createKPISkeleton(count = 4) {
    const skeletonId = this.generateId();
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-kpi-grid';
    skeleton.setAttribute('data-skeleton-id', skeletonId);

    let cardsHTML = '';
    for (let i = 0; i < count; i++) {
      cardsHTML += `
        <div class="skeleton-kpi-card">
          <div class="skeleton-kpi-header">
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-icon"></div>
          </div>
          <div class="skeleton skeleton-text long" style="height: 2.5rem; margin-bottom: 0.5rem;"></div>
          <div class="skeleton skeleton-text medium"></div>
        </div>
      `;
    }

    skeleton.innerHTML = cardsHTML;
    this.skeletons.set(skeletonId, skeleton);
    return { id: skeletonId, element: skeleton };
  }

  // Create skeleton for card list
  createCardSkeleton(count = 3) {
    const skeletonId = this.generateId();
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card-list';
    skeleton.setAttribute('data-skeleton-id', skeletonId);

    let cardsHTML = '';
    for (let i = 0; i < count; i++) {
      cardsHTML += `
        <div class="skeleton-card">
          <div class="skeleton-card-header">
            <div class="skeleton skeleton-text medium"></div>
            <div class="skeleton skeleton-badge"></div>
          </div>
          <div class="skeleton-card-body">
            <div class="skeleton skeleton-text long"></div>
            <div class="skeleton skeleton-text medium"></div>
            <div class="skeleton skeleton-text short"></div>
          </div>
        </div>
      `;
    }

    skeleton.innerHTML = cardsHTML;
    this.skeletons.set(skeletonId, skeleton);
    return { id: skeletonId, element: skeleton };
  }

  // Create skeleton for form
  createFormSkeleton(fields = 4) {
    const skeletonId = this.generateId();
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-form';
    skeleton.setAttribute('data-skeleton-id', skeletonId);

    let fieldsHTML = '';
    for (let i = 0; i < fields; i++) {
      fieldsHTML += `
        <div class="skeleton-field">
          <div class="skeleton skeleton-text short" style="width: 30%; margin-bottom: 0.5rem;"></div>
          <div class="skeleton skeleton-input"></div>
        </div>
      `;
    }

    skeleton.innerHTML = fieldsHTML;
    this.skeletons.set(skeletonId, skeleton);
    return { id: skeletonId, element: skeleton };
  }

  // Show skeleton in container
  show(container, skeletonType, options = {}) {
    let skeleton;
    
    switch (skeletonType) {
      case 'table':
        skeleton = this.createTableSkeleton(options.rows, options.columns);
        break;
      case 'kpi':
        skeleton = this.createKPISkeleton(options.count);
        break;
      case 'cards':
        skeleton = this.createCardSkeleton(options.count);
        break;
      case 'form':
        skeleton = this.createFormSkeleton(options.fields);
        break;
      default:
        skeleton = this.createTableSkeleton();
    }

    container.appendChild(skeleton.element);
    return skeleton.id;
  }

  // Hide skeleton
  hide(skeletonId) {
    const skeleton = this.skeletons.get(skeletonId);
    if (skeleton && skeleton.element.parentNode) {
      skeleton.element.style.opacity = '0';
      skeleton.element.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (skeleton.element.parentNode) {
          skeleton.element.parentNode.removeChild(skeleton.element);
        }
        this.skeletons.delete(skeletonId);
      }, 300);
    }
  }

  // Hide all skeletons
  hideAll() {
    this.skeletons.forEach((skeleton, id) => {
      this.hide(id);
    });
  }

  generateId() {
    return 'skeleton-' + Math.random().toString(36).substr(2, 9);
  }
}

// Add skeleton styles
const skeletonStyles = document.createElement('style');
skeletonStyles.textContent = `
  .skeleton-table {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .skeleton-header {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-4);
    padding: var(--space-4);
    background-color: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-primary);
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-4);
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-primary);
  }

  .skeleton-row:last-child {
    border-bottom: none;
  }

  .skeleton-cell {
    display: flex;
    align-items: center;
  }

  .skeleton-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-6);
  }

  .skeleton-kpi-card {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    position: relative;
    overflow: hidden;
  }

  .skeleton-kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .skeleton-kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .skeleton-icon {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
  }

  .skeleton-card-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .skeleton-card {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .skeleton-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .skeleton-card-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .skeleton-badge {
    width: 60px;
    height: 20px;
    border-radius: var(--radius-full);
  }

  .skeleton-input {
    height: 40px;
    border-radius: var(--radius-md);
  }

  .skeleton-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .skeleton-field {
    display: flex;
    flex-direction: column;
  }
`;
document.head.appendChild(skeletonStyles);

// Create global instance
window.skeleton = new SkeletonSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkeletonSystem;
}