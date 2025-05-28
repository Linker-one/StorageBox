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

// 视图模式尺寸常量
const VIEW_MODE_HEIGHTS = {
    min: 35,      // 最小化视图 - 紧凑列表
    mid: 140,     // 中等视图 - 带缩略图
    max: 256      // 最大化视图 - 大缩略图
};

// DOM 元素引用
let fileListContainer, selectBtn, selectAllBtn, addressPath;

/* ================== 图片懒加载模块（优化版本） ================== */
class ImageLoader {
    static observer;
    static controllers = new Map();
    static blobUrlCache = new Map();   // 缓存已加载图片的blob URL
    static loadedImages = new Set();   // 跟踪已加载图片

    static init() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // 只加载未加载过的图片
                    if (!this.loadedImages.has(img.dataset.src)) {
                        this.loadImage(img);
                    }
                    this.observer.unobserve(img);
                }
            });
        }, { 
            root: null,
            rootMargin: '200px 0px',
            threshold: 0.01
        });
    }

    static loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // 如果已有缓存URL，直接使用
        if (this.blobUrlCache.has(src)) {
            img.src = this.blobUrlCache.get(src);
            return;
        }

        const controller = new AbortController();
        this.controllers.set(img, controller);

        fetch(src, { signal: controller.signal })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.blob();
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                this.blobUrlCache.set(src, blobUrl);
                this.loadedImages.add(src);
                img.src = blobUrl;
                img.dataset.loaded = 'true';
            })
            .catch(err => {
                console.error('Image load failed:', err);
                // 可以设置一个占位符图片
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTkgNUg1QzMuODk1NDMgNSA0Ljg5NTQzIDUgMy44OTU0MyA1QzIuODk1NDMgNSAyIDUuODk1NDMgMiA3VjE3QzIgMTguMTA0NiAyLjg5NTQzIDE5IDQgMTlIMjBDMjEuMTA0NiAxOSAyMiAxOC4xMDQ2IDIyIDE3VjdDMjIgNS44OTU0MyAyMS4xMDQ2IDUgMjAgNVoiIGZpbGw9IiNFRUVFRUUiLz48L3N2Zz4=';
            });
    }

    // 释放不再使用的blob URL
    static revokeUnusedBlobUrls(currentImages = []) {
        const currentSrcSet = new Set(currentImages.map(img => img.dataset.src));
        
        this.blobUrlCache.forEach((url, src) => {
            if (!currentSrcSet.has(src)) {
                URL.revokeObjectURL(url);
                this.blobUrlCache.delete(src);
                this.loadedImages.delete(src);
            }
        });
    }

    static abortAll() {
        this.controllers.forEach(controller => controller.abort());
        this.controllers.clear();
    }
}

/* ================== 虚拟滚动核心模块（优化版本） ================== */
class VirtualScroller {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.data = [];
        this.nodePool = []; // 节点复用池
        this.activeNodes = new Set(); // 当前活跃节点
        
        // 初始化尺寸
        this.updateViewportSize();
        
        // 创建滚动容器
        this.scroller = document.createElement('div');
        this.scroller.style.position = 'relative';
        this.scroller.style.height = '0px';
        container.innerHTML = '';
        container.appendChild(this.scroller);
        
        // 优化滚动事件处理(带防抖和RAF)
        this._scrollHandler = () => {
            if (this._scrollRaf) cancelAnimationFrame(this._scrollRaf);
            this._scrollRaf = requestAnimationFrame(() => this._render());
        };
        
        container.addEventListener('scroll', this._scrollHandler);
        
