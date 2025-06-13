import { config } from "./config.js";
import { clearAllSelections, toggleItemSelection, isFileSelected, resetSelectBtn } from "./selection.js";
import { getCurrentViewMode } from "./view-mode.js";
import { openFile } from "./open-file.js";

export {
    initFileList,
    updateView,
    toggleView,
    updateViewToItem,
    updateViewToBottom,
    getFileList
}

let fileList = [];

const SELECTORS = {
    TO_TOP_BTN: '.to-top',
    TO_BOTTOM_BTN: '.to-bottom',
    HEADER: '.file-list-header',
    CONTENT: '.file-list',
    CONTAINER: '.content-areas'
}

const domElements = {
    toTopBtn: null,
    toBottomBtn: null,
    header: null,
    content: null,
    container: null
}

function initFileList() {
    cacheDOMElements();
    setupEventListeners();
    initVirtualScroller();
}

function cacheDOMElements() {
    domElements.toTopBtn = document.querySelector(SELECTORS.TO_TOP_BTN);
    domElements.toBottomBtn = document.querySelector(SELECTORS.TO_BOTTOM_BTN);
    domElements.header = document.querySelector(SELECTORS.HEADER);
    domElements.content = document.querySelector(SELECTORS.CONTENT);
    domElements.container = document.querySelector(SELECTORS.CONTAINER);
}

function setupEventListeners() {
    domElements.toTopBtn.addEventListener('click', updateViewToTop);
    domElements.toBottomBtn.addEventListener('click', updateViewToBottom);

    domElements.content.addEventListener('click', event => {
        const fileItem = event.target.closest('.file-item');
        if (fileItem) handleFileItemClick.call(fileItem, event);
    });

    domElements.content.addEventListener('dblclick', event => {
        const fileItem = event.target.closest('.file-item');
        if (fileItem) handleFileItemDblClick.call(fileItem);
    });

    domElements.container.addEventListener('scroll', () => {
        if (scrollRaf) cancelAnimationFrame(scrollRaf);
        scrollRaf = requestAnimationFrame(() => _render());
    });
    
    const resizeObserver = new ResizeObserver(() => {
        viewportHeight = domElements.container.clientHeight;
        viewportWidth = domElements.container.clientWidth;
        toggleView();
    });
    resizeObserver.observe(domElements.container);
}

function handleFileItemClick(e) {
    if (e.detail > 1) return;
    
    toggleItemSelection(this);
}

function handleFileItemDblClick() {
    resetSelectBtn();
    toggleItemSelection(this);

    const id = this.dataset.index;
    openFile(fileList[id]);
}

// ====================== 虚拟滚动 ==================== //

let scrollRaf; // 滚动优化(RAF)
let nodePool = []; // 节点复用池
let activeNodes = new Set(); // 当前活跃节点
let currentViewMode;
let viewportHeight;
let viewportWidth;

function initVirtualScroller() {
    currentViewMode = getCurrentViewMode();
    viewportHeight = domElements.container.clientHeight;
    viewportWidth = domElements.container.clientWidth;
}

function updateView(newFileList) {
    fileList = newFileList;
    nodePool.length = 0;
    currentViewMode = getCurrentViewMode();

    clearAllSelections();
    domElements.content.innerHTML = '';

    if (fileList.length === 0) {
        const div = document.createElement('div');
        div.textContent = '空';
        div.style.height = '100%';
        div.style.width = '100%';
        domElements.content.appendChild(div);
    } else {
        _render(0);
    }
}

function toggleView() {
    let itemId, scrollTop = domElements.container.scrollTop;
    nodePool.length = 0;
    domElements.content.innerHTML = '';

    if (!scrollTop) {
        currentViewMode = getCurrentViewMode();
        _render(0);
        return;
    }

    if (currentViewMode === 'max') {
        let currnetRow = Math.floor(scrollTop / itemHeight);
        itemId = currnetRow * numColumns;
    } else if (currentViewMode === 'mid') {

    } else if (currentViewMode === 'min') {
        itemId = Math.floor(scrollTop / 36);
    }

    currentViewMode = getCurrentViewMode();
    updateViewToItem(itemId);
}

function updateViewToTop() {
    updateViewToItem(0);
}

function updateViewToBottom() {
    updateViewToItem(fileList.length - 1);
}

function updateViewToItem(itemId) {
    if (!fileList.length) {
        _render(0);
        return;
    }

    let scrollHeight, topToItemHeight;

    if (currentViewMode === 'max') {
        let currentRow = Math.ceil((itemId + 1) / numColumns) - 1;
        scrollHeight = numRow * itemHeight;
        topToItemHeight = currentRow * itemHeight;

    } else if (currentViewMode === 'mid') {

    } else if (currentViewMode === 'min') {
        scrollHeight = fileList.length * 36 + 36;
        topToItemHeight = itemId * 36;
    }

    if (scrollHeight <= viewportHeight) {
        _render(0);
    } else if (topToItemHeight <= scrollHeight - viewportHeight) {
        _render(topToItemHeight);
    } else {
        _render(scrollHeight - viewportHeight);
    }
}

