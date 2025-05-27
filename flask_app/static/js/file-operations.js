import { globalState } from "./globals.js";
import { APIService } from "./api-service.js";
import { updateView } from "./file-list.js";
import { isValidFilename } from "./utils.js";

// 常量定义
const OPERATION_TYPE = {
    CREATE_FILE: 'file',
    CREATE_DIR: 'dir',
    DELETE: 'delete',
    RENAME: 'rename'
};

// DOM 元素引用
let domElements = {
    createFileBtn: null,
    createDirBtn: null,
    deleteBtn: null,
    renameBtn: null,
    fileListContainer: null
};

/* 初始化文件操作模块 */
export function initFileOperations() {
    cacheDOMElements();
    setupEventListeners();
}

// ================ 主逻辑实现 ================ //

/**
 * 1. 集中式事件监听（优化点1）
 * 使用单一事件处理器管理所有按钮事件
 */
function setupEventListeners() {
    const handlers = {
        'create-file': () => handleCreateItem(OPERATION_TYPE.CREATE_FILE),
        'create-dir': () => handleCreateItem(OPERATION_TYPE.CREATE_DIR),
        'delete': handleDelete,
        'rename': handleRename
    };

    Object.entries(handlers).forEach(([className, handler]) => {
        const btn = document.querySelector(`.toolbar .${className}`);
        if (btn) {
            btn.addEventListener('click', handler);
            // 存储引用以便清理
            domElements[className.replace('-', '') + 'Btn'] = btn;
        }
    });
}

/**
 * 2. 创建项目逻辑重构（优化点2）
 * 合并文件/文件夹创建流程
 */
function handleCreateItem(type) {
    if (isInvalidPathForCreation()) {
        alert(`无法在根目录创建${type === OPERATION_TYPE.CREATE_FILE ? '文件' : '文件夹'}`);
        return;
    }

    const placeholder = type === OPERATION_TYPE.CREATE_FILE ? '新建文件.txt' : '新建文件夹';
    const template = createItemTemplate(type, placeholder);
    
    renderCreationInput(template, (inputValue) => {
        if (!validateFilename(inputValue)) return false;
        
        return submitCreation({
            type,
            name: inputValue || placeholder,
            path: globalState.Paths[globalState.indexPath]
        });
    });
}

/**
 * 3. 删除操作优化
 * 批量处理选中项
 */
function handleDelete() {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) return;

    if (!confirm(`确定要删除这 ${selectedItems.length} 个项吗？`)) return;

    const deletePayload = prepareDeletePayload(selectedItems);
    
    APIService('/delete', deletePayload, 'POST')
        .then(handleOperationSuccess)
        .catch(handleOperationError.bind(null, '删除'));
}

/**
 * 4. 重命名操作优化
 * 状态化处理输入过程
 */
function handleRename() {
    const selectedItem = document.querySelector('.file-item.selected');
    if (!selectedItem) return;

    const originalName = selectedItem.querySelector('.file-name').textContent.trim();
    const inputElement = createRenameInput(selectedItem, originalName);

    setupRenameHandlers(inputElement, selectedItem, originalName);
}

// ================ 辅助函数 ================ //

/* DOM元素缓存 */
function cacheDOMElements() {
    domElements.fileListContainer = document.querySelector('.file-list');
}

/* 创建项目模板 */
function createItemTemplate(type, placeholder) {
    return `
        <div class="file-item rename">
            <div class="file-icon hidden">
                <img src="" alt="" />
            </div>
            <input class="file-name" type="text" placeholder="${placeholder}">
            <div class="file-modified">-</div>
            <div class="file-type">${type === OPERATION_TYPE.CREATE_FILE ? '-' : '文件夹'}</div>
            <div class="file-size">-</div>
            <div class="file-path">-</div>
        </div>`;
}

