import { config } from "./config.js";
import { APIService } from "./api-service.js";
import { navigateToPath, searchFile } from "./navigation.js";

export {
    initSidebar,
    updataDetailPage
}

const domElements = {
   leftToggleBtn: null,
   leftSidebar: null,
   rightToggleBtn: null,
   rightSidebar: null,
};

const SELECTORS = {
    LEFTTOGGLEBTN: '.sidebar-left-toggle',
    LEFTSIDEBAR: '.left-sidebar',
    RIGHTTOGGLEBTN: '.sidebar-right-toggle',
    RIGHTSIDEBAR: '.right-sidebar',
    ARTIST: '#detail-artist',
    CHARACTER: '#detail-character',
    COPYRIGHT: '#detail-copyright',
    SOURCE: '#detail-source'
}

function initSidebar() {
    cacheDOMElements();
    setupSidebar();
    initLeftSidebar();
}

function cacheDOMElements() {
    domElements.leftToggleBtn = document.querySelector(SELECTORS.LEFTTOGGLEBTN);
    domElements.leftSidebar = document.querySelector(SELECTORS.LEFTSIDEBAR);
    domElements.rightToggleBtn = document.querySelector(SELECTORS.RIGHTTOGGLEBTN);
    domElements.rightSidebar = document.querySelector(SELECTORS.RIGHTSIDEBAR);
}

function setupSidebar() {
    domElements.leftToggleBtn.addEventListener('click', event => handleLeftToggle(event));
    domElements.rightToggleBtn.addEventListener('click', event => handleRightToggle(event));
    domElements.leftSidebar.addEventListener('click', event => {
        const icon = event.target.closest('.dir-item-icon');
        const name = event.target.closest('.dir-item-name');
        if (icon) handleClickIcon.call(icon, event);
        else if (name) handleClickName.call(name, event);
    });
    domElements.rightSidebar.addEventListener('click', event => {
        const artist = event.target.closest(SELECTORS.ARTIST);
        const character = event.target.closest(SELECTORS.CHARACTER);
        const copyright = event.target.closest(SELECTORS.COPYRIGHT);
        const source = event.target.closest(SELECTORS.SOURCE);

        if (artist) handleClickArtist.call(artist);
        else if (character) handleClickCharacter.call(character);
        else if (copyright) handleClickCopyright.call(copyright);
        else if (source) handleClickSource.call(source);
    })
}

function handleLeftToggle(event) {
    event.stopPropagation();
    domElements.leftSidebar.classList.toggle('collapsed');
    domElements.leftToggleBtn.classList.toggle('collapsed');
}

function handleRightToggle(event) {
    event.stopPropagation();
    domElements.rightSidebar.classList.toggle('collapsed');
    domElements.rightToggleBtn.classList.toggle('collapsed');
}

function handleClickIcon(event) {
    event.stopPropagation();

    const dirItem = this.parentNode.parentNode;
    const isCollapsed = this.classList.contains('collapsed');

    this.classList.toggle('collapsed');

    if (isCollapsed) {
        APIService('/get_dirs', {path: dirItem.dataset.name}, 'POST')
        .then( response => {
            response.forEach(dir => {
                dirItem.appendChild(createDirItem(dir['name'], dir['path']));
            });
        })
        .catch(err => {
            console.error('error:', err);
        });
    } else {
        const children = dirItem.children;
        // 从最后一个元素开始移除直到只剩2个
        for (let i = children.length - 1; i >= 1; i--) {
            dirItem.removeChild(children[i]);
        }
    }
}

function handleClickName(event) {
    event.stopPropagation();

    navigateToPath(this.parentNode.parentNode.dataset.name);
}

function handleClickArtist() {
    if (this.textContent === '') return;

    searchFile(this.textContent);
}

function handleClickCharacter() {
    if (this.textContent === '') return;

    searchFile(this.textContent);
}

function handleClickCopyright() {
    if (this.textContent === '') return;

    searchFile(this.textContent);
}

function handleClickSource() {
    if (this.textContent === '') return;

    window.open("https://" + this.textContent);
}

