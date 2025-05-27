import { globalState } from './globals.js';
import { updateView } from './file-list.js';

let maxViewBtn, midViewBtn, minViewBtn;

export function initViewMode() {
    maxViewBtn = document.querySelector('.toolbar .max-view');
    midViewBtn = document.querySelector('.toolbar .mid-view');
    minViewBtn = document.querySelector('.toolbar .min-view');

    maxViewBtn.addEventListener('click', () => setViewMode('max'));
    midViewBtn.addEventListener('click', () => setViewMode('mid'));
    minViewBtn.addEventListener('click', () => setViewMode('min'));

    // 初始化当前视图模式
    setViewMode(globalState.currentView);
}

function setViewMode(mode) {
    globalState.currentView = mode;

    // 更新按钮状态
    maxViewBtn.classList.toggle('active', mode === 'max');
    midViewBtn.classList.toggle('active', mode === 'mid');
    minViewBtn.classList.toggle('active', mode === 'min');

    // 触发视图更新
    updateView();
}