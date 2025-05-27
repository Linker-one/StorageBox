import { globalState } from './globals.js';
import { APIService } from './api-service.js';
import { updateView } from './file-list.js';

// 常量定义
const CLIPBOARD_ACTION = {
    COPY: 'copy',
    CUT: 'cut',
    PASTE: 'paste'
};

// DOM 元素引用
const domElements = {
    copyBtn: null,
    cutBtn: null,
    pasteBtn: null,
    selectBtn: null,
    selectAllBtn: null
};

// 状态管理
const clipboardState = {
    actionType: null,
    sourcePath: null,
    destinationPath: null,
    items: []
};

/* 初始化剪贴板模块 */
export function initClipboard() {
    cacheDOMElements();
    setupClipboardEvents();
}

// ================ 主逻辑实现 ================ //

/**
 * 1. 统一事件管理系统
 * 使用集中式配置管理所有剪贴板操作
 */
function setupClipboardEvents() {
    const eventMap = {
        'copy': handleCopy,
        'cut': handleCut,
        'paste': handlePaste
    };

    Object.entries(eventMap).forEach(([className, handler]) => {
        const btn = document.querySelector(`.toolbar .${className}`);
        if (btn) {
            btn.addEventListener('click', handler);
            domElements[`${className}Btn`] = btn;
        }
    });
}

/**
 * 2. 剪贴板操作核心逻辑
 * 合并复制/剪切流程，使用状态机管理
 */
function handleClipboardAction(actionType) {
    const isSameAction = clipboardState.actionType === actionType;
    
    if (domElements[`${actionType}Btn`]?.classList.contains('active') && isSameAction) {
        resetClipboardState();
    }

    // 切换操作状态
    toggleActionState(actionType, isSameAction);

    if (!document.querySelector('.file-item.selected')) return;

    if (!isSameAction) {
        updateClipboardState(actionType);
    }
}

/**
 * 3. 粘贴操作优化
 * 增加前置验证和状态清理
 */
function handlePaste() {
    if (!validatePasteConditions()) return;

    clipboardState.destinationPath = globalState.Paths[globalState.indexPath];
    
    APIService('/paste', clipboardState, 'POST')
        .then(handlePasteSuccess)
        .catch(handlePasteError);
}

// ================ 辅助函数 ================ //

/* 缓存DOM元素 */
function cacheDOMElements() {
    domElements.selectBtn = document.querySelector('.toolbar .select');
    domElements.selectAllBtn = document.querySelector('.toolbar .select-all');
}

/* 切换操作按钮状态 */
function toggleActionState(actionType, isSameAction) {
    // 重置所有操作按钮状态
    [domElements.copyBtn, domElements.cutBtn].forEach(btn => {
        btn?.classList.remove('active');
    });
    
    if (!isSameAction) {
        domElements[`${actionType}Btn`]?.classList.add('active');
    }
}

/* 更新剪贴板状态 */
function updateClipboardState(actionType) {
    clipboardState.actionType = actionType;
    clipboardState.sourcePath = globalState.Paths[globalState.indexPath];
    clipboardState.items = getSelectedItemsData();
}

/* 获取选中项数据 */
function getSelectedItemsData() {
    return Array.from(document.querySelectorAll('.file-item.selected'))
        .map(item => ({
            name: item.querySelector('.file-name')?.textContent.trim() || '',
            type: item.querySelector('.file-type')?.textContent.trim() || ''
        }))
        .filter(item => item.name && item.type);
}

/* 验证粘贴条件 */
function validatePasteConditions() {
    if (!clipboardState.items.length) return false;

    if (clipboardState.sourcePath === globalState.Paths[globalState.indexPath])
        return false;

    return true;
}

/* 处理粘贴成功 */
function handlePasteSuccess(response) {
    globalState.fileList = response;
    updateView();
    resetClipboardState();
    clearSelectionStates();
}

/* 处理粘贴错误 */
function handlePasteError(error) {
    console.error('粘贴操作失败:', error);
    alert(`粘贴失败: ${error.message}`);
    // 保留原始剪贴板状态以便重试
}

/* 重置剪贴板状态 */
function resetClipboardState() {
    clipboardState.actionType = null;
    clipboardState.sourcePath = null;
    clipboardState.items = [];
    clipboardState.destinationPath = null;
}

/* 清除选择状态 */
function clearSelectionStates() {
    [domElements.copyBtn, domElements.cutBtn, domElements.selectBtn, domElements.selectAllBtn]
        .forEach(btn => btn?.classList.remove('active'));
}

// ================ 暴露的快捷操作 ================ //

function handleCopy() {
    handleClipboardAction(CLIPBOARD_ACTION.COPY);
}

function handleCut() {
    handleClipboardAction(CLIPBOARD_ACTION.CUT);
}

/* 清理函数 */
export function cleanupClipboard() {
    Object.values(domElements).forEach(el => {
        if (el && el.removeEventListener) {
            el.replaceWith(el.cloneNode(true));
        }
    });
    resetClipboardState();
}
