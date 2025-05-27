import { globalState } from "./globals.js";
import { updateStatusBar } from "./status-bar.js";
import { normalizeSlashes } from "./utils.js";
import { openFile } from "./open-file.js";
import { APIService } from "./api-service.js";
import { setAddressPath } from "./utils.js";

// 常量定义
const FILE_TYPE = {
    FOLDER: '文件夹',
    DISK: '本地磁盘',
    FILE: '文件'
};

// DOM 元素引用
let fileListContainer, selectBtn, selectAllBtn, addressPath;

/* 初始化文件列表模块 */
export function initFileListManager() {
    cacheDOMElements();
    setupEventDelegation();
}

/* 视图更新入口 */
export function updateView() {
    cacheDOMElements();
    updateViewMode();
    renderFileList();
    updateHeaderVisibility();
    updateStatusBar();
}

// ================ 主要功能实现 ================ //

/**
 * 1. 事件委托实现（优化点1）
 * 替代原有逐个绑定的方式，只需绑定到父容器
 */
function setupEventDelegation() {
    fileListContainer.addEventListener('click', (e) => {
        const fileItem = e.target.closest('.file-item');
        if (fileItem) handleClick.call(fileItem, e);
    });

    fileListContainer.addEventListener('dblclick', (e) => {
        const fileItem = e.target.closest('.file-item');
        if (fileItem) handleDblClick.call(fileItem);
    });
}

/**
 * 2. 高性能渲染（优化点2）
 * 使用文档片段 + 批量DOM操作
 */
function renderFileList() {
    const fragment = document.createDocumentFragment();
    
    globalState.fileList.forEach(item => {
        fragment.appendChild(createFileItemElement(item));
    });

    // 单次DOM操作
    fileListContainer.innerHTML = '';
    fileListContainer.appendChild(fragment);
}

// ================ 辅助函数 ================ //

/* 缓存常用DOM元素 */
function cacheDOMElements() {
    fileListContainer = document.querySelector('.file-list');
    selectBtn = document.querySelector('.toolbar .select');
    selectAllBtn = document.querySelector('.toolbar .select-all');
    addressPath = document.querySelector('.address-path');
}

/* 创建文件项DOM元素 */
function createFileItemElement(item) {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.dataset.path = item.path;
    div.innerHTML = `
        <div class="file-icon">
            <img src="${'/get_file/' + encodeURIComponent(item.icon)}" alt="图标" />
        </div>
        <div class="file-name">${item.name}</div>
        <div class="file-modified">${item.modified}</div>
        <div class="file-type">${item.type}</div>
        <div class="file-size">${item.size}</div>
        <div class="file-path">${item.path}</div>
    `;
    return div;
}

/* 更新视图模式样式 */
function updateViewMode() {
    fileListContainer.className = `file-list ${globalState.currentView}-view`;
}

/* 控制表头显隐 */
function updateHeaderVisibility() {
    const header = document.querySelector('.file-list-header');
    header.style.display = ['max', 'mid'].includes(globalState.currentView) 
        ? 'none' 
        : '';
}

// ================ 事件处理 ================ //

function handleClick(e) {
    // 阻止事件冒泡到父容器的双击事件
    if (e.detail > 1) return;

    const isSelectMode = selectBtn.classList.contains("active");
    
    if (!isSelectMode) {
        clearAllSelections();
        if (globalState.currentView === 'max') {
            toggleSelectionState(this);
            const { fileName, filePath, fileType } = getFileItemData(this);
            openFile( filePath, fileName, fileType);
            return;
        }
    }
    
    toggleSelectionState(this);
}

function handleDblClick() {
    const { fileName, filePath, fileType } = getFileItemData(this);
    
    if ([FILE_TYPE.FOLDER, FILE_TYPE.DISK].includes(fileType)) {
        navigateToPath(
            fileType === FILE_TYPE.FOLDER ? normalizeSlashes(filePath + '\\' + fileName) : fileName
        );
    } else {
        openFile(filePath, fileName, fileType);
    }
}

// ================ 业务逻辑封装 ================ //

/* 导航到指定路径 */
function navigateToPath(path) {
    APIService('/get_files', { path }, 'POST')
        .then(response => {
            updateGlobalState(response, path);
            updateView();
        })
        .catch(console.error);
}

/* 更新全局状态并修剪路径历史 */
function updateGlobalState(fileList, newPath) {
    globalState.fileList = fileList;
    
    // 修剪路径历史
    while (globalState.Paths.length - 1 > globalState.indexPath) {
        globalState.Paths.pop();
    }
    
    globalState.Paths.push(newPath);
    globalState.indexPath++;
    setAddressPath(addressPath, newPath);
}

/* 获取文件项数据 */
function getFileItemData(element) {
    return {
        fileName: element.querySelector('.file-name').textContent,
        filePath: element.querySelector('.file-path').textContent,
        fileType: element.querySelector('.file-type').textContent
    };
}

/* 取消所有文件的选中状态 */
function clearAllSelections() {
    document.querySelectorAll('.file-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
}

/* 切换选择状态 */
function toggleSelectionState(element) {
    if (selectAllBtn.classList.contains("active") && 
        selectBtn.classList.contains("active")) {
        selectAllBtn.classList.remove("active");
    }
    
    element.classList.toggle('selected');
    updateStatusBar();
}

/* 清理函数 */
export function cleanup() {
    fileListContainer.replaceChildren();
    globalState.fileList = [];
}
