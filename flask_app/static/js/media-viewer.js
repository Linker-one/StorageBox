import { config } from './config.js';
import { toggleItemSelection, getSelectedItemsId } from './selection.js';
import { getFileList, updateViewToItem } from './file-list.js';

const domElements = {
    contentArea: null,
    fileListContainer: null,
    mediaViewer: null,
    mediaContainer: null,
    mediaElement: null, // 可能是img或video元素
    closeBtn: null,
    lastBtn: null,
    nextBtn: null,
    loadingIndicator: null
}

const SELECTORS = {
    CONTENT_AREA: '.file-explorer',
    FILE_LIST_CONTAINER: '.file-list',
    MEDIA_VIEWER: '.media-viewer',
    MEDIA_CONTAINER: '.media-viewer .media-container',
    MEDIA_ELEMENT: '.media-viewer .media-element', // 通用选择器
    CLOSE_BTN: '.media-viewer .close',
    LAST_BTN: '.media-viewer .last',
    NEXT_BTN: '.media-viewer .next',
    LOADING_INDICATOR: '.media-viewer .loading-indicator'
}

let fileList = [];
let currentMediaId = -1;
let currentMediaType = '';
let navigationCache = {};

/* ===================== 打开媒体查看器 ========================= */

export function openMediaViewer(filePath, fileName, fileType) {
    // 验证输入
    if (!filePath || !fileName || !fileType || !(fileType === 'image' || fileType === 'video')) {
        console.error('Invalid parameters for opening media viewer');
        return;
    }

    try {
        domElements.contentArea = document.querySelector(SELECTORS.CONTENT_AREA);
        
        // 如果已经存在媒体查看器，先关闭
        if (document.querySelector(SELECTORS.MEDIA_VIEWER)) {
            clearMediaViewerElement();
        }
        
        domElements.contentArea.appendChild(createMediaViewerElement(fileType === 'video'));
        
        cacheDOMElements();
        setupEventListeners();

        fileList = getFileList() || [];
        currentMediaId = parseInt(getSelectedItemsId()) || 0;
        currentMediaType = fileType;

        // 重置导航缓存
        navigationCache = {};
        
        setMediaSource(filePath, fileName);
        updateNavigationButtons();
    } catch (error) {
        console.error('Failed to open media viewer:', error);
    }
}

function isSupportedMediaType(fileType) {
    return config.IMAGE_TYPES.includes(fileType) || config.VIDEO_TYPES.includes(fileType);
}

function createMediaViewerElement(isVideo) {
    const div = document.createElement('div');
    div.className = 'media-viewer';
    div.tabIndex = 0; // 使元素可聚焦以接收键盘事件
    
    const mediaTag = isVideo ? 
        `<video class="media-element" controls autoplay></video>` : 
        `<img class="media-element" />`;
    
    div.innerHTML = `
        <div class="media-container" title="双击退出或按ESC键">
            ${mediaTag}
            <div class="loading-indicator">加载中...</div>
        </div>
        <button class="close" title="点击退出 (Esc)">X</button>
        <button class="last" title="点击上一个 (左箭头键)"></button>
        <button class="next" title="点击下一个 (右箭头键)"></button>
    `;
    
    return div;
}

function cacheDOMElements() {
    domElements.fileListContainer = document.querySelector(SELECTORS.FILE_LIST_CONTAINER);
    domElements.mediaViewer = document.querySelector(SELECTORS.MEDIA_VIEWER);
    domElements.mediaContainer = document.querySelector(SELECTORS.MEDIA_CONTAINER);
    domElements.mediaElement = document.querySelector(SELECTORS.MEDIA_ELEMENT);
    domElements.closeBtn = document.querySelector(SELECTORS.CLOSE_BTN);
    domElements.lastBtn = document.querySelector(SELECTORS.LAST_BTN);
    domElements.nextBtn = document.querySelector(SELECTORS.NEXT_BTN);
    domElements.loadingIndicator = document.querySelector(SELECTORS.LOADING_INDICATOR);
}

