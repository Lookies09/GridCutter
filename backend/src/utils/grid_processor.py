import os

import cv2
import numpy as np
from PIL import Image

VALID_CROP_MODES = {"visible_grid", "fixed_pixel_split"}
MIN_AXIS_LENGTH = 4.0


def parse_positive_int(value, label):
    try:
        parsed = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{label} 값이 올바르지 않습니다.") from error

    if parsed <= 0:
        raise ValueError(f"{label} 값이 올바르지 않습니다.")

    return parsed


def parse_non_negative_number(value, label):
    try:
        parsed = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{label} 값이 올바르지 않습니다.") from error

    if parsed < 0:
        raise ValueError(f"{label} 값이 올바르지 않습니다.")

    return parsed


def normalize_for_save(image):
    if image.size == 0:
        raise ValueError("저장할 이미지 데이터가 비어 있습니다.")

    if image.dtype != np.uint8:
        image = image.astype(np.float32)
        image_min = float(image.min())
        image_max = float(image.max())

        if image_max > image_min:
            image = ((image - image_min) / (image_max - image_min) * 255.0).clip(
                0, 255
            ).astype(np.uint8)
        else:
            image = np.zeros_like(image, dtype=np.uint8)

    return image


def convert_for_png(image):
    if image.ndim == 2:
        return image

    if image.ndim != 3:
        raise ValueError("저장할 수 없는 이미지 형식입니다.")

    channel_count = image.shape[2]

    if channel_count == 3:
        return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    if channel_count == 4:
        # alpha 때문에 완전 투명 PNG가 되는 문제 방지
        return cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

    raise ValueError("지원하지 않는 이미지 채널 수입니다.")


def save_png(image, file_path):
    prepared = convert_for_png(normalize_for_save(image))
    is_success, buffer = cv2.imencode(".png", prepared)

    if not is_success:
        raise ValueError("이미지 저장용 PNG 인코딩에 실패했습니다.")

    with open(file_path, mode="wb") as file_handle:
        buffer.tofile(file_handle)


def resolve_frame_points(p1, p2, p3):
    primary_vector = np.array([p2[0] - p1[0], p2[1] - p1[1]], dtype=np.float64)
    dist_x = float(np.linalg.norm(primary_vector))

    if not np.isfinite(dist_x) or dist_x < MIN_AXIS_LENGTH:
        raise ValueError(
            "첫 번째 점과 두 번째 점이 너무 가까워 유효한 1차 축을 만들 수 없습니다."
        )

    unit_x = primary_vector / dist_x
    base_perp = np.array([-unit_x[1], unit_x[0]], dtype=np.float64)
    third_vector = np.array([p3[0] - p2[0], p3[1] - p2[1]], dtype=np.float64)
    signed_secondary = float(np.dot(third_vector, base_perp))
    dist_y = abs(signed_secondary)

    if not np.isfinite(dist_y) or dist_y < MIN_AXIS_LENGTH:
        raise ValueError("세 점이 거의 일직선이라 유효한 2차 축을 만들 수 없습니다.")

    unit_y = base_perp if signed_secondary >= 0 else -base_perp

    return {
        "origin": np.array(p1, dtype=np.float64),
        "unit_x": unit_x,
        "unit_y": unit_y,
        "dist_x": dist_x,
        "dist_y": dist_y,
    }


def validate_clicks(clicks):
    if not isinstance(clicks, list) or len(clicks) != 3:
        raise ValueError("그리드를 해석하려면 3개의 기준점이 필요합니다.")

    normalized = []

    for index, point in enumerate(clicks, start=1):
        if not isinstance(point, dict):
            raise ValueError(f"{index}번째 점 정보가 올바르지 않습니다.")

        try:
            point_x = float(point["x"])
            point_y = float(point["y"])
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError(f"{index}번째 점 좌표가 올바르지 않습니다.") from error

        if not np.isfinite(point_x) or not np.isfinite(point_y):
            raise ValueError(f"{index}번째 점 좌표가 올바르지 않습니다.")

        normalized.append({"x": point_x, "y": point_y})

    return normalized


def validate_preview_size(preview_size):
    if not isinstance(preview_size, dict):
        raise ValueError("미리보기 크기 정보가 올바르지 않습니다.")

    try:
        width = float(preview_size["w"])
        height = float(preview_size["h"])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError("미리보기 크기 정보가 올바르지 않습니다.") from error

    if width <= 0 or height <= 0:
        raise ValueError("미리보기 크기 정보가 올바르지 않습니다.")

    return width, height


