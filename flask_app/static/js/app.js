import { globalState } from './globals.js';
import { initClipboard } from "./clipboard.js";
import { initFileOperations } from "./file-operations.js";
import { initViewMode } from "./view-mode.js";
import { initSelection } from "./selection.js";
import { initNavigation } from "./navigation.js";
import { initSearch } from "./search.js";
import { initFileListManager, updateView } from "./file-list.js";
import { APIService } from "./api-service.js";
import { initSidebarToggle } from "./sidebar.js";

document.addEventListener('DOMContentLoaded', () => {
    // 初始化各个模块
    initClipboard();
    initFileOperations();
    initViewMode();
    initSelection();
    initNavigation();
    initSearch();
    initFileListManager();
    initSidebarToggle();

    // 触发初始视图更新
    APIService('/get_files', { 'path': '/' }, 'POST')
    .then(response => {
        globalState.fileList = response;
        updateView();
    })
    .catch(error => {
        console.error('Error fetching initial file list:', error);
    });
});