import { getFileList } from "./file-list.js";
import { getSelectedItemsData, hasSelectedItems } from "./selection.js";

export function updateStatusBar() {
    const fileList = getFileList();

    if (!hasSelectedItems()) {
        document.querySelector('.status-info').textContent = `${fileList.length} 个项目`;
        document.querySelector('.status-selected').textContent = '选中0个项目';
        document.querySelector('.status-size').textContent = '0 KB';
        return;
    }
    const selectedItems = getSelectedItemsData();

    // 计算总大小（这里只计算选中文件的总大小）
    let totalSize = 0;
    selectedItems.forEach(item => {
        const sizeText = item['size'];
        if (sizeText.includes('KB')) {
            totalSize += parseFloat(sizeText);
        } else if (sizeText.includes('MB')) {
            totalSize += parseFloat(sizeText) * 1024;
        } else if (sizeText.includes('GB')) {
            totalSize += parseFloat(sizeText) * 1024 * 1024;
        }
    });
    
    // 根据大小选择合适的单位
    let sizeText;
    if (totalSize < 1024) {
        sizeText = `${Math.round(totalSize)} KB`;
    } else if (totalSize < 1024 * 1024) {
        sizeText = `${(totalSize / 1024).toFixed(2)} MB`;
    } else {
        sizeText = `${(totalSize / (1024 * 1024)).toFixed(2)} GB`;
    }
    
    document.querySelector('.status-info').textContent = `${fileList.length} 个项目`;
    document.querySelector('.status-selected').textContent = `选中 ${selectedItems.length} 个项目`;
    document.querySelector('.status-size').textContent = sizeText;
}