import { APIService } from "./api-service.js";
import { globalState } from "./globals.js";
import { updateView } from "./file-list.js";
import { setAddressPath } from "./utils.js";


let backBtn, forwardBtn, parentBtn, refreshBtn, addressPath;

export function initNavigation() {
    backBtn = document.querySelector('.dir-navigation .back');
    forwardBtn = document.querySelector('.dir-navigation .forward');
    parentBtn = document.querySelector('.dir-navigation .parent');
    refreshBtn = document.querySelector('.dir-navigation .refresh');
    addressPath = document.querySelector('.address-bar .address-path');

    backBtn.addEventListener('click', handleBack);
    forwardBtn.addEventListener('click', handleForward);
    parentBtn.addEventListener('click', handleParent);
    refreshBtn.addEventListener('click', handleRefresh);
    addressPath.addEventListener('keydown', handleAddressPathKeyDown);
    addressPath.addEventListener('blur', handleAddressPathBlur);
}

function handleBack() {
    if (globalState.indexPath <= 0) return;

    globalState.indexPath--;

    APIService('/get_files', { 'path': globalState.Paths[globalState.indexPath] }, 'POST')
    .then(response => {
        globalState.fileList = response;
        updateView();
        setAddressPath(addressPath, globalState.Paths[globalState.indexPath]);
    })
    .catch(error => {
        console.error('Error fetching files:', error);
        globalState.indexPath++;
    });
}

function handleForward() {
    if (globalState.indexPath >= globalState.Paths.length - 1) return;

    globalState.indexPath++;

    APIService('/get_files', { 'path': globalState.Paths[globalState.indexPath] }, 'POST')
    .then(response => {
        globalState.fileList = response;
        updateView();
        setAddressPath(addressPath, globalState.Paths[globalState.indexPath]);
    })
    .catch(error => {
        console.error('Error fetching files:', error);
        globalState.indexPath--;
    });
}

function handleParent() {
    if (/^[\/\\]$/.test(globalState.Paths[globalState.indexPath])) return;

    APIService('/get_parent_path_files', { 'path': globalState.Paths[globalState.indexPath] }, 'POST')
    .then(response => {
        globalState.fileList = response;
        const parentPath = globalState.fileList.pop();
        setAddressPath(addressPath, parentPath);
        for (let i = globalState.Paths.length - 1; i > globalState.indexPath; i--) {
            globalState.Paths.pop();
        }
        globalState.Paths.push(parentPath);
        globalState.indexPath++;
        updateView();
    })
    .catch(error => {
        console.error('Error fetching parent path files:', error);
    });
}

function handleRefresh() {
    APIService('/get_files', { 'path': addressPath.value.trim() }, 'POST')
    .then(response => {
        globalState.fileList = response;
        updateView();
        if (addressPath.value.trim() !== globalState.Paths[globalState.indexPath]) {
            globalState.Paths.push(addressPath.value.trim());
            globalState.indexPath++;
        }
    })
    .catch(error => {
        console.error('Error refreshing files:', error);
        alert('刷新失败: ' + error.message);
    });
}

function handleAddressPathKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        if (addressPath.value.trim()) {
            APIService('/get_files', { 'path': addressPath.value.trim() }, 'POST')
            .then(response => {
                globalState.fileList = response;
                updateView();
                if (addressPath.value.trim() !== globalState.Paths[globalState.indexPath]) {
                    globalState.Paths.push(addressPath.value.trim());
                    globalState.indexPath++;
                }
            })
            .catch(error => {
                console.error('Error fetching files:', error);
                alert('路径错误或无法访问: ' + error.message);
            });
        }
    }
}

function handleAddressPathBlur() {
    setAddressPath(addressPath, globalState.Paths[globalState.indexPath]);
}