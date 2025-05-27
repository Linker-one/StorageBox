import { openImageViewer } from './image-viewer.js';

export function openFile(filePath, fileName, fileType) {
    switch (fileType) {
        case 'jpg': case 'jpeg': case 'png':
        case 'gif': case 'bmp': case 'tiff': case 'webp':
            // 处理图片文件
            openImageViewer(filePath, fileName);
            break;
    }
}