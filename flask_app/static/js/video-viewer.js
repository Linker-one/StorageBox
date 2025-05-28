import { updateStatusBar } from './status-bar.js';

// 模块常量
const VIDEO_TYPES = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'];
const VIDEO_VIEWER_CLASS = 'video-viewer';

let contentArea, videoViewerContent, fileListContainer, lastBtn, nextBtn, playPauseBtn;
let eventDelegationHandler = null;

/* 打开视频查看器 */
export function openVideoViewer(filePath, fileName) {
    clearVideoViewerElement();
    
    cacheDOMElements();
    setupEventDelegation();

    const videoViewerElement = createVideoViewerElement();
    contentArea.appendChild(videoViewerElement);
    
    videoViewerContent = videoViewerElement.querySelector('.video-container video');
    lastBtn = videoViewerElement.querySelector('.last');
    nextBtn = videoViewerElement.querySelector('.next');
    playPauseBtn = videoViewerElement.querySelector('.play-pause');
    
    videoViewerContent.src = '/get_file/' + encodeURIComponent(filePath + '\\' + fileName);
    videoViewerContent.controls = true;
    
    updateNavigationButtons();
}

// =============== 主要功能实现 ================ //

function setupEventDelegation() {
    if (eventDelegationHandler) {
        contentArea.removeEventListener('click', eventDelegationHandler);
    }
    
    eventDelegationHandler = (e) => {
        const closeBtn = e.target.closest('.video-viewer .close');
        const lastBtn = e.target.closest('.video-viewer .last');
        const nextBtn = e.target.closest('.video-viewer .next');
        const playPauseBtn = e.target.closest('.video-viewer .play-pause');
        
        if (closeBtn) handleCloseClick();
        if (lastBtn && !lastBtn.disabled) handleVideoNavigation(-1);
        if (nextBtn && !nextBtn.disabled) handleVideoNavigation(1);
        if (playPauseBtn) handlePlayPause();
    };
    
    contentArea.addEventListener('click', eventDelegationHandler);
}

// =============== 辅助函数 ================ //

function cacheDOMElements() {
    contentArea = document.querySelector('.content-area');
    fileListContainer = document.querySelector('.file-list');
}

function createVideoViewerElement() {
    const div = document.createElement('div');
    div.className = VIDEO_VIEWER_CLASS;
    div.innerHTML = `
        <button class="close">x</button>
        <div class="controls">
            <button class="last" title="上一个视频">◀</button>
            <button class="play-pause" title="播放/暂停">⏯</button>
            <button class="next" title="下一个视频">▶</button>
        </div>
        <div class="video-container">
            <video src="" controls autoplay></video>
        </div>`;
    return div;
}

function clearVideoViewerElement() {
    const videoViewerElement = document.querySelector(`.${VIDEO_VIEWER_CLASS}`);
    if (videoViewerElement) {
        if (eventDelegationHandler) {
            contentArea.removeEventListener('click', eventDelegationHandler);
            eventDelegationHandler = null;
        }
        videoViewerElement.remove();
    }
}

// =============== 视频导航逻辑 ================ //

function updateNavigationButtons() {
    if (!fileListContainer || !lastBtn || !nextBtn || !playPauseBtn) return;

    const currentVideo = fileListContainer.querySelector('.file-item.selected');
    if (!currentVideo) {
        lastBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    const allFiles = Array.from(fileListContainer.children);
    const currentIndex = allFiles.indexOf(currentVideo);
    
    // 检查前面是否有视频
    let hasPrevVideo = false;
    for (let i = currentIndex - 1; i >= 0; i--) {
        const fileType = allFiles[i].querySelector('.file-type').textContent;
        if (VIDEO_TYPES.includes(fileType)) {
            hasPrevVideo = true;
            break;
        }
    }
    lastBtn.disabled = !hasPrevVideo;

    // 检查后面是否有视频
    let hasNextVideo = false;
    for (let i = currentIndex + 1; i < allFiles.length; i++) {
        const fileType = allFiles[i].querySelector('.file-type').textContent;
        if (VIDEO_TYPES.includes(fileType)) {
            hasNextVideo = true;
            break;
        }
    }
    nextBtn.disabled = !hasNextVideo;
}

function handleVideoNavigation(step) {
    const currentVideo = fileListContainer.querySelector('.file-item.selected');
    if (!currentVideo) return;

    const allFiles = Array.from(fileListContainer.children);
    const currentIndex = allFiles.indexOf(currentVideo);
    let newIndex = currentIndex + step;

    // 查找有效视频
    while (newIndex >= 0 && newIndex < allFiles.length) {
        const fileType = allFiles[newIndex].querySelector('.file-type').textContent;
        if (VIDEO_TYPES.includes(fileType)) break;
        newIndex += step;
    }

    if (newIndex >= 0 && newIndex < allFiles.length) {
        const newVideo = allFiles[newIndex];
        allFiles.forEach(item => item.classList.remove('selected'));
        newVideo.classList.add('selected');
        ensureVisible(document.querySelector('.content-areas'), newVideo);
        updateStatusBar();
        
        const fileName = newVideo.querySelector('.file-name').textContent;
        const filePath = newVideo.querySelector('.file-path').textContent;
        
        // 暂停当前视频
        videoViewerContent.pause();
        
        // 加载新视频
        videoViewerContent.src = '/get_file/' + encodeURIComponent(filePath + '\\' + fileName);
        
        // 更新播放/暂停按钮状态
        playPauseBtn.textContent = '⏯';
        
        updateNavigationButtons();
    }
}

function handlePlayPause() {
    if (videoViewerContent.paused) {
        videoViewerContent.play();
        playPauseBtn.textContent = '⏸';
    } else {
        videoViewerContent.pause();
        playPauseBtn.textContent = '▶';
    }
}

function handleCloseClick() {
    if (videoViewerContent) {
        videoViewerContent.pause();
    }
    clearVideoViewerElement();
}

function ensureVisible(parent, child) {
    if (!parent || !child) return;

    const parentRect = parent.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    
    if (childRect.top < parentRect.top) {
        parent.scrollTop -= parentRect.top - childRect.top;
    } else if (childRect.bottom > parentRect.bottom) {
        parent.scrollTop += childRect.bottom - parentRect.bottom;
    }
}
