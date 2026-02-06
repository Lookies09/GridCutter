import sys
import os
import webview
from src.core.app import RiceGridAPI

if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
    sys.path.insert(0, os.path.join(base_path, 'backend'))
else:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)

try:
    from src.core.app import RiceGridAPI
except ImportError as e:
    print(f"Import Error: {e}")
    print(f"Current sys.path: {sys.path}")
    sys.exit(1)

def get_entrypoint():
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, 'frontend', 'dist', 'index.html')
    
    # 개발 모드 (Vite 서버)
    return 'http://localhost:5173'

def main():
    api = RiceGridAPI()
    entry = get_entrypoint()

    window = webview.create_window(
        'RiceGrid', 
        url=entry, 
        js_api=api,
        width=1400, 
        height=900
    )
    
    api.set_window(window)
    
    webview.start(debug=False)

if __name__ == "__main__":
    main()