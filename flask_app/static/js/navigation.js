import { APIService } from "./api-service.js";
import { updateView, getTopViewItemId } from "./file-list.js";

// =============== 路径导航、搜索 =============== //

export {
    initNavigation,
    navigateToPath,
    getCurrentPath,
    searchFile
}

let viewHistory = [{path: '\\', search_term: '', topViewItemId: 0}];
let currentPosition = 0;

const SELECTORS = {
    BACK_BTN: '.dir-navigation .back',
    FORWARD_BTN: '.dir-navigation .forward',
    PARENT_BTN: '.dir-navigation .parent',
    REFRESH_BTN: '.dir-navigation .refresh',
    ADDRESS_PATH: '.address-path',
    SEARCH_BAR: '.search-bar'
}

const domElements = {
    backBtn: null,
    forwardBtn: null,
    parentBtn: null,
    refreshBtn: null,
    addressPath: null,
    searchBar: null
}

function initNavigation() {
    cacheDOMElements();
    setupEventListeners();
}

function cacheDOMElements() {
    domElements.backBtn = document.querySelector(SELECTORS.BACK_BTN);
    domElements.forwardBtn = document.querySelector(SELECTORS.FORWARD_BTN);
    domElements.parentBtn = document.querySelector(SELECTORS.PARENT_BTN);
    domElements.refreshBtn = document.querySelector(SELECTORS.REFRESH_BTN);
    domElements.addressPath = document.querySelector(SELECTORS.ADDRESS_PATH);
    domElements.searchBar = document.querySelector(SELECTORS.SEARCH_BAR);
}

function setupEventListeners() {
    domElements.backBtn.addEventListener('click', handleBack);
    domElements.forwardBtn.addEventListener('click', handleForward);
    domElements.parentBtn.addEventListener('click', handleParent);
    domElements.refreshBtn.addEventListener('click', handleRefresh);
    domElements.addressPath.addEventListener('keydown', handleAddressPathKeyDown);
    domElements.addressPath.addEventListener('blur', handleAddressPathBlur);
    domElements.addressPath.addEventListener('change', handleAddressPathChange);
    domElements.searchBar.addEventListener('keydown', handleSearchKeyDown);
    domElements.searchBar.addEventListener('blur', handleSearchBlur);
}

function handleBack() {
    if (currentPosition === 0) return;

    viewHistory[currentPosition]['topViewItemId'] = getTopViewItemId();

    currentPosition--;
    const isSearch = viewHistory[currentPosition]['search_term'] != '';

    if (!isSearch) {
        APIService('/get_files', { path: viewHistory[currentPosition]['path'] }, 'POST')
        .then(response => {
            updateView(response, viewHistory[currentPosition]['topViewItemId']);
            setAddressPath(viewHistory[currentPosition]['path']);
        })
        .catch(error => {
            console.error('Error fetching files:', error);
            currentPosition++;
        });
    } else {
        const searchTerm = viewHistory[currentPosition['search_term']];
        setAddressPath('搜索中...');    
        APIService('/search', {
            path: viewHistory[currentPosition]['path'], 
            search_term: searchTerm
        }, 'POST')
        .then(response => {
            updateView(response, viewHistory[currentPosition]['topViewItemId']);
            setAddressPath(`"${searchTerm}"搜索结果：`);
        })
        .catch(err => {
            setAddressPath(getCurrentPath());
            alert('搜索失败');
            console.error('error:', err);
            currentPosition++;
        });
    }
}

function handleForward() {
    if (currentPosition === viewHistory.length - 1) return;

    viewHistory[currentPosition]['topViewItemId'] = getTopViewItemId();

    currentPosition++;
    const isSearch = viewHistory[currentPosition]['search_term'] != '';

    if (!isSearch) {
        APIService('/get_files', { path: viewHistory[currentPosition]['path'] }, 'POST')
        .then(response => {
            updateView(response, viewHistory[currentPosition]['topViewItemId']);
            setAddressPath(viewHistory[currentPosition]['path']);
        })
        .catch(error => {
            console.error('Error fetching files:', error);
            currentPosition--;
        });
    } else {
        const searchTerm = viewHistory[currentPosition]['search_term'];
        setAddressPath('搜索中...');
        APIService('/search', {
            path: viewHistory[currentPosition]['path'], 
            search_term: searchTerm
        }, 'POST')
        .then(response => {
            updateView(response, viewHistory[currentPosition]['topViewItemId']);
            setAddressPath(`"${searchTerm}"搜索结果：`);
        })
        .catch(err => {
            setAddressPath(getCurrentPath());
            alert('搜索失败');
            console.error('error:', err);
            currentPosition--;
        });
    }
}

