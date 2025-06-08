import { toggleView } from './file-list.js';

// =============== 视图按键相关逻辑 ============== //
export {
    initViewMode,           // 初始化
    getCurrentViewMode      // 获取当前视图模式
};

let currentViewMode;

// DOM 元素选中器
const SELECTORS = {
    MAX_VIEW_BTN: '.toolbar .max-view',
    MID_VIEW_BTN: '.toolbar .mid-view',
    MIN_VIEW_BTN: '.toolbar .min-view'
};

// DOM 引用缓存
const domElements = {
    maxViewBtn: null,
    midViewBtn: null,
    minViewBtn: null
};

function initViewMode() {
    cacheDOMElements();
    setupViewModeEvents();

    // 初始化视图:min
    domElements.maxViewBtn.classList.remove('active');
    domElements.midViewBtn.classList.remove('active');
    domElements.minViewBtn.classList.add('active');
    currentViewMode = 'min';
}

function cacheDOMElements() {
    domElements.maxViewBtn = document.querySelector(SELECTORS.MAX_VIEW_BTN);
    domElements.midViewBtn = document.querySelector(SELECTORS.MID_VIEW_BTN);
    domElements.minViewBtn = document.querySelector(SELECTORS.MIN_VIEW_BTN);
}

function setupViewModeEvents() {
    domElements.maxViewBtn.addEventListener('click', () => toggleViewMode('max'));
    domElements.midViewBtn.addEventListener('click', () => toggleViewMode('mid'));
    domElements.minViewBtn.addEventListener('click', () => toggleViewMode('min'));
}

// ================= 视图模式按钮 ================ //

function toggleViewMode(mode) {
    if (currentViewMode === mode) return;
    currentViewMode = mode;

    // 更新按钮状态
    domElements.maxViewBtn.classList.remove('active');
    domElements.midViewBtn.classList.remove('active');
    domElements.minViewBtn.classList.remove('active');
    domElements.maxViewBtn.classList.toggle('active', mode === 'max');
    domElements.midViewBtn.classList.toggle('active', mode === 'mid');
    domElements.minViewBtn.classList.toggle('active', mode === 'min');

    // 触发视图切换
    toggleView();
}

// ================= 其他 ================= //

function getCurrentViewMode() {
    return currentViewMode;
}