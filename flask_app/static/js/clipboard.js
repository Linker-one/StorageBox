import { APIService } from './api-service.js';
import { updateView } from './file-list.js';
import { getCurrentPath } from './navigation.js';
import { getSelectedItemsData, hasSelectedItems, clearAllSelections } from './selection.js';

// ================= 剪切板与相关按键逻辑 =============== //
export {
    initClipboard   // 初始化
};

// DOM 元素引用
const domElements = {
    copyBtn: null,
    cutBtn: null,
    pasteBtn: null,
};

// DOM 元素选中器
const SELECTORS = {
    COPY_BTN: '.toolbar .copy',
    CUT_BTN: '.toolbar .cut',
    PASTE_BTN: '.toolbar .paste',
};

// 剪贴板状态（明确属性用途）
const clipboardState = {
    operation: null,         // 当前操作类型（copy/cut）
    sourcePath: null,        // 源路径
    destinationPath: null,   // 粘贴目标路径
    items: []                // 操作的文件列表
};

/* 初始化剪贴板模块 */
function initClipboard() {
    cacheDOMElements();
    setupClipboardEvents();
}

/** 缓存DOM元素 */
function cacheDOMElements() {
    domElements.copyBtn = document.querySelector(SELECTORS.COPY_BTN);
    domElements.cutBtn = document.querySelector(SELECTORS.CUT_BTN);
    domElements.pasteBtn = document.querySelector(SELECTORS.PASTE_BTN);
}

/** 设置剪贴板事件监听 */
function setupClipboardEvents() {
    domElements.copyBtn.addEventListener('click', () => handleClipboardOperation('copy'));
    domElements.cutBtn.addEventListener('click', () => handleClipboardOperation('cut'));
    domElements.pasteBtn.addEventListener('click', handlePaste);
}

// ================ 复制/剪切按钮逻辑 ================ //

/** 处理剪贴板操作（copy/cut/） */
function handleClipboardOperation(operation) {
    const isSameOperation = clipboardState.operation === operation;
    const isButtonActive = domElements[`${operation}Btn`].classList.contains('active');

    // 相同操作且按钮已激活：取消操作
    if (isSameOperation && isButtonActive) {
        resetClipboardState();
        return;
    }

    // 更新状态
    updateClipboardOperation(operation);
}

/** 复制/剪切时更新剪贴板状态 */
function updateClipboardOperation(operation) {
    if (!hasSelectedItems()) return;

    // 更新UI按钮状态
    resetClipboardButtons();
    domElements[`${operation}Btn`].classList.add('active');

    // 更新剪贴板数据
    clipboardState.operation = operation;
    clipboardState.sourcePath = getCurrentPath();
    clipboardState.items = getSelectedItemsData();
}

// ================== 粘贴按钮逻辑 ================== //

/** 处理粘贴操作 */
function handlePaste() {
    if (!validatePaste()) return;

    clipboardState.destinationPath = getCurrentPath();

    APIService('/paste', clipboardState, 'POST')
    .then(response => {
        updateView(response);
        resetClipboardState();
        clearAllSelections();
    })
    .catch(showPasteError);
}

// ================ 工具函数 ================ //

/** 检查是否可以粘贴 */
function validatePaste() {
    if (!clipboardState.operation) {
        // console.warn('未执行复制/剪切操作');
        return false;
    }
    if (!clipboardState.items.length) {
        // console.warn('剪贴板为空');
        return false;
    }
    if (clipboardState.sourcePath === getCurrentPath()) {
        // console.warn('不能粘贴到相同目录');
        return false;
    }
    return true;
}

/** 重置所有剪贴板按钮状态 */
function resetClipboardButtons() {
    [domElements.copyBtn, domElements.cutBtn].forEach(btn => {
        btn?.classList.remove('active');
    });
}

/** 重置剪贴板数据 */
function resetClipboardState() {
    clipboardState.operation = null;
    clipboardState.sourcePath = null;
    clipboardState.items = [];
    clipboardState.destinationPath = null;
    resetClipboardButtons();
}

/** 显示粘贴错误 */
function showPasteError(error) {
    console.error('粘贴失败:', error);
    alert(`操作失败: ${error.message || '服务器错误'}`);
}
