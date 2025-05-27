import { globalState } from "./globals.js";
import { APIService } from "./api-service.js";
import { updateView } from "./file-list.js";
import { setAddressPath } from "./utils.js";

let searchInput, addressPath;

export function initSearch() {
    searchInput = document.querySelector('.address-bar .search-bar');
    addressPath = document.querySelector('.address-bar .address-path');

    searchInput.addEventListener('keydown', handleSearchKeyDown);
    searchInput.addEventListener('blur', handleSearchBlur);
}

function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        APIService('/search_files', {'path': globalState.Paths[globalState.indexPath], 'search_term': searchInput.value.trim()}, 'POST')
        .then(response => {
            globalState.fileList = response;
            setAddressPath(addressPath, '');
            updateView();
        })
        .catch(err => {
            alert('搜索失败');
            console.error('error:', err);
        });
    }
}

function handleSearchBlur() {
    searchInput.value = '';
}