function initLeftSidebar() {
    APIService('/get_dirs', {path: '\\'}, 'POST')
    .then( response => {
        const disks = response;
        disks.forEach(disk => {
            const dirItem = document.createElement('div');
            dirItem.className = 'dir-item';
            dirItem.dataset.name = disk['name'];
        
            dirItem.innerHTML = `
                <div class='dir-item-header'>
                    <div class='dir-item-icon collapsed'></div>
                    <div class='dir-item-name'>${disk['name'].slice(0, 2)}</div>
                </div>
            `;
            domElements.leftSidebar.appendChild(dirItem);
        });
    })
    .catch(err => {
        console.error('error:', err);
    });
}

function createDirItem(name, path) {
    const dirItem = document.createElement('div');
    dirItem.className = 'dir-item';
    dirItem.style.marginLeft = '12px';
    dirItem.dataset.name = normalizeSlashes(path + '\\' + name);

    dirItem.innerHTML = `
        <div class='dir-item-header'>
            <div class='dir-item-icon collapsed'></div>
            <div class='dir-item-name'>${name}</div>
        </div>
    `;

    return dirItem;
}

function updataDetailPage(fileItem = {
    name: '',
    type: '',
    modified: '',
    size: ''
}) {
    const fileName = fileItem.name;
    document.querySelector('#detail-name').textContent = fileName;
    document.querySelector('#detail-type').textContent = fileItem.type;
    document.querySelector('#detail-modified').textContent = fileItem.modified;
    document.querySelector('#detail-size').textContent = fileItem.size;

    setPreviewImg(document.querySelector('.preview-image'), fileItem);

    const isArtwork = hasExactlyFourHashes(fileItem.name);
    let artist, character, copyright, source;

    if (isArtwork) {
        artist = getTextBetweenHashes(fileName, 1);
        character = getTextBetweenHashes(fileName, 2);
        copyright = getTextBetweenHashes(fileName, 3);
        source = getTextBetweenHashes(fileName, 4);
    } else {
        artist = "";
        character = "";
        copyright = "";
        source = "";
    }

    document.querySelector('#detail-artist').textContent = artist;
    document.querySelector('#detail-character').textContent = character;
    document.querySelector('#detail-copyright').textContent = copyright;
    document.querySelector('#detail-source').textContent = source;
}

function setPreviewImg(element, item) {
    const type = item.type.toLowerCase(); // 转换为小写方便比较
    
    // 去除可能的点前缀（如".jpg"变成"jpg"）
    const cleanType = type.startsWith('.') ? type.slice(1) : type;
    
    // 设置对应图标
    if (type === '文件夹') {
        element.src = '/static/img/folder.svg';
    } else if (type === '本地磁盘') {
        element.src = '/static/img/disk.svg';
    } else if (config.IMAGE_TYPES.includes(cleanType)) {
        element.src = `/get_thumbnail/${encodeURIComponent(normalizeSlashes(item.path + '\\' + item.name))}`;
    } else if (config.VIDEO_TYPES.includes(cleanType)) {
        element.src = `/get_thumbnail/${encodeURIComponent(normalizeSlashes(item.path + '\\' + item.name))}`;
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
    element.alt = '预览图';
}

function hasExactlyFourHashes(str) {
    // 使用正则表达式匹配所有#字符，并检查其数量是否为4
    const matches = str.match(/#/g);
    return matches !== null && matches.length === 4;
}

function getTextBetweenHashes(str, n) {
    // 返回字符串中指定第 n 个 # 到前一个 # 之间的字符（如果是第一个 # 则返回它前面的所有字符）
    if (typeof str !== 'string' || n < 1) {
        return '';
    }
    const hashIndices = [];
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '#') {
            hashIndices.push(i);
        }
    }
    // 如果#的数量不足n，返回空字符串
    if (hashIndices.length < n) {
        return '';
    }
    const start = n === 1 ? 0 : (hashIndices[n - 2] + 1);
    const end = hashIndices[n - 1];
    return str.substring(start, end).trim();
}

function normalizeSlashes(text) {
    // 将连续的/或\替换为单个\
    return text.replace(/[\\/]+/g, '\\');
}