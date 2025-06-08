import { config } from './config.js';
import { navigateToPath } from './navigation.js';
import { openMediaViewer } from './media-viewer.js';

export function openFile(item) {
    const name = item['name'];
    const path = item['path'];
    const type = item['type'];

    if (type === '文件夹') {
        navigateToPath(`${path}\\${name}`);
    } else if (type === '本地磁盘') {
        navigateToPath(name);
    } else if (config.IMAGE_TYPES.includes(type)) {
        // 如果是图片文件，直接打开图片查看器
        openMediaViewer(path, name, 'image');
        return;
    } else if (config.VIDEO_TYPES.includes(type)) {
        // 如果是视频文件，打开视频查看器
        openMediaViewer(path, name, 'video');
        return;
    }
}