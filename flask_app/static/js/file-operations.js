import { APIService } from "./api-service.js";
import { updateView, updateViewToItem, updateViewToBottom } from "./file-list.js";
import { getSelectedItemsData, getSelectedItemsId, hasSelectedItems } from "./selection.js";
import { getCurrentPath } from "./navigation.js";

// =============== 新建、重命名、删除文件/文件夹 ============== //

export {
    initFileOperations
}

// 常量定义
const SELECTORS = {
    CONTENT_AREA: '.file-explorer',
    CREATE_FILE_BTN: '.toolbar .create-file',
    CREATE_DIR_BTN: '.toolbar .create-dir',
    DELETE_BTN: '.toolbar .delete',
    RENAME_BTN: '.toolbar .rename',
    FILE_LIST: '.file-list'
};

// DOM 元素引用
const domElements = {
    contentArea: null,
    createFileBtn: null,
    createDirBtn: null,
    deleteBtn: null,
    renameBtn: null,
    fileListContainer: null
};

/* 初始化文件操作模块 */
function initFileOperations() {
    cacheDOMElements();
    setupEventListeners();
}

/* DOM元素缓存 */
function cacheDOMElements() {
    domElements.contentArea = document.querySelector(SELECTORS.CONTENT_AREA);
    domElements.createFileBtn = document.querySelector(SELECTORS.CREATE_FILE_BTN);
    domElements.createDirBtn = document.querySelector(SELECTORS.CREATE_DIR_BTN);
    domElements.deleteBtn = document.querySelector(SELECTORS.DELETE_BTN);
    domElements.renameBtn = document.querySelector(SELECTORS.RENAME_BTN);
    domElements.fileListContainer = document.querySelector(SELECTORS.FILE_LIST);
}

function setupEventListeners() {
    domElements.createFileBtn.addEventListener('click', handleCreateFile);
    domElements.createDirBtn.addEventListener('click', handleCreateDir);
    domElements.deleteBtn.addEventListener('click', handleDelete);
    domElements.renameBtn.addEventListener('click', handleFileRename);
}

// ================ 新建文件/文件夹按钮 ================ //

function createEditPage() {
    const div = document.createElement('div');
    div.className = 'edit-page';
    div.innerHTML = `
        <button class='close'>X</button>
        <div class='edit-header'></div>
        <div class='formerly'></div>
        <input class='new-name'></input>
    `;

    return div;
}

let editPageKeydownHandler = null;

function handleCreateFile() {
    if (isInvalidPathForCreation(getCurrentPath)) return;

    const editPage = createEditPage();
    editPage.querySelector('.edit-header').textContent = '新建文件';
    editPage.querySelector('.formerly').display = 'none';
    editPage.querySelector('.new-name').focus();
    domElements.contentArea.appendChild(editPage);

    editPageKeydownHandler = (event) => {handleInputName(event, 'create_file')};

    editPage.querySelector('.close').addEventListener('click', handleClickCloseBtn);
    editPage.querySelector('.new-name').addEventListener('keydown', editPageKeydownHandler);
}

function handleCreateDir() {
    if (isInvalidPathForCreation(getCurrentPath)) return;
    
    const editPage = createEditPage();
    editPage.querySelector('.edit-header').textContent = '新建文件夹';
    editPage.querySelector('.formerly').display = 'none';
    editPage.querySelector('.new-name').focus();
    domElements.contentArea.appendChild(editPage);

    editPageKeydownHandler = (event) => {handleInputName(event, 'create_dir')};

    editPage.querySelector('.close').addEventListener('click', handleClickCloseBtn);
    editPage.querySelector('.new-name').addEventListener('keydown', editPageKeydownHandler);
}

function handleFileRename() {
    if (isInvalidPathForCreation(getCurrentPath)) return;
    if (!hasSelectedItems) return;

    const selectedItems = getSelectedItemsData();
    if (!selectedItems) return;
    const item = selectedItems[0];

    const editPage = createEditPage();
    editPage.querySelector('.edit-header').textContent = '重命名';
    editPage.querySelector('.formerly').textContent = item.name;
    editPage.querySelector('.new-name').focus();
    domElements.contentArea.appendChild(editPage);
    
    editPageKeydownHandler = (event) => {handleInputName(event, 'rename')};

    editPage.querySelector('.close').addEventListener('click', handleClickCloseBtn);
    editPage.querySelector('.new-name').addEventListener('keydown', editPageKeydownHandler);
}

function handleClickCloseBtn() {
    document.querySelector('.edit-page .close').removeEventListener('click', handleClickCloseBtn);
    document.querySelector('.edit-page .new-name').removeEventListener('keydown', editPageKeydownHandler);
    document.querySelector('.edit-page').remove();
    editPageKeydownHandler = null;
}

function handleInputName(event, type) {
    if (event.key === 'Enter') {
        const oldName = document.querySelector('.edit-page .formerly').textContent;
        const inputValue = document.querySelector('.edit-page .new-name').value.trim();
        const placeholder = type === 'create_file' ? '新建文件.txt' : '新建文件夹';
        
        if (type != 'rename') {
            if (validateFilename(inputValue)) {
                submitCreation({
                    type,
                    name: inputValue || placeholder,
                    path: getCurrentPath()
                });
                handleClickCloseBtn();
            }
        } else {
            const inputValue = input.value.trim();
            if (inputValue === oldName) {
                handleClickCloseBtn();
                return;
            }
            if (!inputValue) {
                alert('名称不能为空');
                return;
            }
            if (validateFilename(inputValue)) {
                submitRename({
                    old_name: oldName,
                    new_name: inputValue,
                    path: getCurrentPath()
                });
                handleClickCloseBtn();
            }
        }
    } else if (event.key === 'Escape') {
        handleClickCloseBtn();
    }
}

// ================== 删除按钮 ================= //

/**
 * 3. 删除操作优化
 * 批量处理选中项
 */
function handleDelete() {
    const selectedItems = getSelectedItemsData();
    if (selectedItems.length === 0) return;

    if (!confirm(`确定要删除这 ${selectedItems.length} 个项吗？`)) return;

    const deletePayload = {
        path: getCurrentPath(),
        fileList: selectedItems
    };
    
    APIService('/delete', deletePayload, 'POST')
        .then(handleOperationSuccess)
        .catch(handleOperationError.bind(null, '删除'));
}

// ================ 辅助函数 ================ //

/* 验证路径有效性 */
function isInvalidPathForCreation() {
    return /^[\/\\]$/.test(getCurrentPath());
}

/* 验证文件名 */
function validateFilename(name) {
    if (/[\\/:*?"<>|]/.test(name)) {
        alert(`名称包含非法字符: ${name}`);
        return false;
    }
    return true;
}

// ================ API操作封装 ================ //

function submitCreation({ type, name, path }) {
    const endpoint = '/' + type;
    
    return APIService(endpoint, { name, path }, 'POST')
        .then(handleOperationSuccess)
        .catch(handleOperationError.bind(null, type === 'file' ? '创建文件' : '创建文件夹'));
}

function submitRename(params) {
    return APIService('/rename', params, 'POST')
        .then(handleOperationSuccess)
        .catch(handleOperationError.bind(null, '重命名'));
}

function handleOperationSuccess(response) {
    updateView(response);
    return true;
}

function handleOperationError(operation, error) {
    console.error(`${operation}失败:`, error);
    alert(`${operation}失败: ${error.message}`);
    return false;
}