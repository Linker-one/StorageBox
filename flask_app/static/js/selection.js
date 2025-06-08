import { getFileList } from "./file-list.js";
import { updateStatusBar } from "./status-bar.js"
import { updataDetailPage } from "./sidebar.js";

// ================= 选中项目按键相关逻辑 ================= //

export {
    initSelection,          // 初始化
    toggleItemSelection,    // 切换单个文件/文件夹的选中状态
    getSelectedItemsData,   // 获取选中的文件/文件夹数据（按ID排序后）
    getSelectedItemsId,     // 获取第一个选中文件/文件夹的ID
    hasSelectedItems,       // 判断是否有选中文件/文件夹
    clearAllSelections,     // 清空所有选中状态
    isFileSelected,         // 判断元素是否选中
    resetSelectBtn          // 重置按钮
};

// 选中文件ID列表
let selectedFileIds = [];

// DOM 元素选择器
const SELECTORS = {
    SELECT_BTN: '.toolbar .select',
    SELECT_ALL_BTN: '.toolbar .select-all',
    FILE_ITEMS: '.file-item'
};

// DOM 引用缓存
const domElements = {
    selectBtn: null,
    selectAllBtn: null
};

function initSelection() {
    cacheDOMElements();
    setupSelectionEvents();
}

/** 缓存DOM元素 */
function cacheDOMElements() {
    domElements.selectBtn = document.querySelector(SELECTORS.SELECT_BTN);
    domElements.selectAllBtn = document.querySelector(SELECTORS.SELECT_ALL_BTN);
}

/** 初始化事件监听 */
function setupSelectionEvents() {
    domElements.selectBtn.addEventListener('click', handleSelectMode);
    domElements.selectAllBtn.addEventListener('click', handleSelectAllFiles);
}

/** 处理选择模式切换 */
function handleSelectMode() {
    const isSelectModeActive = domElements.selectBtn.classList.toggle('active');
    
    // 退出选择模式时清空选中状态
    if (!isSelectModeActive) {
        domElements.selectAllBtn.classList.remove('active');
        clearAllSelections();
    }
}

// =================== 全选按钮逻辑 =================== //

/** 处理全选/取消全选 */
function handleSelectAllFiles() {
    const isSelectAllActive = domElements.selectAllBtn.classList.toggle('active');
    domElements.selectBtn.classList.toggle('active', isSelectAllActive);
    
    if (isSelectAllActive) {
        selectAllFiles();
    } else {
        clearAllSelections();
    }
}

// ======================= 核心逻辑 ===================== //

/** 切换单个文件的选中状态 */
function toggleItemSelection(element) {
    if (!element) return;
    const itemId = element.dataset.index;
    const isCurrentlySelected = isFileSelected(element);
    const isSelectBtnActive = domElements.selectBtn.classList.contains('active');
  
    if (isSelectBtnActive) {   
       if (isCurrentlySelected) {
            element.classList.remove('selected');
            const index = selectedFileIds.indexOf(itemId);
            if (index !== -1) selectedFileIds.splice(index, 1);
        } else {
            element.classList.add('selected');
            selectedFileIds.push(itemId);
        }

        domElements.selectAllBtn.classList.remove('active');
    } else {
        clearAllSelections();
        element.classList.add('selected');
        selectedFileIds.push(itemId);
        const items = getSelectedItemsData();
        updataDetailPage(items[0]);
    }

    updateStatusBar();
}

/** 
 * 获取选中的文件数据（按ID排序后）
 * @return {Array|null} 返回 fileList 的片段（直接引用原数组元素），若无选中返回 null
 */
function getSelectedItemsData() {
    if (!hasSelectedItems()) return null;

    const fileList = getFileList();

    // 按索引排序并映射到 fileList 中的原始项
    return [...selectedFileIds]
        .sort((a, b) => a - b)
        .map(id => fileList[id]);
}

function getSelectedItemsId() {
    if (!hasSelectedItems()) return -1;
    return selectedFileIds;
}

/** 全选所有文件 */
function selectAllFiles() {
    const fileList = getFileList();
    selectedFileIds = Array.from({ length: fileList.length }, (_, i) => String(i));

    document.querySelectorAll(SELECTORS.FILE_ITEMS).forEach(item => {
        item.classList.add('selected');
    });
    updateStatusBar();
}

/** 清空所有选中状态 */
function clearAllSelections() {
    document.querySelectorAll(SELECTORS.FILE_ITEMS).forEach(item => {
        item.classList.remove('selected');
    });
    selectedFileIds.length = 0;
    updataDetailPage();
    updateStatusBar();
}


/** 判断是否有选中文件 */
function hasSelectedItems() {
    return selectedFileIds.length > 0;
}

/** 检查文件是否选中 */
function isFileSelected(element) {
    return element && selectedFileIds.includes(element.dataset.index);
}

function resetSelectBtn() {
    clearAllSelections();
    domElements.selectAllBtn.classList.remove('active');
    domElements.selectBtn.classList.remove('active');
}