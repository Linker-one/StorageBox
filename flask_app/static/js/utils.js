export function normalizeSlashes(str) {
    // 清除连续 '/' 或 '\'
    return str.replace(/[\\/]{2,}/g, match => match.charAt(0));
}

export function isValidFilename(name) {
    // 检测特殊字符
    return !/[\\/:*?"<>|]/.test(name);
}

export function setAddressPath(element, path) {
    // 设置地址栏路径
    element.value = path;
    setTimeout(() => {
        element.scrollLeft = element.scrollWidth;
    }, 10);
}
