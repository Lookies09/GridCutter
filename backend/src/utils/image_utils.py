import cv2
import numpy as np
import base64
import os
from PIL import Image

def imread_korean(path, flags=cv2.IMREAD_UNCHANGED):
    try:
        n = np.fromfile(path, np.uint8)
        return cv2.imdecode(n, flags)
    except Exception:
        return None

def normalize_for_display(img_np):
    """데이터 타입을 uint8로 정규화하고 채널을 RGB로 통일"""
    if img_np.dtype != np.uint8:
        img_min, img_max = img_np.min(), img_np.max()
        img_display = ((img_np - img_min) / (img_max - img_min) * 255).astype(np.uint8) if img_max > img_min else img_np.astype(np.uint8)
    else:
        img_display = img_np.copy()

    if len(img_display.shape) == 2:
        return cv2.cvtColor(img_display, cv2.COLOR_GRAY2RGB)
    elif img_display.shape[2] == 4:
        return cv2.cvtColor(img_display, cv2.COLOR_RGBA2RGB)
    return img_display


# 그리드 생성시 미리보기 이미지 생성하는 로직
# tif 이미지를 jpg로 변환하여 최적화
def get_preview_image(file_path, max_size=2048):
    try:
        with Image.open(file_path) as pil_img:
            orig_w, orig_h = pil_img.size
            img_np = np.array(pil_img)
        
        img_display = normalize_for_display(img_np)
        
        ratio = min(max_size / orig_w, max_size / orig_h)
        new_w, new_h = (int(orig_w * ratio), int(orig_h * ratio)) if ratio < 1.0 else (orig_w, orig_h)
        if ratio < 1.0:
            img_display = cv2.resize(img_display, (new_w, new_h), interpolation=cv2.INTER_AREA)

        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(img_display, cv2.COLOR_RGB2BGR), [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        base64_str = base64.b64encode(buffer).decode('utf-8')

        return {
            "base64": f"data:image/jpeg;base64,{base64_str}",
            "orig_w": orig_w, "orig_h": orig_h,
            "preview_w": new_w, "preview_h": new_h
        }
    except Exception as e:
        print(f"Error: {e}")
        return None