/* 渲染创建输入框 */
function renderCreationInput(template, onSubmit) {
    domElements.fileListContainer.insertAdjacentHTML('beforeend', template);
    
    const newItem = domElements.fileListContainer.lastElementChild;
    const input = newItem.querySelector('.file-name');
    
    // 微延迟确保聚焦生效
    setTimeout(() => {
        input.focus();
        setupInputHandlers(input, newItem, onSubmit);
    }, 10);
}

/* 设置输入处理器 */
function setupInputHandlers(input, container, onSubmit) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (onSubmit(input.value.trim())) {
                container.remove();
            }
        } else if (e.key === 'Escape') {
            cancelInput(container);
        }
    };

    const handleBlur = () => cancelInput(container);

    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('blur', handleBlur);
}

function cancelInput(container) {
    container.remove();
}

/* 验证路径有效性 */
function isInvalidPathForCreation() {
    return /^[\/\\]$/.test(globalState.Paths[globalState.indexPath]);
}

/* 验证文件名 */
function validateFilename(name, type) {
    if (!isValidFilename(name)) {
        alert(`名称包含非法字符: ${name}`);
        return false;
    }
    return true;
}

/* 准备删除数据 */
function prepareDeletePayload(items) {
    const payload = [globalState.Paths[globalState.indexPath]];
    
    items.forEach(item => {
        payload.push({
            name: `${item.querySelector('.file-path').textContent.trim()}\\${item.querySelector('.file-name').textContent.trim()}`,
            type: item.querySelector('.file-type').textContent.trim()
        });
    });
    
    return payload;
}

/* 创建重命名输入框 */
function createRenameInput(item, originalName) {
    const nameElement = item.querySelector('.file-name');
    nameElement.style.display = 'none';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'file-name rename';
    input.value = originalName;
    item.insertBefore(input, item.children[1]);
    input.focus();
    input.select();
    
    return input;
}

/* 设置重命名处理器 */
function setupRenameHandlers(input, item, originalName) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newName = input.value.trim();
            
            if (!validateRenameInput(newName, originalName)) return;
            
            submitRename({
                old_name: originalName,
                new_name: newName,
                path: globalState.Paths[globalState.indexPath]
            }).finally(() => cleanupRename(input, item));
            
        } else if (e.key === 'Escape') {
            cleanupRename(input, item);
        }
    };

    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('blur', () => cleanupRename(input, item));
}

/* 验证重命名输入 */
function validateRenameInput(newName, originalName) {
    if (!newName) {
        alert('名称不能为空');
        return false;
    }
    
    if (newName === originalName) {
        return false;
    }
    
    return validateFilename(newName);
}

/* 清理重命名状态 */
function cleanupRename(input, item) {
    input.remove();
    item.querySelector('.file-name').style.display = 'block';
}

// ================ API操作封装 ================ //

function submitCreation({ type, name, path }) {
    const endpoint = type === OPERATION_TYPE.CREATE_FILE ? '/create_file' : '/create_dir';
    
    return APIService(endpoint, { name, path }, 'POST')
        .then(handleOperationSuccess)
        .catch(handleOperationError.bind(null, type === OPERATION_TYPE.CREATE_FILE ? '创建文件' : '创建文件夹'));
}

function submitRename(params) {
    return APIService('/rename', params, 'POST')
        .then(handleOperationSuccess)
        .catch(handleOperationError.bind(null, '重命名'));
}

function handleOperationSuccess(response) {
    globalState.fileList = response;
    updateView();
    return true;
}

function handleOperationError(operation, error) {
    console.error(`${operation}失败:`, error);
    alert(`${operation}失败: ${error.message}`);
    return false;
}

// ================ 工具函数 ================ //

function getSelectedItems() {
    return Array.from(document.querySelectorAll('.file-item.selected'));
}

/* 清理函数 */
export function cleanupFileOperations() {
    Object.values(domElements).forEach(el => {
        if (el && el.removeEventListener) {
            // 实际应根据具体事件进行清理
            el.replaceWith(el.cloneNode(true));
        }
    });
    domElements = {};
}
