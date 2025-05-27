# import os
# import time

# if __name__ == "__main__":
#     root_dir = input("请输入要索引的目录: ")
#     start = time.time()
#     for root, _, files in os.walk(root_dir):
#         for file in files: pass
#     elapsed = (time.time() - start) * 1000
#     print(f"索引耗时：{elapsed:.2f}ms")

import os
import fnmatch
from typing import Iterable  

def search_files(directory, pattern):
    """
    在指定目录及其子目录中搜索匹配的文件
    
    :param directory: 要搜索的根目录
    :param pattern: 文件名匹配模式（支持Unix shell风格通配符）
    :return: 匹配的文件路径列表
    """
    matched_files = []
    for root, dirs, files in os.walk(directory):
        for filename in files:
            if fnmatch.fnmatch(filename, pattern):
                matched_files.append(os.path.join(root, filename))
    return matched_files
# fnmatch 支持以下通配符：
# *: 匹配任意多个字符（包括空字符）。
# ?: 匹配单个任意字符。
# [seq]: 匹配 seq 中的任意一个字符（如 [abc] 匹配 a、b 或 c）。
# [!seq]: 匹配不在 seq 中的任意字符（如 [!abc] 匹配非 a、b、c 的字符）。
# 字符范围：[a-z] 表示匹配任意小写字母。

def search_files_generator(directory: str, pattern: str) -> Iterable[str]:
    """
    生成器版本的搜索函数，节省内存
    
    :param directory: 要搜索的根目录
    :param pattern: 文件名匹配模式
    :yield: 匹配的文件路径
    """
    if not os.path.isdir(directory):
        raise FileNotFoundError(f"Directory not found: {directory}")
        
    for root, dirs, files in os.walk(directory):
        for filename in files:
            if fnmatch.fnmatch(filename, pattern):
                yield os.path.join(root, filename)

def main():
    path = input("输入搜索地址：")
    name = input("输入要搜索的文本：")
    
    # 执行搜索
    print(f"在 {path} 中搜索匹配 '{name}' 的文件...")
    results = search_files(path, name)
    
    # 输出结果
    if results:
        print("\n找到以下匹配文件：")
        for filepath in results:
            print(filepath)
        print(f"\n共找到 {len(results)} 个匹配文件。")
    else:
        print("\n未找到匹配文件。")

if __name__ == "__main__":
    main()
