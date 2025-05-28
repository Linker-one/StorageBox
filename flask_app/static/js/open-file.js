import { openImageViewer } from './image-viewer.js';
import { openVideoViewer } from './video-viewer.js';

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'];
const VIDEO_TYPES = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'];

export function openFile(filePath, fileName, fileType) {
    if (IMAGE_TYPES.includes(fileType)) {
        // 如果是图片文件，直接打开图片查看器
        openImageViewer(filePath, fileName);
        return;
    } else if (VIDEO_TYPES.includes(fileType)) {
        // 如果是视频文件，打开视频查看器
        openVideoViewer(filePath, fileName);
        return;
    }
}