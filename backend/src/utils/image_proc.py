import cv2
import numpy as np
import base64
import os

def imread_korean(path, flags=cv2.IMREAD_UNCHANGED):
    try:
        n = np.fromfile(path, np.uint8)
        return cv2.imdecode(n, flags)
    except Exception:
        return None

def get_preview_image(file_path, max_size=2048):
    # 1. 이미지 읽기
    img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return None

    orig_h, orig_w = img.shape[:2]

    # 2. 가시성 정규화 (16-bit 등 대응)
    if img.dtype != np.uint8:
        img_display = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)
        img_display = img_display.astype(np.uint8)
    else:
        img_display = img.copy()

    # 3. 채널 맞추기 (RGB)
    if len(img_display.shape) > 2 and img_display.shape[2] > 3:
        img_display = img_display[:, :, :3]

    # 4. 리사이징 및 비율 계산
    ratio = min(max_size / orig_w, max_size / orig_h)
    if ratio < 1.0:
        new_w, new_h = int(orig_w * ratio), int(orig_h * ratio)
        img_display = cv2.resize(img_display, (new_w, new_h), interpolation=cv2.INTER_AREA)
    else:
        new_w, new_h = orig_w, orig_h

    # 5. PNG 인코딩 (여기서 base64_str을 확실히 정의합니다)
    _, buffer = cv2.imencode('.png', img_display)
    # 인코딩 결과를 base64 문자열로 변환
    base64_str = base64.b64encode(buffer).decode('utf-8')

    # 6. 결과 반환
    return {
        "base64": f"data:image/png;base64,{base64_str}",
        "orig_w": orig_w,
        "orig_h": orig_h,
        "preview_w": new_w,
        "preview_h": new_h
    }

def process_rotated_crop(payload):
    path = payload['path']
    save_dir = payload.get('save_path') or os.path.join(os.path.dirname(path), "output")
    os.makedirs(save_dir, exist_ok=True)
    
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
    patch_size_val = config.get('patchSize', 100) # UI에서 새로 추가한 값

    # 1. 이미지 로드
    img = imread_korean(path)
    if img is None: return "이미지를 읽을 수 없습니다."
    oh, ow = img.shape[:2]

    # 2. 스케일 계산 및 아핀 변환
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

    # 3. 픽셀 단위 스케일 조정
    row_gap = row_gap_val * sy
    col_gap = col_gap_val * sx
    margin_px = margin * sx
    group_gap = group_gap_val * sx
    patch_size = int(patch_size_val)

    avail_w = distX - (margin_px * 2) - (group_gap * (groups - 1))
    group_w = avail_w / groups
    cell_w = (group_w - (col_gap * (cols - 1))) / cols
    cell_h = (distY - (margin_px * 2) - (row_gap * (rows - 1))) / rows

    count = 0
    # 군락(Grid) 단위 루프
    for g in range(groups):
        g_offset = margin_px + g * (group_w + group_gap)
        for r in range(rows):
            for c in range(cols):
                # 군락 번호 (1부터 시작)
                current_cluster_num = (g * rows * cols) + (r * cols) + (c + 1)
                
                # 군락 좌표 계산
                x = g_offset + (c * (cell_w + col_gap))
                y = margin_px + (r * (cell_h + row_gap))
                
                ix, iy = int(round(x)), int(round(y))
                iw, ih = int(round(cell_w)), int(round(cell_h))
                
                cluster_img = warped[iy:iy+ih, ix:ix+iw]
                
                if cluster_img.size > 0:
                    ch, cw = cluster_img.shape[:2]
                    patch_idx = 1
                    
                    # 4. 군락 내부를 패치 단위로 쪼개기
                    for py in range(0, ch - patch_size + 1, patch_size):
                        for px in range(0, cw - patch_size + 1, patch_size):
                            patch = cluster_img[py:py+patch_size, px:px+patch_size]
                            
                            if patch.size > 0:
                                file_name = f"{current_cluster_num}번군락_{patch_idx}번이미지.tif"
                                full_path = os.path.join(save_dir, file_name)
                                
                                is_success, buffer = cv2.imencode(".tif", patch)
                                if is_success:
                                    with open(full_path, mode='wb') as f:
                                        buffer.tofile(f)
                                
                                patch_idx += 1
                                count += 1

    return f"작업 완료! {count}개의 객체 이미지가 '{save_dir}'에 저장되었습니다."