def build_image_frame(clicks, preview_size, image_shape):
    preview_w, preview_h = validate_preview_size(preview_size)
    normalized_clicks = validate_clicks(clicks)

    image_h, image_w = image_shape[:2]
    scale_x = image_w / preview_w
    scale_y = image_h / preview_h

    p1 = [normalized_clicks[0]["x"] * scale_x, normalized_clicks[0]["y"] * scale_y]
    p2 = [normalized_clicks[1]["x"] * scale_x, normalized_clicks[1]["y"] * scale_y]
    p3 = [normalized_clicks[2]["x"] * scale_x, normalized_clicks[2]["y"] * scale_y]

    frame = resolve_frame_points(p1, p2, p3)
    frame["scale_x"] = scale_x
    frame["scale_y"] = scale_y
    return frame


def build_affine_matrix(source_points, destination_points):
    equation_rows = []
    result_values = []

    for (src_x, src_y), (dst_x, dst_y) in zip(source_points, destination_points):
        equation_rows.append([src_x, src_y, 1.0, 0.0, 0.0, 0.0])
        equation_rows.append([0.0, 0.0, 0.0, src_x, src_y, 1.0])
        result_values.extend([dst_x, dst_y])

    coefficients = np.array(equation_rows, dtype=np.float64)
    targets = np.array(result_values, dtype=np.float64)
    solved = np.linalg.solve(coefficients, targets)

    return np.array(
        [
            [solved[0], solved[1], solved[2]],
            [solved[3], solved[4], solved[5]],
        ],
        dtype=np.float32,
    )


def get_warped_image(img, clicks, preview_size):
    frame = build_image_frame(clicks, preview_size, img.shape)
    source_points = [
        (float(frame["origin"][0]), float(frame["origin"][1])),
        (
            float(frame["origin"][0] + (frame["unit_x"][0] * frame["dist_x"])),
            float(frame["origin"][1] + (frame["unit_x"][1] * frame["dist_x"])),
        ),
        (
            float(frame["origin"][0] + (frame["unit_y"][0] * frame["dist_y"])),
            float(frame["origin"][1] + (frame["unit_y"][1] * frame["dist_y"])),
        ),
    ]
    destination_points = [
        (0.0, 0.0),
        (float(frame["dist_x"]), 0.0),
        (0.0, float(frame["dist_y"])),
    ]
    matrix = build_affine_matrix(source_points, destination_points)
    warped = cv2.warpAffine(
        img,
        matrix,
        (int(round(frame["dist_x"])), int(round(frame["dist_y"]))),
        flags=cv2.INTER_LANCZOS4,
    )

    # 원본 이미지와 방향이 다르면 90도 회전으로 보정
    orig_h, orig_w = img.shape[:2]
    warped_h, warped_w = warped.shape[:2]
    orig_is_landscape = orig_w >= orig_h
    warped_is_landscape = warped_w >= warped_h

    if orig_is_landscape != warped_is_landscape:
        warped = cv2.rotate(warped, cv2.ROTATE_90_CLOCKWISE)
        # frame도 함께 swap해야 cell 좌표 계산이 맞음
        frame["dist_x"], frame["dist_y"] = frame["dist_y"], frame["dist_x"]
        frame["scale_x"], frame["scale_y"] = frame["scale_y"], frame["scale_x"]

    return warped, frame


def resolve_crop_mode(config):
    crop_mode = config.get("crop_mode") or config.get("cropMode") or "visible_grid"

    if crop_mode not in VALID_CROP_MODES:
        raise ValueError("지원하지 않는 crop mode 입니다.")

    return crop_mode