        // 窗口大小变化时重新计算
        this._resizeHandler = () => this.updateViewportSize();
        window.addEventListener('resize', this._resizeHandler);
    }

    updateViewportSize() {
        this.viewportHeight = this.container.clientHeight;
        this.viewportWidth = this.container.clientWidth;
        this.visibleCount = Math.ceil(this.viewportHeight / this.itemHeight) + 6; // 缓冲项
    }

    setData(data) {
        this.data = data;
        this._render(true);
    }

    _render(isInitialRender = false) {
        if (!this.data.length) return;
    
        const scrollTop = this.container.scrollTop;
        const viewportBottom = scrollTop + this.viewportHeight;
        const isMaxView = globalState.currentView === 'max';
        const rowHeight = this.itemHeight;
        
        // 计算参数（根据不同视图模式）
        let startIdx, endIdx, numColumns = 1;
        const buffer = isMaxView ? 3 : 5; // 缓冲项目数
        let scrollerHeight;
        
        if (isMaxView) {
            // 最大视图模式（网格布局）
            numColumns = Math.max(2, Math.floor(this.viewportWidth / 256));
            const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
            const endRow = Math.min(
                Math.ceil(this.data.length / numColumns) - 1,
                Math.ceil(viewportBottom / rowHeight) + buffer
            );
            startIdx = startRow * numColumns;
            endIdx = endRow * numColumns + (numColumns - 1);
            scrollerHeight = Math.ceil(this.data.length / numColumns) * this.itemHeight;
        } else {
            // 最小视图模式（列表布局）
            startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
            endIdx = Math.min(
                this.data.length - 1,
                Math.ceil(viewportBottom / rowHeight) + buffer
            );
            scrollerHeight = this.data.length * this.itemHeight;
        }

        this.scroller.style.height = `${scrollerHeight}px`;
    
        // 收集当前可见图片用于内存管理
        const visibleImages = [];
    
        // 完全重新渲染或初次渲染
        if (isInitialRender) {
            this.scroller.innerHTML = '';
            this.nodePool = [];
            this.activeNodes.clear();
        }
    
        // 复用或创建节点
        for (let i = startIdx; i <= endIdx; i++) {
            if (i >= this.data.length) continue;
    
            let node = this.findNodeInPool(i);
            const itemData = this.data[i];
            
            if (!node) {
                node = this.renderItem(itemData, i);
                node.dataset.index = i;
                node.style.position = 'absolute';
                this.nodePool.push(node);
            }
    
            this.activeNodes.add(node);
            
            // 根据视图模式定位节点
            if (isMaxView) {
                const row = Math.floor(i / numColumns);
                const col = i % numColumns;
                node.style.top = `${row * rowHeight}px`;
                node.style.left = `${col * 256}px`;
                node.style.width = '256px';
            } else {
                node.style.top = `${i * rowHeight}px`;
                node.style.left = '0';
                node.style.width = '100%';
            }
            
            node.style.height = `${rowHeight}px`;
            
            // 收集图片用于懒加载管理
            const img = node.querySelector('img');
            if (img) visibleImages.push(img);
            
            if (!node.parentNode) {
                this.scroller.appendChild(node);
            }
        }
    
        // 回收不活跃的节点
        this.recycleInactiveNodes();
    
        // 更新懒加载模块的内存管理
        ImageLoader.revokeUnusedBlobUrls(visibleImages);
    }    

    // 从池中查找可复用的节点
    findNodeInPool(index) {
        // 先查找当前未使用的匹配节点
        for (let i = 0; i < this.nodePool.length; i++) {
            const node = this.nodePool[i];
            if (node.dataset.index == index && !this.activeNodes.has(node)) {
                return node;
            }
        }
        return null;
    }

    // 回收不活跃的节点
    recycleInactiveNodes() {
        const nodesToRemove = [];
        
        for (const node of this.nodePool) {
            if (!this.activeNodes.has(node) && node.parentNode) {
                nodesToRemove.push(node);
            }
        }

        nodesToRemove.forEach(node => {
            if (node.parentNode) {
                node.remove();
            }
        });
        
        this.activeNodes.clear();
    }

    destroy() {
        this.container.removeEventListener('scroll', this._scrollHandler);
        window.removeEventListener('resize', this._resizeHandler);
        if (this._scrollRaf) cancelAnimationFrame(this._scrollRaf);
        this.container.innerHTML = '';
        this.nodePool = [];
        this.activeNodes.clear();
    }
}

/* ================== 文件列表管理 ================== */
let virtualScroller;

// 创建文件项元素
function createFileItem(item, index) {
    // 尝试从池中复用节点
    let div = document.createElement('div');
    div.className = 'file-item';
    div.dataset.path = item.path;
    div.dataset.index = index;
    
    div.innerHTML = `
        <div class="file-icon">
            <img data-src="/get_file/${encodeURIComponent(item.icon)}" alt="图标"/>
        </div>
        <div class="file-name">${item.name}</div>
        <div class="file-modified">${item.modified}</div>
        <div class="file-type">${item.type}</div>
        <div class="file-size">${item.size}</div>
    `;
    
    // 设置样式
    div.style.height = '100%';
    
    // 处理图片懒加载
    const img = div.querySelector('img');
    if (img) {
        // 如果图片已经加载过，直接使用缓存的URL
        if (ImageLoader.loadedImages.has(img.dataset.src)) {
            img.src = ImageLoader.blobUrlCache.get(img.dataset.src);
            img.dataset.loaded = 'true';
        } else {
            ImageLoader.observer.observe(img);
        }
    }
    
    return div;
}

