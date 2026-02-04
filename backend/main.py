import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import webview
from src.core.app import RiceGridAPI

def main():
    api = RiceGridAPI()
    
    # 개발 모드에서는 Vite 서버 주소 사용
    window = webview.create_window(
        'RiceGrid', 
        url='http://localhost:5173', 
        js_api=api
    )
    
    api.set_window(window) # API 클래스에서 window 객체 접근 가능하게 설정
    webview.start(debug=True)

if __name__ == "__main__":
    main()