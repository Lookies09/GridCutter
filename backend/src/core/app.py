import webview
import os
import json  
import subprocess 

from ..utils.image_utils import get_preview_image
from ..utils.grid_processor import process_rotated_crop

class RiceGridAPI:
    def __init__(self):
        self._window = None
        app_data_root = os.getenv('APPDATA')
        self.app_folder = os.path.join(app_data_root, 'MyGridCutterApp') 
        self.PRESET_FILE = os.path.join(self.app_folder, 'presets.json')
        
        if not os.path.exists(self.app_folder):
            os.makedirs(self.app_folder)
            
    def save_presets(self, presets_data):
        """React로부터 받은 프리셋 목록을 AppData에 저장"""
        try:
            with open(self.PRESET_FILE, 'w', encoding='utf-8') as f:
                json.dump(presets_data, f, ensure_ascii=False, indent=4)
            return {"status": "success", "message": "프리셋이 안전하게 저장되었습니다."}
        except Exception as e:
            return {"status": "error", "message": f"저장 실패: {str(e)}"}

    def load_presets(self):
        """AppData에 저장된 파일이 있으면 로드하여 React로 반환"""
        if os.path.exists(self.PRESET_FILE):
            try:
                with open(self.PRESET_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return []
        return []

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
            result_message = process_rotated_crop(data)
            return {"status": "success", "message": result_message}
        except Exception as e:
            return {"status": "error", "message": str(e)}