function setupEventListeners() {
    // 按钮点击事件
    if (domElements.closeBtn) {
        domElements.closeBtn.addEventListener('click', handleClickCloseBtn);
    }
    if (domElements.lastBtn) {
        domElements.lastBtn.addEventListener('click', handleClickLastBtn);
    }
    if (domElements.nextBtn) {
        domElements.nextBtn.addEventListener('click', handleClickNextBtn);
    }
    
    // 容器双击事件
    if (domElements.mediaContainer) {
        domElements.mediaContainer.addEventListener('dblclick', handleDblClickMedia);
    }
    
    // 键盘事件
    if (domElements.mediaViewer) {
        domElements.mediaViewer.addEventListener('keydown', handleKeyDown);
    }
    
    // 媒体元素事件
    if (domElements.mediaElement) {
        domElements.mediaElement.addEventListener('error', handleMediaError);
        domElements.mediaElement.addEventListener('loadstart', showLoadingIndicator);
        domElements.mediaElement.addEventListener('loadeddata', hideLoadingIndicator);
        
        if (currentMediaType === 'video') {
            domElements.mediaElement.addEventListener('play', handleVideoPlay);
            domElements.mediaElement.addEventListener('waiting', showLoadingIndicator);
            domElements.mediaElement.addEventListener('playing', hideLoadingIndicator);
        }
    }
}

function setMediaSource(filePath, fileName) {
    if (!domElements.mediaElement) return;
    
    showLoadingIndicator();
    
    try {
        const mediaUrl = '/get_file/' + encodeURIComponent(`${filePath}\\${fileName}`);
        domElements.mediaElement.src = mediaUrl;
        
        if (currentMediaType === 'image') {
            domElements.mediaElement.alt = fileName;
        }
        
        // 确保媒体查看器获得焦点以接收键盘事件
        if (domElements.mediaViewer) {
            domElements.mediaViewer.focus();
        }
    } catch (error) {
        console.error('Failed to set media source:', error);
        handleMediaError();
    }
}

/* ===================== 事件处理 ========================= */

function handleClickCloseBtn() {
    clearMediaViewerElement();
}

function handleClickLastBtn() {
    if (!domElements.lastBtn.disabled) {
        handleMediaNavigation(-1);
    }
}

function handleClickNextBtn() {
    if (!domElements.nextBtn.disabled) {
        handleMediaNavigation(1);
    }
}

function handleDblClickMedia() {
    clearMediaViewerElement();
}

function handleKeyDown(e) {
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            handleClickLastBtn();
            break;
        case 'ArrowRight':
            e.preventDefault();
            handleClickNextBtn();
            break;
        case 'Escape':
            e.preventDefault();
            clearMediaViewerElement();
            break;
    }
}

function handleMediaError() {
    console.error('Error loading media:', domElements.mediaElement.src);
    domElements.loadingIndicator.textContent = '加载失败';
    domElements.mediaElement.src = '';
}

function handleVideoPlay() {
    if (domElements.mediaElement.paused) {
        domElements.mediaElement.play().catch(e => {
            console.error('Video play failed:', e);
        });
    }
}

function showLoadingIndicator() {
    if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'block';
    }
}

function hideLoadingIndicator() {
    if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'none';
    }
}

/* ===================== 媒体导航 ========================= */

function updateNavigationButtons() {
    if (!domElements.fileListContainer || !domElements.lastBtn || !domElements.nextBtn) return;

    // 使用缓存检查
    if (!navigationCache.hasOwnProperty(currentMediaId)) {
        navigationCache[currentMediaId] = {
            hasPrev: hasPreviousMedia(),
            hasNext: hasNextMedia()
        };
    }

    domElements.lastBtn.disabled = !navigationCache[currentMediaId].hasPrev;
    domElements.nextBtn.disabled = !navigationCache[currentMediaId].hasNext;
}

function hasPreviousMedia() {
    for (let i = currentMediaId - 1; i >= 0; i--) {
        const fileType = fileList[i]?.type;
        if (isSupportedMediaType(fileType)) {
            return true;
        }
    }
    return false;
}

function hasNextMedia() {
    for (let i = currentMediaId + 1; i < fileList.length; i++) {
        const fileType = fileList[i]?.type;
        if (isSupportedMediaType(fileType)) {
            return true;
        }
    }
    return false;
}

function handleMediaNavigation(step) {
    if (currentMediaId === -1 || fileList.length === 0) return;

    let newMediaId = currentMediaId;
    let found = false;

    // 查找有效媒体文件
    while (!found) {
        newMediaId += step;
        
        if (newMediaId < 0 || newMediaId >= fileList.length) break;
        
        const fileType = fileList[newMediaId]?.type;
        if (isSupportedMediaType(fileType)) {
            found = true;
            break;
        }
    }

    if (found) {
        navigateToMedia(newMediaId);
    }
}

