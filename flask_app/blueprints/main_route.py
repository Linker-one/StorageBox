import os
from flask import request, Blueprint, send_from_directory
from modules import create_thumbnail

VIDEO_TYPES = {'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'}
IMAGE_TYPES = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'}

bp = Blueprint('main_route', __name__, url_prefix='/')

@bp.route('/get_thumbnail/<path:file_path>')
def get_thumbnail(file_path):
    file_dir = os.path.dirname(file_path)
    file_name = os.path.basename(file_path)
    _, ext = os.path.splitext(file_name)
    ext = ext[1:]

    thumbnail_name = 'thumbnail.' + file_name + '.webp'
    thumbnail_path = os.path.join(create_thumbnail.output_dir, thumbnail_name)
    
    if not os.path.exists(thumbnail_path):
        if ext in IMAGE_TYPES:
            create_thumbnail.create_image_thumbnail(file_dir, file_name)
        elif ext in VIDEO_TYPES:
            create_thumbnail.capture_video_thumbnail(file_dir, file_name)
    
    return send_from_directory(create_thumbnail.output_dir, thumbnail_name)