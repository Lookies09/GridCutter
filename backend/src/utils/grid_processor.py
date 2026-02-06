import cv2
import numpy as np
import os
from PIL import Image
from .image_utils import normalize_for_display



def get_warped_image(img, clicks, preview_size):
    """
    [이미지 기하학적 보정 메서드]
    사용자가 프론트엔드에서 클릭한 세 점을 기준으로 기울어진 이미지를 수평/수직으로 바로 폅니다.
    
    Args:
        img: 원본 이미지 (numpy array)
        clicks: 프론트에서 전달된 클릭 좌표 리스트 (p1, p2, p3)
        preview_size: 프론트 미리보기 영역의 실제 사이즈 (비율 계산용)
    Returns:
        warped: 보정된 이미지, sx/sy: 가로세로 스케일 비율
    """
    
    oh, ow = img.shape[:2]
    pw, ph = preview_size['w'], preview_size['h']
    sx, sy = ow / pw, oh / ph
    
    p1 = [clicks[0]['x'] * sx, clicks[0]['y'] * sy]
    p2 = [clicks[1]['x'] * sx, clicks[1]['y'] * sy]
    p3 = [clicks[2]['x'] * sx, clicks[2]['y'] * sy]

    v12 = np.array([p2[0]-p1[0], p2[1]-p1[1]])
    distX = np.linalg.norm(v12)
    unitX = v12 / distX
    unitY = np.array([-unitX[1], unitX[0]])
    v13 = np.array([p3[0]-p1[0], p3[1]-p1[1]])
    distY = abs(np.dot(v13, unitY))

    src_pts = np.float32([p1, p2, np.array(p1) + unitY * distY])
    dst_pts = np.float32([[0, 0], [distX, 0], [0, distY]])
    matrix = cv2.getAffineTransform(src_pts, dst_pts)
    return cv2.warpAffine(img, matrix, (int(distX), int(distY)), flags=cv2.INTER_LANCZOS4), sx, sy

def process_rotated_crop(payload):
    """
    [메인 프로세스 제어 메서드]
    프론트에서 넘어온 설정값(그리드, 그룹 등)을 바탕으로 전체 크롭 루프를 돌며 작업을 지시합니다.
    """
    
    path = payload['path']
    save_dir = payload.get('save_path') or os.path.join(os.path.dirname(path), "output")
    os.makedirs(save_dir, exist_ok=True)
    
    custom_date = payload.get('custom_date', '00000000')
    clicks = payload['clicks']
    config = payload['config']
    pw, ph = payload['preview_size']['w'], payload['preview_size']['h']
    
    # 설정값 추출
    rows = config['rows']
    cols = config['cols']
    margin = config['margin']
    groups = config['groups']
    row_gap_val = config.get('rowGap', 0)
    col_gap_val = config.get('colGap', 0)
    group_gap_val = config.get('groupGap', 0)
    patch_size = int(config.get('patchSize', 100)) 
    group_direction = config.get('groupDirection', 'horizontal')   
    start_number = config.get('start_number', 1)

    # 이미지 로드 (Pillow)
    try:
        with Image.open(path) as pil_img:
            img = np.array(pil_img)
    except Exception as e:
        return f"이미지를 읽을 수 없습니다: {e}"

    if img is None or img.size == 0:
        return "이미지 데이터가 비어 있습니다."
        
    oh, ow = img.shape[:2]

    # 클릭 포인트 변환
    sx, sy = ow / pw, oh / ph
    p1 = [clicks[0]['x'] * sx, clicks[0]['y'] * sy]
    p2 = [clicks[1]['x'] * sx, clicks[1]['y'] * sy]
    p3 = [clicks[2]['x'] * sx, clicks[2]['y'] * sy]

    v12 = np.array([p2[0]-p1[0], p2[1]-p1[1]])
    distX = np.linalg.norm(v12)
    unitX = v12 / distX
    unitY = np.array([-unitX[1], unitX[0]])
    v13 = np.array([p3[0]-p1[0], p3[1]-p1[1]])
    distY = abs(np.dot(v13, unitY))

    src_pts = np.float32([p1, p2, np.array(p1) + unitY * distY])
    dst_pts = np.float32([[0, 0], [distX, 0], [0, distY]])
    matrix = cv2.getAffineTransform(src_pts, dst_pts)
    warped = cv2.warpAffine(img, matrix, (int(distX), int(distY)), flags=cv2.INTER_LANCZOS4)

    # 규격 계산
    row_gap = row_gap_val * sy
    col_gap = col_gap_val * sx
    margin_px = margin * sx
    group_gap = group_gap_val * sx

    if group_direction == 'horizontal':
        avail_w = distX - (margin_px * 2) - (group_gap * (groups - 1))
        group_w = avail_w / groups
        cell_w = (group_w - (col_gap * (cols - 1))) / cols
        cell_h = (distY - (margin_px * 2) - (row_gap * (rows - 1))) / rows
        group_h = cell_h * rows + row_gap * (rows - 1) # vertical 계산용 예외방지
    else: # vertical
        avail_h = distY - (margin_px * 2) - (group_gap * (groups - 1))
        group_h = avail_h / groups
        cell_w = (distX - (margin_px * 2) - (col_gap * (cols - 1))) / cols
        cell_h = (group_h - (row_gap * (rows - 1))) / rows
        group_w = cell_w * cols + col_gap * (cols - 1) # horizontal 계산용 예외방지

    count = 0
    if group_direction == 'vertical':
        for g in range(groups):
            for r in range(rows):
                for c in range(cols):
                    index = (g * (rows * cols)) + (r * cols) + c
                    actual_cluster_num = index + start_number
                    
                    g_offset = margin_px + g * (group_h + group_gap)
                    ix = int(round(margin_px + (c * (cell_w + col_gap))))
                    iy = int(round(g_offset + (r * (cell_h + row_gap))))
                    
                    count += perform_crop_and_save(warped, ix, iy, cell_w, cell_h, patch_size, actual_cluster_num, save_dir, custom_date)
    else: # horizontal
        for r in range(rows):
            for g in range(groups):
                for c in range(cols):
                    index = (r * (groups * cols)) + (g * cols) + c
                    actual_cluster_num = index + start_number
                    
                    g_offset = margin_px + g * (group_w + group_gap)
                    ix = int(round(g_offset + (c * (cell_w + col_gap))))
                    iy = int(round(margin_px + (r * (cell_h + row_gap))))
                    
                    count += perform_crop_and_save(warped, ix, iy, cell_w, cell_h, patch_size, actual_cluster_num, save_dir, custom_date)

    return f"작업 완료! {count}개의 패치 이미지가 저장되었습니다."


