class windower:
    def __init__ (self):
        #初始化按键状态
        self.copy_button = False
        self.cut_button = False
        self.copyPath_button = False
        self.maxView_button = False
        self.midView_button = False
        self.minView_button = True
        self.show_button = True
        self.ext_button = True

        #地址框
        self.address = "C:/Users"
    
        #目录列表
        self.dir_list = []
        #文件列表
        self.file_list = []

from typing import List, Union, Optional
import os

class FileSystemNode:
    """文件系统节点的基类"""
    def __init__(self, name: str):
        self.name = name
        self.parent: Optional['Directory'] = None  # 父节点引用

    def get_path(self) -> str:
        """获取完整路径"""
        if self.parent is None:
            return self.name
        return os.path.join(self.parent.get_path(), self.name)

    def __repr__(self):
        return f"{self.__class__.__name__}(name='{self.name}')"


class File(FileSystemNode):
    """文件类"""
    def __init__(self, name: str, content: str = ""):
        super().__init__(name)
        self.content = content


class Directory(FileSystemNode):
    """目录类"""
    def __init__(self, name: str):
        super().__init__(name)
        self.children: List[Union['File', 'Directory']] = []

    def add_node(self, node: Union['File', 'Directory']) -> None:
        """添加子节点（文件或目录）"""
        if any(node.name == child.name for child in self.children):
            raise ValueError(f"Node '{node.name}' already exists")
        node.parent = self
        self.children.append(node)

    def remove_node(self, name: str) -> None:
        """移除子节点"""
        for i, child in enumerate(self.children):
            if child.name == name:
                self.children.pop(i)
                child.parent = None
                return
        raise ValueError(f"Node '{name}' not found")

    def find(self, name: str) -> Optional[FileSystemNode]:
        """在当前目录下查找节点"""
        for child in self.children:
            if child.name == name:
                return child
        return None

    def list_all(self, recursive: bool = False) -> List[str]:
        """列出所有子节点路径"""
        paths = []
        for child in self.children:
            paths.append(child.get_path())
            if recursive and isinstance(child, Directory):
                paths.extend(child.list_all(recursive=True))
        return paths



