import { initClipboard } from './clipboard.js';
import { initFileOperations } from './file-operations.js';
import { initViewMode } from './view-mode.js';
import { initSelection } from './selection.js';
import { initNavigation, navigateToPath, getCurrentPath } from './navigation.js';
import { initSidebar } from './sidebar.js';
import { initFileList } from './file-list.js';

document.addEventListener('DOMContentLoaded', () => {
    // 初始化各个模块
    initClipboard();
    initFileOperations();
    initViewMode();
    initSelection();
    initNavigation();
    initSidebar();
    initFileList();

    navigateToPath(getCurrentPath());
});