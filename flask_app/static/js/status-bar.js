export function updateStatusBar() {
    const totalItems = document.querySelectorAll('.file-item').length;
    const selectedItems = document.querySelectorAll('.file-item.selected').length;
    
    // 计算总大小（这里只计算选中文件的总大小）
    let totalSize = 0;
    document.querySelectorAll('.file-item.selected').forEach(item => {
        const sizeText = item.querySelector('.file-size').textContent;
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
    
    document.querySelector('.status-info').textContent = `${totalItems} 个项目`;
    document.querySelector('.status-selected').textContent = `选中 ${selectedItems} 个项目`;
    document.querySelector('.status-size').textContent = sizeText;
}