function _render(scrollTop = domElements.container.scrollTop) {
    updateHeaderVisibility();
    domElements.content.className = `file-list ${currentViewMode}-view`;
    
    const viewportBottom = scrollTop + viewportHeight;

    let numColumns, numRow, itemHeight, startIdx, endIdx;

    if (currentViewMode === 'max') {
        numColumns = Math.max(2, Math.floor(viewportWidth / 256));
        numRow = Math.ceil(fileList.length / numColumns);
        itemHeight = viewportWidth / numColumns;
        const startRow = Math.max(0, Math.floor(scrollTop /itemHeight) - 3);
        const endRow = Math.min(
            numRow,
            Math.ceil(viewportBottom / itemHeight) + 3
        );
        startIdx = startRow * numColumns;
        endIdx = Math.min(fileList.length - 1, endRow * numColumns + (numColumns - 1));

    } else if (currentViewMode === 'mid') {

    } else if (currentViewMode === 'min') {
        numColumns = 1;
        numRow = fileList.length;
        itemHeight = 36;
        startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
        endIdx = Math.min(
            numRow - 1,
            Math.ceil(viewportBottom / itemHeight) + 5
        );
    }
    domElements.content.style.minHeight = `${numRow * itemHeight}px`;
    domElements.container.scrollTop = scrollTop;

    // 复用或创建节点
    for (let i = startIdx; i <= endIdx; i++) {
        if (i >= fileList.length) continue;

        let node = findNodeInPool(i);
        
        if (!node) {
            node = renderItem(i);
            node.dataset.index = i;
            node.style.position = 'absolute';
            nodePool.push(node);
        }

        activeNodes.add(node);
        
        // 根据视图模式定位节点
        if (currentViewMode === 'max') {
            const row = Math.floor(i / numColumns);
            const col = i % numColumns;
            node.style.top = `${row * itemHeight + 1}px`;
            node.style.left = `${col * itemHeight + 1}px`;
            node.style.width = `${itemHeight - 2}px`;
            node.style.height = `${itemHeight - 2}px`;
        } else if (currentViewMode === 'mid') {
            
        } else if (currentViewMode === 'min') {
            node.style.top = `${i * itemHeight}px`;
            node.style.left = '0';
            node.style.width = '100%';
            node.style.height = `${itemHeight}px`;
        }
        
        if (!node.parentNode) {
            domElements.content.appendChild(node);
        }
    }

    // 回收不活跃的节点
    recycleInactiveNodes();
}    

// 从池中查找可复用的节点
function findNodeInPool(index) {
    // 先查找当前未使用的匹配节点
    for (let i = 0; i < nodePool.length; i++) {
        const node = nodePool[i];
        if (node.dataset.index == index && !activeNodes.has(node)) {
            if (isFileSelected(node)) {
                node.classList.add('selected');
            } else {
                node.classList.remove('selected');
            }
            return node;
        }
    }
    return null;
}

// 回收不活跃的节点
function recycleInactiveNodes() {
    const nodesToRemove = [];
    
    for (const node of nodePool) {
        if (!activeNodes.has(node) && node.parentNode) {
            nodesToRemove.push(node);
        }
    }

    nodesToRemove.forEach(node => node.remove());
    
    activeNodes.clear();
}

function renderItem(itemId) {
    let item = fileList[itemId];
    let div = document.createElement('div');

    let type = '';
    if (config.IMAGE_TYPES.includes(item.type)) type = 'img';
    else if (config.VIDEO_TYPES.includes(item.type)) type = 'video';

    div.className = 'file-item';
    div.dataset.index = itemId;
    
    div.innerHTML = `
        <div class="file-icon">
            <img type='${type}'/>
        </div>
        <div class="file-name">${item.name}</div>
        <div class="file-modified">${item.modified}</div>
        <div class="file-type">${item.type}</div>
        <div class="file-size">${item.size}</div>
    `;
    
    // 设置样式
    div.style.height = '100%';

    setIcon(div.querySelector('img'), item);

    if (isFileSelected(div)) {
        div.classList.add('selected');
    }
    
    return div;
}

function updateHeaderVisibility() {
    domElements.header.style.display = ['max', 'mid'].includes(currentViewMode) 
        ? 'none' 
        : '';
}

// =================== 其他 ==================== //

function getFileList() {
    return fileList;
}

function setIcon(element, item) {
    const type = item.type.toLowerCase(); // 转换为小写方便比较
    
    // 去除可能的点前缀（如".jpg"变成"jpg"）
    const cleanType = type.startsWith('.') ? type.slice(1) : type;
    
    // 设置对应图标
    if (type === '文件夹') {
        element.src = '/static/img/folder.svg';
    } else if (type === '本地磁盘') {
        element.src = '/static/img/disk.svg';
    } else if (config.IMAGE_TYPES.includes(cleanType)) {
        if (currentViewMode === 'max') {
            element.src = `/get_thumbnail/${encodeURIComponent(item.icon)}`;
        } else {
            element.src = '/static/img/image.svg';
        }
    } else if (config.VIDEO_TYPES.includes(cleanType)) {
        if (currentViewMode === 'max') {
            element.src = `/get_thumbnail/${encodeURIComponent(normalizeSlashes(item.path + '\\' + item.name))}`;
        } else {
            element.src = '/static/img/video.svg';
        }
    } else if (config.AUDIO_TYPES.includes(cleanType)) {
        element.src = '/static/img/audio.svg';
    } else if (config.DOCUMENT_TYPES.includes(cleanType)) {
        element.src = '/static/img/document.svg';
    } else if (config.ARCHIVE_TYPES.includes(cleanType)) {
        element.src = '/static/img/archive.svg';
    } else if (config.CODE_TYPES.includes(cleanType)) {
        element.src = '/static/img/code.svg';
    } else if (!type || type === '') {
        element.src = '/static/img/unknown.svg'; // 未知或空的类型
    } else {
        // 其他未分类的文件类型
        element.src = '/static/img/unknown.svg';
    }
    
    // 为图标添加alt属性
    element.alt = `${type}图标`;
}

function normalizeSlashes(text) {
    // 将连续的/或\替换为单个\
    return text.replace(/[\\/]+/g, '\\');
}