import os
import shutil
import time
import fnmatch
import psutil

def create_file(file, path):
    """
    新建文件
    """
    os.chdir(path)
    try:
        with open(file, 'w', encoding='utf-8') as f:
            f.write("")
        print(f"创建{file}成功")
    except:
        print(f"创建{file}失败")

def create_dir(dir, path):
    """
    create dir
    """
    os.chdir(path)
    try:
        os.mkdir(dir)
        print(f"创建{dir}成功")
    except:
        print(f"创建{dir}失败")

def copy_file(src, dst):
    """
    复制文件
    src 源文件路径
    dst 目标路径
    """
    try:
        shutil.copy2(src, dst)
        print(f"已复制{src}到{dst}")
    except Exception as e:
        print(f"复制{src}失败:{e}")

def copy_dir(src, dst):
    """
    复制目录
    src 源目录路径
    dst 目标路径
    """
    try:
        shutil.copytree(src, dst)
        print(f"已复制{src}到{dst}")
    except Exception as e:
        print(f"复制{src}失败:{e}")

def move_file_or_dir(src, dst):
    """
    移动文件或目录
    src 源目录路径
    dst 目标路径
    """
    try:
        shutil.move(src, dst)
        print(f"已移动{src}到{dst}")
    except Exception as e:
        print(f"移动{src}失败:{e}")


def rename_file_or_dir(old_name, new_name):
    try:
        os.rename(old_name, new_name)
        print(f"成功将 '{old_name}' 重命名为 '{new_name}'")
    except FileNotFoundError:
        print(f"错误：'{old_name}' 不存在")
    except FileExistsError:
        print(f"错误：'{new_name}' 已存在")
    except Exception as e:
        print(f"发生错误: {e}")

def del_file(file):
    try:
        if os.path.exists(file):
            os.remove(file)
            print(f"文件{file}已删除")
        else:
            print(f"文件{file}不存在")
    except Exception as e:
        print(f"删除{file}失败:{e}")

def del_dir(dir):
    try:
        if os.path.exists(dir):
            shutil.rmtree(dir)
            print(f"目录{dir}已删除")
        else:
            print(f"目录{dir}不存在")
    except Exception as e:
        print(f"删除{dir}失败:{e}")

def get_disks():
    """
    获取磁盘信息
    """
    partitions = psutil.disk_partitions()
    disk_info = []
    for partition in partitions:
        usage = psutil.disk_usage(partition.mountpoint)
        disk_info.append({
            'name': partition.device,
            'modified': '-',
            'type': '本地磁盘',
            'size': convert_size(usage.total),
            'path': '',
            'mountpoint': partition.mountpoint,
            'fstype': partition.fstype,
            'opts': partition.opts,
            'used': usage.used,
            'free': usage.free,
            'percent': usage.percent
        })
    return disk_info

def get_files(path):
    """
    获取指定目录下的文件、目录信息
    """
    #判断路径是否存在
    if not os.path.exists(path):
        return 
    if path == '/' or path == '\\':
        return get_disks()
    dir_list = []
    #处理所有文件和子文件夹
    files = [os.path.join(path, f) for f in os.listdir(path)]
    
    for file_path in files:
        # 获取文件基础信息
        name = os.path.basename(file_path)
        
        # 获取修改时间并格式化为字符串
        modified_time = os.path.getmtime(file_path)
        modified = time.strftime('%Y-%m-%d %H:%M', time.localtime(modified_time))
        
        # 判断文件类型
        if os.path.isdir(file_path):
            file_type = "文件夹"
            icon = ""
            size = "-"
        else:
            size = os.path.getsize(file_path)
            # 根据扩展名简单判断文件类型
            _, ext = os.path.splitext(name)
            file_type = ext[1:].lower() if ext else "file"
            if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']:
                icon = os.path.join(path, name)
            else:
                icon = ""
        
        dir_list.append({
            "icon": icon,
            "name": name,
            "modified": modified,
            "type": file_type,
            "size": convert_size(str(size)),
            "path": path
        })
    return sort_files(dir_list)

def get_dirs(path):
    """
    获取指定目录下的目录信息
    """
    #判断路径是否存在
    if not os.path.exists(path):
        return 
    
    dir_list = []
    if path == '/' or path == '\\':
        disks = get_disks()
        for disk in disks:
            dir_list.append({
                "name": disk['name'],
                "path": '\\'
            })
        return dir_list
    
    #处理所有文件和子文件夹
    files = [os.path.join(path, f) for f in os.listdir(path)]
    
    for file_path in files:
        # 获取文件基础信息
        name = os.path.basename(file_path)
        
        # 判断文件类型
        if os.path.isdir(file_path):
            dir_list.append({
                "name": name,
                "path": path
            })

    return dir_list
  
def search_files(directory, pattern):
    """
    在指定目录及其子目录中搜索匹配的文件
    
    :param directory: 要搜索的根目录
    :param pattern: 文件名匹配模式（支持Unix shell风格通配符）
    :return: 匹配的文件路径列表
    """
    dir_list = []
    for root, dirs, files in os.walk(directory):
        for filename in files:
            if fnmatch.fnmatch(filename, pattern):
                name = filename
            
                # 获取修改时间并格式化为字符串
                modified_time = os.path.getmtime(os.path.join(root, filename))
                modified = time.strftime('%Y-%m-%d %H:%M', time.localtime(modified_time))

                
                # 判断文件类型
                if os.path.isdir(os.path.join(root, filename)):
                    file_type = "文件夹"
                    size = "-"
                else:
                    size = os.path.getsize(os.path.join(root, filename))
                    # 根据扩展名简单判断文件类型
                    _, ext = os.path.splitext(name)
                    file_type = ext[1:].lower() if ext else "file"
                
                dir_list.append({
                    "name": name,
                    "modified": modified,
                    "type": file_type,
                    "size": convert_size(str(size)),
                    "path": root
                })
    return dir_list

def sort_files(dir_list):
    """
    对文件列表进行排序
    :param dir_list: 文件列表
    """
    sorted_list = sorted(
        dir_list,
        key=lambda x: (
            0 if x["type"] == "文件夹" else 1,  # 文件夹优先 (0 < 1)
            x["name"]                 # 按 name 字母顺序（不区分大小写）
        )
    )
    return sorted_list

def convert_size(size_str):
    """
    将字节大小转换为合适的单位
    :param size_str: 字节大小字符串
    """
    if size_str == '-': return size_str
    try:
        size = float(size_str)  # 支持带小数点的输入
    except ValueError:
        return "error"
    
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    unit_index = 0
    
    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1
    
    # 根据大小选择合适的小数位数
    if unit_index == 0:  # 字节不需要小数
        return f"{int(size)}{units[unit_index]}"
    elif size < 10:
        return f"{size:.2f}{units[unit_index]}"  # 小于10保留2位小数
    else:
        return f"{size:.1f}{units[unit_index]}"  # 其他情况保留1位小数
