import webview
import os
from ..utils.image_proc import get_preview_image, process_rotated_crop

class RiceGridAPI:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def select_save_folder(self):
        """저장할 폴더 선택"""
        result = self._window.create_file_dialog(webview.FOLDER_DIALOG)
        if result:
            return result[0]
        return None

    def open_file_dialog(self):
        """파일 선택 및 미리보기 데이터 반환"""
        result = self._window.create_file_dialog(
            webview.OPEN_DIALOG,
            file_types=('TIFF Files (*.tif;*.tiff)', 'All files (*.*)')
        )
        
        if not result: return None
        
        path = result[0]
        img_data = get_preview_image(path)
        
        if img_data:
            img_data["path"] = path # 원본 경로 포함
            return img_data
        return None

    def process_crop(self, data):
        try:
            # image_proc.py의 함수에 data를 그대로 넘깁니다.
            result_message = process_rotated_crop(data)
            return {"status": "success", "message": result_message}
        except Exception as e:
            return {"status": "error", "message": str(e)}