// 初始化虚拟滚动
function initVirtualScroller() {
    if (virtualScroller) return;
    
    const container = document.querySelector('.file-list');
    const currentMode = globalState.currentView || 'min';
    virtualScroller = new VirtualScroller(
        container,
        VIEW_MODE_HEIGHTS[currentMode],
        createFileItem
    );
}

/* ================== 主要函数接口 ================== */
export function initFileListManager() {
    cacheDOMElements();
    setupEventDelegation();
    ImageLoader.init();
}

export function updateView() {
    cacheDOMElements();
    updateViewMode();
    
    // 更新前释放不再需要的资源
    ImageLoader.revokeUnusedBlobUrls();

    if (!virtualScroller) {
        initVirtualScroller();
    } else {
        const currentMode = globalState.currentView || 'min';
        const newHeight = VIEW_MODE_HEIGHTS[currentMode];
        
        if (virtualScroller.itemHeight !== newHeight) {
            virtualScroller.destroy();
            virtualScroller = null;
            initVirtualScroller();
        }
    }
    
    virtualScroller.setData(globalState.fileList);
    updateHeaderVisibility();
    updateStatusBar();
}

export function cleanup() {
    ImageLoader.abortAll();
    ImageLoader.revokeUnusedBlobUrls([]); // 释放所有blob URL
    
    if (virtualScroller) {
        virtualScroller.destroy();
        virtualScroller = null;
    }
}

/* ================== 其他函数 ================== */
function cacheDOMElements() {
    fileListContainer = document.querySelector('.file-list');
    selectBtn = document.querySelector('.toolbar .select');
    selectAllBtn = document.querySelector('.toolbar .select-all');
    addressPath = document.querySelector('.address-path');
}

function setupEventDelegation() {
    document.querySelector('.file-list').addEventListener('click', (e) => {
        const fileItem = e.target.closest('.file-item');
        if (fileItem) handleClick.call(fileItem, e);
    });

    document.querySelector('.file-list').addEventListener('dblclick', (e) => {
        const fileItem = e.target.closest('.file-item');
        if (fileItem) handleDblClick.call(fileItem);
    });
}

function handleClick(e) {
    if (e.detail > 1) return;
    const isSelectMode = selectBtn.classList.contains("active");
    
    if (!isSelectMode) {
        clearAllSelections();
        if (globalState.currentView === 'max') {
            toggleSelectionState(this);
            const { fileName, filePath, fileType } = getFileItemData(this);
            openFile(filePath, fileName, fileType);
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

function navigateToPath(path) {
    APIService('/get_files', { 'path': path }, 'POST')
        .then(response => {
            updateGlobalState(response, path);
            updateView();
        })
        .catch(console.error);
}

function updateGlobalState(fileList, newPath) {
    globalState.fileList = fileList;
    while (globalState.Paths.length - 1 > globalState.indexPath) {
        globalState.Paths.pop();
    }
    globalState.Paths.push(newPath);
    globalState.indexPath++;
    setAddressPath(addressPath, newPath);
}

function clearAllSelections() {
    document.querySelectorAll('.file-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
}

function toggleSelectionState(element) {
    if (selectAllBtn.classList.contains("active") && 
        selectBtn.classList.contains("active")) {
        selectAllBtn.classList.remove("active");
    }
    element.classList.toggle('selected');
    updateStatusBar();
}

function getFileItemData(element) {
    return {
        fileName: element.querySelector('.file-name').textContent,
        filePath: element.dataset.path,
        fileType: element.querySelector('.file-type').textContent
    };
}

function updateViewMode() {
    const container = document.querySelector('.file-list');
    container.className = `file-list ${globalState.currentView}-view`;
    if (virtualScroller) {
        virtualScroller.viewportHeight = container.clientHeight;
    }
}

function updateHeaderVisibility() {
    const header = document.querySelector('.file-list-header');
    header.style.display = ['max', 'mid'].includes(globalState.currentView) 
        ? 'none' 
        : '';
}
