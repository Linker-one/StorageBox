import os
from flask import request, jsonify, Blueprint, send_from_directory
from . import file_dir

bp = Blueprint('update_path', __name__, url_prefix='/')

# 允许的图片扩展名
VIDEO_TYPES = {'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'}
IMAGE_TYPES = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'}
ALLOWED_EXTENSIONS = VIDEO_TYPES.union(IMAGE_TYPES)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/get_files', methods=['POST'])
def get_files():
    data = request.get_json()
    return jsonify(file_dir.get_files(data['path']))

@bp.route('/get_file/<path:filename>')
def get_file(filename):
    # 只返回文件名部分，防止目录穿越
    dir_path = os.path.dirname(filename)
    file_name = os.path.basename(filename)
    
    # 安全检查
    if not os.path.isfile(filename) or not allowed_file(file_name):
        return "Invalid file", 404
        
    return send_from_directory(dir_path, file_name)


@bp.route('/paste', methods=['POST'])
def paste():
    data = request.get_json()
    type = data["actionType"]
    src = data["sourcePath"]
    dst = data["destinationPath"]
    items = data["items"]

    if type == "copy":
        for i in items:
            if i["type"] == "文件夹":
                file_dir.copy_dir(os.path.join(src,i['name']), os.path.join(dst,i["name"]))
            elif i["type"] == "本地磁盘":
                return
            else:
                file_dir.copy_file(os.path.join(src,i['name']),dst)
    elif type == "cut":
        for i in items:
            if i["type"] == "本地磁盘":
                return
            else:
                file_dir.move_file_or_dir(os.path.join(src,i['name']),dst)

    return jsonify(file_dir.get_files(dst))

@bp.route('/create_file', methods=['POST'])
def create_file():
    data = request.get_json()
    file_dir.create_file(data["name"], data["path"])
    
    return jsonify(file_dir.get_files(data['path']))

@bp.route('/create_dir', methods=['POST'])
def create_dir():
    data = request.get_json()
    file_dir.create_dir(data["name"], data["path"])
    
    return jsonify(file_dir.get_files(data['path']))

@bp.route('/rename', methods=['POST'])
def rename():
    data = request.get_json()
    file_dir.rename_file_or_dir(os.path.join(data["path"],data["old_name"]), 
                              os.path.join(data["path"],data["new_name"]))
    return jsonify(file_dir.get_files(data["path"]))

@bp.route('/delete', methods=['POST'])
def delete():
    data = request.get_json()
    path = data[0]
    data = data[1:]
    for i in data:
        if i["type"] == "文件夹":
            file_dir.del_dir(os.path.join(path, i["name"]))
        else:
            file_dir.del_file(os.path.join(path, i["name"]))

    return jsonify(file_dir.get_files(path))

@bp.route('/get_parent_path_files', methods=['POST'])
def get_parent_path_files():
    data = request.get_json()
    father_path = os.path.normpath(os.path.join(data['path'],".."))
    file_list = file_dir.get_files(father_path)
    file_list.append(father_path)
    return jsonify(file_list)

@bp.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    if data["path"] == "":
        return jsonify("")
    else:
        fileList = file_dir.search_files(data["path"],'*'+data["text"]+'*')
        return jsonify(fileList)