function handleParent() {
    // 检查文本中是否只有一个/或\，且以/或\结尾
    if (/^[^\\/]*[\\/]$/.test(viewHistory[currentPosition]['path'])) return;
    if (viewHistory[currentPosition]['search_term']) return;

    viewHistory[currentPosition]['topViewItemId'] = getTopViewItemId();

    APIService('/parent_path', { path: viewHistory[currentPosition]['path'] }, 'POST')
    .then(response => {
        const parentPath = response['path'];

        setAddressPath(parentPath);
        for (let i = viewHistory.length - 1; i > currentPosition; i--) {
            viewHistory.pop();
        }
        viewHistory.push({path: parentPath, search_term: '', topViewItemId: 0});
        currentPosition++;
        updateView(response['fileList']);
    })
    .catch(error => {
        console.error('Error fetching parent path files:', error);
    });
}

function handleRefresh() {
    const inputPath = domElements.addressPath.value.trim();
    navigateToPath(inputPath);
}

function handleAddressPathKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();

        const inputPath = domElements.addressPath.value.trim();
        navigateToPath(inputPath);
    } else if (event.key === 'Escape') {
        setAddressPath(viewHistory[currentPosition]['path']);
    }
}

function handleAddressPathChange() {
    domElements.addressPath.scrollLeft = domElements.addressPath.scrollWidth - domElements.addressPath.clientWidth;
}

function handleAddressPathBlur() {
    setAddressPath(viewHistory[currentPosition]['path']);
}

function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        const search_term = domElements.searchBar.value.trim();
        searchFile(search_term);
    } else if (event.key === 'Escape') {
        domElements.searchBar.value = '';
    }
}

function handleSearchBlur() {
    domElements.searchBar.value = '';
}

function navigateToPath(dstPath) {
    dstPath = normalizeSlashes(dstPath);
    if (dstPath) {
        viewHistory[currentPosition]['topViewItemId'] = getTopViewItemId();
    
        APIService('/get_files', { path: dstPath }, 'POST')
        .then(response => {
            if (dstPath !== viewHistory[currentPosition]['path']) {
                for (let i = viewHistory.length - 1; i > currentPosition; i--) {
                    viewHistory.pop();
                }
                viewHistory.push({path: dstPath, search_term: '', topViewItemId: 0});
                currentPosition++;
                setAddressPath(dstPath);
            }
            updateView(response);
        })
        .catch(error => {
            console.error('Error fetching files:', error);
            alert('路径错误或无法访问: ' + error.message);
        });
    }
}

function searchFile(searchTerm) {
    if (!searchTerm || searchTerm === '/' || searchTerm === '\\') return;

    viewHistory[currentPosition]['topViewItemId'] = getTopViewItemId();

    setAddressPath('搜索中...');

    APIService('/search', {
        path: viewHistory[currentPosition]['path'], 
        search_term: searchTerm
    }, 'POST')
    .then(response => {
        setAddressPath(`"${searchTerm}"搜索结果：`);
        for (let i = viewHistory.length - 1; i > currentPosition; i--) {
            viewHistory.pop();
        }
        viewHistory.push({
            path: viewHistory[currentPosition]['path'],
            search_term: searchTerm,
            topViewItemId: 0
        });
        currentPosition++;
        updateView(response);
    })
    .catch(err => {
        setAddressPath(getCurrentPath());
        alert('搜索失败');
        console.error('error:', err);
    });
}

function setAddressPath(path) {
    domElements.addressPath.value = path;
}

function getCurrentPath() {
    return viewHistory[currentPosition]['path'];
}

function normalizeSlashes(text) {
    // 将连续的/或\替换为单个\
    return text.replace(/[\\/]+/g, '\\');
}