def perform_crop_and_save(warped, ix, iy, cell_w, cell_h, patch_size, current_cluster_num, save_dir, custom_date):
    """
    [개별 군락 처리 및 파일 저장 메서드]
    하나의 군락(Cell) 영역 내에서 지정된 크기(patch_size)로 슬라이싱하여 파일로 저장합니다.
    
    Args:
        warped: 전체 보정 이미지
        ix, iy: 해당 군락의 시작 좌표
        cell_w, cell_h: 군락의 가로세로 크기
        patch_size: 최종 저장될 패치 크기 (px)
    """
    
    inner_count = 0
    iw, ih = int(round(cell_w)), int(round(cell_h))
    cluster_img = warped[iy:iy+ih, ix:ix+iw]
    
    if cluster_img.size > 0:
        if cluster_img.dtype != np.uint8:
            c_min, c_max = float(cluster_img.min()), float(cluster_img.max())
            if c_max > c_min:
                cluster_img = ((cluster_img - c_min) / (c_max - c_min) * 255).astype(np.uint8)
        
        ch, cw = cluster_img.shape[:2]
        patch_idx = 1
        
        for py in range(0, ch - patch_size + 1, patch_size):
            for px in range(0, cw - patch_size + 1, patch_size):
                patch = cluster_img[py:py+patch_size, px:px+patch_size]
                if patch.size > 0:
                    # 날짜 처리
                    date_str = str(custom_date) if custom_date else "00000000"
                    
                    # 군락 번호 처리
                    cluster_str = str(current_cluster_num).zfill(3)
                    
                    # 패치 번호 처리
                    img_str = str(patch_idx).zfill(4)
                    
                    # 최종 파일명: 20260206_101_0001.png
                    file_name = f"{date_str}_{cluster_str}_{img_str}.png"
                    full_path = os.path.join(save_dir, file_name)
                    
                    # 이미지 저장
                    save_patch = cv2.cvtColor(patch, cv2.COLOR_RGB2BGR)
                    is_success, buffer = cv2.imencode(".png", save_patch)
                    if is_success:
                        with open(full_path, mode='wb') as f:
                            buffer.tofile(f)
                        patch_idx += 1
                        inner_count += 1
                        
    return inner_count