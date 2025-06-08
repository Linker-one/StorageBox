import os
import cv2
from PIL import Image

script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = os.path.join(os.path.dirname(script_dir), "static\\thumbnail")
output_prefix = 'thumbnail.'
output_ext = '.webp'

def create_image_thumbnail(input_dir, input_name, max_size=(480, 480)):
    """
    生成图像的缩略图（Pillow）
    实测比OpenCv生成的要小
    """
    thumbnail_name = output_prefix + input_name + output_ext
    input_path = os.path.join(input_dir, input_name)
    output_path = os.path.join(output_dir, thumbnail_name)

    # 打开图片
    img = Image.open(input_path)
    # 生成缩略图（自动保持宽高比）
    img.thumbnail(max_size, Image.Resampling.LANCZOS)  # Pillow 10+ 使用 LANCZOS
    img.save(output_path)

def create_image_thumbnail_opencv(input_dir, input_name, size=(480, 480)):
    """
    生成图像的缩略图（OpenCV）
    """
    thumbnail_name = output_prefix + input_name + output_ext
    input_path = os.path.join(input_dir, input_name)
    output_path = os.path.join(output_dir, thumbnail_name)
    
    img = cv2.imread(input_path)
    if img is not None:
        # 保持宽高比
        h, w = img.shape[:2]
        ratio = min(size[0]/w, size[1]/h)
        new_size = (int(w*ratio), int(h*ratio))
        
        resized = cv2.resize(img, new_size, interpolation=cv2.INTER_AREA)
        cv2.imwrite(output_path, resized)

def capture_video_thumbnail(input_dir, input_name, frame_num=1):
    """
    提取视频第一帧（OpenCV）
    :param frame_num: 获取第几帧，默认第0帧
    """
    thumbnail_name = output_prefix + input_name + output_ext
    input_path = os.path.join(input_dir, input_name)
    output_path = os.path.join(output_dir, thumbnail_name)
    
    cap = cv2.VideoCapture(input_path)
    # 设置要读取的帧
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
    ret, frame = cap.read()
    if ret:
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)  # BGR转RGB
        Image.fromarray(frame_rgb).save(output_path)
    cap.release()

if __name__ == '__main__':
    capture_video_thumbnail('D:\\', 'z1g3d#Kiriko#Overwatch#rule34hentai.net#0.mp4')