def resolve_grid_layout(config, frame):
    rows = parse_positive_int(config.get("rows"), "행")
    cols = parse_positive_int(config.get("cols"), "열")
    groups = parse_positive_int(config.get("groups", 1), "그룹 수")

    margin = parse_non_negative_number(config.get("margin", 0), "여백")
    row_gap = parse_non_negative_number(config.get("rowGap", 0), "세로 간격")
    col_gap = parse_non_negative_number(config.get("colGap", 0), "가로 간격")
    group_gap = parse_non_negative_number(config.get("groupGap", 0), "그룹 간격")

    margin_x = margin * frame["scale_x"]
    margin_y = margin * frame["scale_y"]
    row_gap_px = row_gap * frame["scale_y"]
    col_gap_px = col_gap * frame["scale_x"]

    group_direction = config.get("groupDirection", "horizontal")

    if group_direction not in {"horizontal", "vertical"}:
        raise ValueError("지원하지 않는 그룹 배치 방향입니다.")

    # group_gap은 배치 방향에 따라 스케일 기준이 다름
    if group_direction == "horizontal":
        group_gap_px = group_gap * frame["scale_x"]
    else:
        group_gap_px = group_gap * frame["scale_y"]

    if group_direction == "horizontal":
        available_width = frame["dist_x"] - (margin_x * 2) - (group_gap_px * (groups - 1))

        if available_width <= 0:
            raise ValueError("그룹 수나 간격이 너무 커서 가로 방향 그리드를 만들 수 없습니다.")

        group_width = available_width / groups
        cell_width = (group_width - (col_gap_px * (cols - 1))) / cols
        cell_height = (frame["dist_y"] - (margin_y * 2) - (row_gap_px * (rows - 1))) / rows
        group_height = (cell_height * rows) + (row_gap_px * (rows - 1))
    else:
        available_height = frame["dist_y"] - (margin_y * 2) - (group_gap_px * (groups - 1))

        if available_height <= 0:
            raise ValueError("그룹 수나 간격이 너무 커서 세로 방향 그리드를 만들 수 없습니다.")

        group_height = available_height / groups
        cell_width = (frame["dist_x"] - (margin_x * 2) - (col_gap_px * (cols - 1))) / cols
        cell_height = (group_height - (row_gap_px * (rows - 1))) / rows
        group_width = (cell_width * cols) + (col_gap_px * (cols - 1))

    if cell_width <= 0 or cell_height <= 0:
        raise ValueError("축 길이, 여백, 또는 간격 설정 때문에 유효한 그리드를 만들 수 없습니다.")

    start_number = parse_positive_int(
        config.get("start_number", config.get("startNumber", 1)), "시작 번호"
    )

    crop_mode = resolve_crop_mode(config)

    patch_size = parse_positive_int(config.get("patchSize", 100), "추출 크기")

    return {
        "rows": rows,
        "cols": cols,
        "groups": groups,
        "margin_x": margin_x,
        "margin_y": margin_y,
        "row_gap": row_gap_px,
        "col_gap": col_gap_px,
        "group_gap": group_gap_px,
        "group_direction": group_direction,
        "group_width": group_width,
        "group_height": group_height,
        "cell_width": cell_width,
        "cell_height": cell_height,
        "start_number": start_number,
        "patch_size": patch_size,
        "crop_mode": crop_mode,
    }

def iter_grid_cells(layout):
    if layout["group_direction"] == "vertical":
        for group_index in range(layout["groups"]):
            group_offset = layout["margin_y"] + (
                group_index * (layout["group_height"] + layout["group_gap"])
            )

            for row_index in range(layout["rows"]):
                for col_index in range(layout["cols"]):
                    index = (
                        (group_index * (layout["rows"] * layout["cols"]))
                        + (row_index * layout["cols"])
                        + col_index
                    )

                    yield {
                        "cluster_number": layout["start_number"] + index,
                        "x": int(
                            round(
                                layout["margin_x"]
                                + (col_index * (layout["cell_width"] + layout["col_gap"]))
                            )
                        ),
                        "y": int(
                            round(
                                group_offset
                                + (row_index * (layout["cell_height"] + layout["row_gap"]))
                            )
                        ),
                        "cell_width": layout["cell_width"],
                        "cell_height": layout["cell_height"],
                    }
    else:
        for row_index in range(layout["rows"]):
            for group_index in range(layout["groups"]):
                group_offset = layout["margin_x"] + (
                    group_index * (layout["group_width"] + layout["group_gap"])
                )

                for col_index in range(layout["cols"]):
                    index = (
                        (row_index * (layout["groups"] * layout["cols"]))
                        + (group_index * layout["cols"])
                        + col_index
                    )

                    yield {
                        "cluster_number": layout["start_number"] + index,
                        "x": int(
                            round(
                                group_offset
                                + (col_index * (layout["cell_width"] + layout["col_gap"]))
                            )
                        ),
                        "y": int(
                            round(
                                layout["margin_y"]
                                + (row_index * (layout["cell_height"] + layout["row_gap"]))
                            )
                        ),
                        "cell_width": layout["cell_width"],
                        "cell_height": layout["cell_height"],
                    }