function navigateToMedia(targetId) {
    // 保存当前播放状态
    const wasPlaying = currentMediaType === 'video' && 
                      !domElements.mediaElement.paused && 
                      !domElements.mediaElement.ended;

    // 更新选择状态
    const newMediaItem = domElements.fileListContainer.querySelector(`[data-index="${targetId}"]`);
    if (newMediaItem) {
        toggleItemSelection(newMediaItem);
        updateViewToItem(targetId);
    }
    
    const fileItem = fileList[targetId];
    if (!fileItem) return;
    
    currentMediaId = targetId;
    const fileName = fileItem.name;
    const filePath = fileItem.path;
    const fileType = fileItem.type;
    
    // 暂停当前播放的视频
    if (currentMediaType === 'video') {
        domElements.mediaElement.pause();
    }
    
    // 检查是否需要切换媒体类型
    const shouldBeVideo = config.VIDEO_TYPES.includes(fileType);
    const shouldBeImage = config.IMAGE_TYPES.includes(fileType);
    
    if ((shouldBeVideo && currentMediaType === 'image') || 
        (shouldBeImage && currentMediaType === 'video')) {
        
        currentMediaType = shouldBeImage ? 'image' : 'video';
        replaceMediaElement(shouldBeVideo);
    }
    
    // 设置新源
    setMediaSource(filePath, fileName);
    
    // 恢复播放状态
    if (wasPlaying && currentMediaType === 'video') {
        domElements.mediaElement.play().catch(e => {
            console.error('Auto-play failed:', e);
        });
    }
    
    updateNavigationButtons();
}

function replaceMediaElement(isVideo) {
    if (!domElements.mediaContainer) return;

    // 创建新元素
    const newElement = isVideo ? 
        document.createElement('video') : 
        document.createElement('img');
    
    newElement.className = 'media-element';
    
    if (isVideo) {
        newElement.controls = true;
        newElement.autoplay = true;
    }
    
    // 替换DOM元素
    domElements.mediaContainer.removeChild(domElements.mediaElement);
    domElements.mediaElement = newElement;
    domElements.mediaContainer.insertBefore(newElement, domElements.loadingIndicator);
    
    // 重新绑定事件
    setupEventListeners();
}

/* ===================== 清理资源 ========================= */

function clearMediaViewerElement() {
    if (!domElements.mediaViewer) return;

    try {
        // 清除事件监听器
        if (domElements.closeBtn) {
            domElements.closeBtn.removeEventListener('click', handleClickCloseBtn);
        }
        if (domElements.lastBtn) {
            domElements.lastBtn.removeEventListener('click', handleClickLastBtn);
        }
        if (domElements.nextBtn) {
            domElements.nextBtn.removeEventListener('click', handleClickNextBtn);
        }
        if (domElements.mediaContainer) {
            domElements.mediaContainer.removeEventListener('dblclick', handleDblClickMedia);
        }
        if (domElements.mediaViewer) {
            domElements.mediaViewer.removeEventListener('keydown', handleKeyDown);
        }
        if (domElements.mediaElement) {
            domElements.mediaElement.removeEventListener('error', handleMediaError);
            domElements.mediaElement.removeEventListener('loadstart', showLoadingIndicator);
            domElements.mediaElement.removeEventListener('loadeddata', hideLoadingIndicator);
            
            if (currentMediaType === 'video') {
                domElements.mediaElement.removeEventListener('play', handleVideoPlay);
                domElements.mediaElement.removeEventListener('waiting', showLoadingIndicator);
                domElements.mediaElement.removeEventListener('playing', hideLoadingIndicator);
                domElements.mediaElement.pause();
                domElements.mediaElement.src = '';
            }
        }
        
        // 移除DOM元素
        domElements.mediaViewer.remove();
        
        // 重置变量
        currentMediaId = -1;
        currentMediaType = '';
        navigationCache = {};
        
        // 重置DOM引用
        Object.keys(domElements).forEach(key => {
            domElements[key] = null;
        });
    } catch (error) {
        console.error('Error while cleaning up media viewer:', error);
    }
}
