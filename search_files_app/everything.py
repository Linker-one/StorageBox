import os
import pickle
from watchdog.events import FileSystemEventHandler
from collections import defaultdict
import pygtrie  # 需安装 pip install pygtrie

class FileIndexer:
    def __init__(self):
        self.index = {}                  # {文件名: [完整路径1, 路径2...]} (支持同名文件)
        self.suffix_trie = pygtrie.CharTrie()  # 后缀Trie树，用于快速搜索
        self.path_to_names = defaultdict(set)  # {文件路径: {文件名}} (用于清理索引)

    def build_index(self, root_dir):
        """构建初始索引（多线程优化版）"""
        from concurrent.futures import ThreadPoolExecutor

        def process_file(root, file): # 处理单个文件
            full_path = os.path.join(root, file)
            self._add_to_index(file, full_path)

        with ThreadPoolExecutor() as executor: 
            for root, _, files in os.walk(root_dir):
                for file in files:
                    executor.submit(process_file, root, file) # 异步处理文件

    def _add_to_index(self, filename, full_path):
        """安全添加到索引结构"""
        # 主索引更新
        if filename not in self.index:
            self.index[filename] = []
        if full_path not in self.index[filename]:  # 避免重复添加
            self.index[filename].append(full_path)

        # 维护路径到文件名的反向映射
        self.path_to_names[full_path].add(filename)

        # 后缀Trie更新（大小写不敏感）
        lower_name = filename.lower()
        for i in range(len(lower_name)):
            substring = lower_name[i:]
            
            # 安全操作：获取或初始化该子串的集合
            if substring not in self.suffix_trie:
                self.suffix_trie[substring] = set()
            
            # 添加文件记录到对应子串节点
            self.suffix_trie[substring].add((filename, full_path))


    def save_index(self, filename="file_index.pkl"):
        """序列化索引到磁盘"""
        with open(filename, 'wb') as f:
            pickle.dump({
                'index': self.index,
                'path_to_names': self.path_to_names,
                'suffix_data': dict(self.suffix_trie)
            }, f)

    def load_index(self, filename="file_index.pkl"):
        """从磁盘加载索引"""
        with open(filename, 'rb') as f:
            data = pickle.load(f)
            self.index = data['index']
            self.path_to_names = defaultdict(set, data['path_to_names'])
            self.suffix_trie.update(data['suffix_data'])

    def _debug_print_index(self):
        """打印所有索引内容用于调试"""
        print("\n----- 主索引内容 -----")
        for filename, paths in self.index.items():
            print(f"[文件名] {filename}")
            for path in paths:
                print(f"  └─ {path}")

        print("\n----- 后缀Trie树内容 -----")
        for substring, files in self.suffix_trie.items():
            print(f"[子串] '{substring}' → 匹配文件：")
            for file in files:
                print(f"  ├─ {file[0]} (路径: {file[1]})")

        print("\n----- 路径反向映射 -----")
        for path, names in self.path_to_names.items():
            print(f"[路径] {path}")
            for name in names:
                print(f"  ├─ 关联文件名: {name}")

        print("\n=== 索引统计 ===")
        print(f"总文件数: {sum(len(v) for v in self.index.values())}")
        print(f"唯一文件名数: {len(self.index)}")
        print(f"后缀Trie条目数: {len(self.suffix_trie)}")
        print(f"最长后缀键: {max(self.suffix_trie.keys(), key=len, default='无')}")

class IndexUpdater(FileSystemEventHandler):
    def __init__(self, indexer):
        self.indexer = indexer

    def on_created(self, event):
        if not event.is_directory:
            self.indexer._add_to_index(
                os.path.basename(event.src_path),
                event.src_path
            )

    def on_deleted(self, event):
        if not event.is_directory:
            self._remove_from_index(event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self._remove_from_index(event.src_path)
            self.indexer._add_to_index(
                os.path.basename(event.dest_path),
                event.dest_path
            )

    def _remove_from_index(self, path):
        """安全移除索引（兼容同名文件）"""
        if path in self.indexer.path_to_names:
            for filename in self.indexer.path_to_names[path]:
                # 主索引清理
                self.indexer.index[filename].remove(path)
                if not self.indexer.index[filename]:
                    del self.indexer.index[filename]

                # Trie树清理
                lower_name = filename.lower()
                for i in range(len(lower_name)):
                    substring = lower_name[i:]
                    if substring in self.indexer.suffix_trie:
                        self.indexer.suffix_trie[substring].discard((filename, path))
                        if not self.indexer.suffix_trie[substring]:
                            del self.indexer.suffix_trie[substring]

            del self.indexer.path_to_names[path]

class FileSearcher:
    def __init__(self, indexer):
        self.indexer = indexer

    def search(self, query, limit=1000):
        """支持布尔AND子字符串搜索的最终版"""
        query = query.lower().strip()
        results = set()

        if not query:
            return []

        # 拆分为多个搜索词（支持AND逻辑）
        terms = query.split()  
        
        # 多关键词处理
        if len(terms) > 1:
            # 为每个term获取所有可能的子字符串匹配
            term_matches = []
            for term in terms:
                # 使用trie迭代器获取所有包含该子串的后缀
                matches = set()
                for suffix in self.indexer.suffix_trie.iterkeys(prefix=term):
                    matches.update(self.indexer.suffix_trie[suffix])
                term_matches.append(matches)
            
            # 计算所有term结果的交集
            if term_matches:
                results.update(term_matches[0])
                for match_set in term_matches[1:]:
                    results.intersection_update(match_set)
        else:
            try:
                # 单关键词：直接查找包含该子串的所有后缀
                for suffix in self.indexer.suffix_trie.iterkeys(prefix=terms[0]):
                    results.update(self.indexer.suffix_trie[suffix])

            finally:
                # 按路径排序并限制结果数
                return sorted(results, key=lambda x: x[1])[:limit]