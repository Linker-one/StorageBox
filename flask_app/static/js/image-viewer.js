import { updateStatusBar } from './status-bar.js';

// 模块常量
const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'];
const IMAGE_VIEWER_CLASS = 'img-viewer';

let contentArea, imgViewerContent, fileListContainer, lastBtn, nextBtn;
let eventDelegationHandler = null;

/* 打开图片查看器 */
export function openImageViewer(filePath, fileName) {
    clearImageViewerElement();
    
    cacheDOMElements();
    setupEventDelegation();

    const imgViewerElement = createImageViewerElement();
    contentArea.appendChild(imgViewerElement);
    
    imgViewerContent = imgViewerElement.querySelector('.img-container img');
    lastBtn = imgViewerElement.querySelector('.last');
    nextBtn = imgViewerElement.querySelector('.next');
    
    imgViewerContent.src = '/get_file/' + encodeURIComponent(filePath + '\\' + fileName);
    imgViewerContent.alt = fileName;
    
    updateNavigationButtons();
}

// =============== 主要功能实现 ================ //

function setupEventDelegation() {
    if (eventDelegationHandler) {
        contentArea.removeEventListener('click', eventDelegationHandler);
    }
    
    eventDelegationHandler = (e) => {
        const closeBtn = e.target.closest('.img-viewer .close');
        const lastBtn = e.target.closest('.img-viewer .last');
        const nextBtn = e.target.closest('.img-viewer .next');
        
        if (closeBtn) handleCloseClick();
        if (lastBtn && !lastBtn.disabled) handleImageNavigation(-1);
        if (nextBtn && !nextBtn.disabled) handleImageNavigation(1);
    };
    
    contentArea.addEventListener('click', eventDelegationHandler);
}

// =============== 辅助函数 ================ //

function cacheDOMElements() {
    contentArea = document.querySelector('.content-area');
    fileListContainer = document.querySelector('.file-list');
}

function createImageViewerElement() {
    const div = document.createElement('div');
    div.className = IMAGE_VIEWER_CLASS;
    div.innerHTML = `
        <button class="close">x</button>
        <button class="last" title="上一张">◀</button>
        <button class="next" title="下一张">▶</button>
        <div class="img-container">
            <img src="" alt="" />
        </div>`;
    return div;
}

function clearImageViewerElement() {
    const imgViewerElement = document.querySelector(`.${IMAGE_VIEWER_CLASS}`);
    if (imgViewerElement) {
        if (eventDelegationHandler) {
            contentArea.removeEventListener('click', eventDelegationHandler);
            eventDelegationHandler = null;
        }
        imgViewerElement.remove();
    }
}

// =============== 关键更新：改进导航逻辑 ================ //

function updateNavigationButtons() {
    if (!fileListContainer || !lastBtn || !nextBtn) return;

    const currentImg = fileListContainer.querySelector('.file-item.selected');
    if (!currentImg) {
        lastBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    const allFiles = Array.from(fileListContainer.children);
    const currentIndex = allFiles.indexOf(currentImg);
    
    // 检查前面是否有图片
    let hasPrevImage = false;
    for (let i = currentIndex - 1; i >= 0; i--) {
        const fileType = allFiles[i].querySelector('.file-type').textContent;
        if (IMAGE_TYPES.includes(fileType)) {
            hasPrevImage = true;
            break;
        }
    }
    lastBtn.disabled = !hasPrevImage;

    // 检查后面是否有图片
    let hasNextImage = false;
    for (let i = currentIndex + 1; i < allFiles.length; i++) {
        const fileType = allFiles[i].querySelector('.file-type').textContent;
        if (IMAGE_TYPES.includes(fileType)) {
            hasNextImage = true;
            break;
        }
    }
    nextBtn.disabled = !hasNextImage;
}

function handleImageNavigation(step) {
    const currentImg = fileListContainer.querySelector('.file-item.selected');
    if (!currentImg) return;

    const allFiles = Array.from(fileListContainer.children);
    const currentIndex = allFiles.indexOf(currentImg);
    let newIndex = currentIndex + step;

    // 查找有效图片
    while (newIndex >= 0 && newIndex < allFiles.length) {
        const fileType = allFiles[newIndex].querySelector('.file-type').textContent;
        if (IMAGE_TYPES.includes(fileType)) break;
        newIndex += step;
    }

    if (newIndex >= 0 && newIndex < allFiles.length) {
        const newImg = allFiles[newIndex];
        allFiles.forEach(item => item.classList.remove('selected'));
        newImg.classList.add('selected');
        ensureVisible(document.querySelector('.content-areas'), newImg);
        updateStatusBar();
        
        const fileName = newImg.querySelector('.file-name').textContent;
        const filePath = newImg.querySelector('.file-path').textContent;
        imgViewerContent.src = '/get_file/' + encodeURIComponent(filePath + '\\' + fileName);
        imgViewerContent.alt = fileName;

        updateNavigationButtons();
    }
}

function handleCloseClick() {
    clearImageViewerElement();
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