def extract_cluster_image(warped, cell):
    warped_height, warped_width = warped.shape[:2]

    image_width = int(round(cell["cell_width"]))
    image_height = int(round(cell["cell_height"]))
    start_x = int(round(cell["x"]))
    start_y = int(round(cell["y"]))

    end_x = min(start_x + image_width, warped_width)
    end_y = min(start_y + image_height, warped_height)

    if start_x < 0 or start_y < 0 or start_x >= warped_width or start_y >= warped_height:
        return None

    if end_x <= start_x or end_y <= start_y:
        return None

    cluster_image = warped[start_y:end_y, start_x:end_x]

    if cluster_image.size == 0:
        return None

    return cluster_image


def crop_by_visible_grid(warped, cell, save_dir, custom_date):
    cluster_image = extract_cluster_image(warped, cell)

    if cluster_image is None:
        return 0

    cluster_str = str(cell["cluster_number"]).zfill(3)
    date_str = str(custom_date) if custom_date else "00000000"
    file_name = f"{date_str}_{cluster_str}.png"
    save_png(cluster_image, os.path.join(save_dir, file_name))

    return 1


def crop_by_fixed_pixel_split(warped, cell, save_dir, custom_date, patch_size):
    cluster_image = extract_cluster_image(warped, cell)

    if cluster_image is None:
        print(
            f"cluster={cell['cluster_number']} "
            f"cell_calc=({cell['cell_width']:.2f}, {cell['cell_height']:.2f}) "
            f"cell_crop=(None, None) "
            f"patch={patch_size} "
            f"start=({cell['x']}, {cell['y']}) "
            f"reason=extract_failed"
        )
        return 0

    cluster_str = str(cell["cluster_number"]).zfill(3)
    date_str = str(custom_date) if custom_date else "00000000"
    count = 0
    patch_index = 1
    cluster_height, cluster_width = cluster_image.shape[:2]

    print(
        f"cluster={cell['cluster_number']} "
        f"cell_calc=({cell['cell_width']:.2f}, {cell['cell_height']:.2f}) "
        f"cell_crop=({cluster_width}, {cluster_height}) "
        f"patch={patch_size} "
        f"start=({cell['x']}, {cell['y']})"
    )

    if patch_size > cluster_width or patch_size > cluster_height:
        print(
            f"cluster={cell['cluster_number']} "
            f"reason=patch_too_large "
            f"patch={patch_size} "
            f"cell_crop=({cluster_width}, {cluster_height})"
        )
        return 0

    for patch_y in range(0, cluster_height - patch_size + 1, patch_size):
        for patch_x in range(0, cluster_width - patch_size + 1, patch_size):
            patch = cluster_image[
                patch_y : patch_y + patch_size, patch_x : patch_x + patch_size
            ]

            if patch.size == 0:
                continue

            patch_str = str(patch_index).zfill(4)
            file_name = f"{date_str}_{cluster_str}_{patch_str}.png"
            save_png(patch, os.path.join(save_dir, file_name))
            patch_index += 1
            count += 1

    print(
        f"cluster={cell['cluster_number']} "
        f"saved_patches={count}"
    )

    return count


def perform_crop_and_save(warped, cell, layout, save_dir, custom_date):
    if layout["crop_mode"] == "visible_grid":
        return crop_by_visible_grid(warped, cell, save_dir, custom_date)

    if layout["crop_mode"] == "fixed_pixel_split":
        return crop_by_fixed_pixel_split(
            warped, cell, save_dir, custom_date, layout["patch_size"]
        )

    raise ValueError("지원하지 않는 crop mode 입니다.")


def process_rotated_crop(payload):
    if not isinstance(payload, dict):
        raise ValueError("crop 요청 데이터가 올바르지 않습니다.")

    path = payload.get("path")
    if not path:
        raise ValueError("이미지 경로가 필요합니다.")

    config = payload.get("config")
    if not isinstance(config, dict):
        raise ValueError("grid 설정 정보가 올바르지 않습니다.")

    save_dir = payload.get("save_path") or os.path.join(os.path.dirname(path), "output")
    os.makedirs(save_dir, exist_ok=True)

    try:
        with Image.open(path) as pil_image:
            image = np.array(pil_image)
    except Exception as error:
        raise ValueError(f"이미지를 읽을 수 없습니다: {error}") from error

    if image is None or image.size == 0:
        raise ValueError("이미지 데이터가 비어 있습니다.")

    warped, frame = get_warped_image(
        image, payload.get("clicks"), payload.get("preview_size")
    )
    layout = resolve_grid_layout(config, frame)
    custom_date = payload.get("custom_date", "00000000")
    count = 0

    for cell in iter_grid_cells(layout):
        count += perform_crop_and_save(warped, cell, layout, save_dir, custom_date)

    return f"작업 완료! {count}개의 패치 이미지가 저장되었습니다."