
import everything
import os
import time
from watchdog.observers import Observer

# 使用示例
if __name__ == "__main__":
    indexer = everything.FileIndexer()
    searcher = everything.FileSearcher(indexer)

    myPath = input("请输入要索引的目录: ")
    if not os.path.exists(myPath):
        print("目录不存在，请检查路径。")
        exit()
        
    # 索引构建（如果已有保存的索引则加载）
    index_file = "file_index.pkl"
    if os.path.exists(index_file):
        print("Loading existing index...")
        indexer.load_index(index_file)
    else:
        print("Building new index...") 
        start = time.time()
        indexer.build_index(myPath)  # 构建索引
        elapsed = (time.time() - start) * 1000
        print(f"构建耗时：{elapsed:.2f}ms")
        indexer.save_index()

    # 启动文件监控
    observer = Observer()
    observer.schedule(
        everything.IndexUpdater(indexer),
        path=myPath,
        recursive=True
    )
    observer.start()

    try:
        while True:
            # indexer._debug_print_index()
            query = input("\nEnter search query (or 'quit'): ")
            if query.lower() == 'quit':
                break

            start = time.time()
            results = searcher.search(query)
            elapsed = (time.time() - start) * 1000

            print(f"Found {len(results)} results in {elapsed:.2f}ms:")
            for i, (name, path) in enumerate(results[:], 1):
                print(f"{i}. {name} \n   -> {path}")

    finally:
        observer.stop()
        observer.join()
        indexer.save_index()  # 退出时保存最新索引