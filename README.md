# 🌾 RiceGrid (GridCutter)

> **[🚀 최신 버전 다운로드 (v1.0.0)](https://github.com/Lookies09/GridCutter/releases/tag/v1.0.0)**

**React와 Python(pywebview)을 결합한 지능형 이미지 그리드 커팅 및 관리 도구입니다.** 고해상도 이미지(TIF 등)를 격자 형태로 정밀하게 자르고, 관리하기 쉬운 인터페이스를 제공하며, AI 모델 학습용 이미지 데이터를 전처리하는 용도로 최적화되어 있습니다.

<p align="center">
  <img width="48%" alt="image" src="https://github.com/user-attachments/assets/7268581e-70ce-49f9-b799-7f8c704aca58" />
  <img width="48%" alt="image" src="https://github.com/user-attachments/assets/9bf3427e-0879-47a0-8fe7-eb984061471a" />
</p>
---

## ✨ 주요 기능 (Key Features)

* **지능형 그리드 분할**: 대용량 이미지를 설정한 격자 값에 맞춰 자동으로 분할 및 저장합니다.
* **사용자 정의 프리셋**: 자주 사용하는 커팅 설정을 저장하고 불러와 작업 효율을 높입니다.
* **실시간 미리보기**: 프론트엔드(React)를 통해 커팅될 영역을 시각적으로 즉시 확인합니다.
* **로컬 데이터 관리**: 모든 프리셋 데이터는 사용자의 `AppData`에 안전하게 보관됩니다.
* **직관적인 UI**: 모던하고 깔끔한 대시보드 인터페이스를 제공합니다.

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
* **React (Vite)**: 빠르고 반응성 있는 UI 구성
* **Styled Components**: 모던한 컴포넌트 기반 스타일링
* **Lucide React**: 깔끔한 아이콘 시스템

### Backend
* **Python 3.9+**: 핵심 로직 및 이미지 처리
* **pywebview**: Python과 웹 기술 간의 브릿지 역할
* **Pillow / Tifffile**: 고성능 이미지 프로세싱

---

## 🚀 시작하기 (Getting Started)

### 개발 환경 설정

1.  **레포지토리 클론**
    ```bash
    git clone [https://github.com/YourUsername/GridCutter.git](https://github.com/YourUsername/GridCutter.git)
    cd GridCutter
    ```

2.  **프론트엔드 의존성 설치 및 빌드**
    ```bash
    cd frontend
    npm install
    npm run build
    ```

3.  **백엔드 환경 구성**
    ```bash
    cd ../backend
    pip install -r requirements.txt
    ```

4.  **앱 실행 ** 프론트엔드 개발 서버를 먼저 실행한 후 파이썬 메인 스크립트를 실행하세요.
    ```bash
    # 터미널 1 (frontend 폴더)
    npm run dev

    # 터미널 2 (backend 폴더)
    python main.py
    ```

---

📦 빌드 및 배포 (Build)
PyInstaller를 사용하여 단일 실행 파일(.exe)로 빌드할 수 있습니다.

주의: 빌드 전 frontend 폴더에서 npm run build를 먼저 수행하여 dist 폴더를 생성해야 합니다.

# 프로젝트 루트(GridCutter/) 폴더에서 실행
pyinstaller --clean --noconfirm --onefile --windowed `
--icon="backend/app_icon.ico" `
--add-data "frontend/dist;frontend/dist" `
--add-data "backend/src;src" `
--collect-all pywebview `
--paths "backend" `
--name "RiceGridApp" `
backend/main.py

# 📂 프로젝트 구조 (Project Structure)

```
GridCutter/
├── frontend/                 # React (Vite) 프론트엔드 소스
│   ├── src/
│   │   ├── components/       # 재사용 가능한 UI 컴포넌트
│   │   ├── utils/            # 프론트엔드 공통 유틸리티
│   │   ├── App.jsx           # 메인 애플리케이션 컴포넌트
│   │   └── main.jsx          # 리액트 진입점
│   ├── dist/                 # 빌드된 정적 파일 (PyInstaller 참조용)
│   └── vite.config.js
│
├── backend/                  # Python 백엔드 및 로직
│   ├── src/
│   │   ├── core/             # 핵심 비즈니스 로직 (API 등)
│   │   └── utils/            # 이미지 처리, 파일 IO 등 공통 함수
│   ├── main.py               # 프로그램 실행 진입점
│   └── requirements.txt      # 파이썬 의존성 목록
│
├── dist/                     # 🚀 최종 빌드된 프로그램 (.exe) 위치
├── RiceGridApp.spec          # PyInstaller 설정 파일
└── README.md                 # 프로젝트 문서
```

## 🛠 Troubleshooting & FAQ

프로그램 개발 및 빌드 과정에서 발생한 주요 이슈와 해결 방법을 정리합니다.

### 1. 런타임 에러 (Runtime Error)
**에러 메시지:** `RuntimeError: Failed to resolve Python.Runtime.Loader.Initialize...`
* **원인**: `pywebview`가 Windows의 `.NET` 라이브러리(`pythonnet`)를 로드하여 전용 창을 띄우려 할 때, 필요한 DLL 파일을 찾지 못하거나 경로가 꼬여서 발생합니다.
* **해결 방법**:
    1.  **빌드 옵션 고정**: PyInstaller 빌드 시 `--collect-all pywebview`와 `--paths` 설정을 명확히 하여 라이브러리가 포함되도록 합니다.
    2.  **환경 확인**: 실행 환경에 [Microsoft WebView2 Runtime](https://developer.microsoft.com/ko-kr/microsoft-edge/webview2/)이 설치되어 있어야 합니다.
    3.  **최후의 수단**: `.NET` 라이브러리 충돌이 해결되지 않을 경우, `webview.start(gui='browser')`를 사용하여 외부 브라우저 모드로 실행할 수 있습니다. (단, 이 경우 API 통신 방식을 Flask 등으로 전환해야 함)

### 2. 프론트엔드 API 연결 문제 (Undefined API)
**에러 메시지:** `TypeError: Cannot read properties of undefined (reading 'api')`
* **원인**: 브라우저 환경에서 `window.pywebview.api` 객체가 생성되기 전에 호출되거나, 외부 브라우저(`gui='browser'`) 사용으로 주입이 차단된 경우입니다.
* **해결 방법**:
    1.  `App.jsx` 내부에 `pywebviewready` 이벤트 리스너를 추가하여 API 로드 완료 후 기능을 실행하도록 구현합니다.
    2.  빌드 시 `gui='browser'` 옵션을 제거하고 기본 윈도우 모드로 실행하여 API 주입을 활성화합니다.

### 3. 아이콘 및 캐시 이슈
**현상:** 빌드 후에도 이전 아이콘이 보이거나 변경 사항이 반영되지 않음
* **원인**: Windows 탐색기의 아이콘 캐싱 또는 PyInstaller의 `build` 폴더 찌꺼기가 남은 경우입니다.
* **해결 방법**:
    1.  **빌드 전 청소**: `Remove-Item -Recurse -Force build, dist, *.spec` 명령어로 기존 빌드 데이터를 완전히 삭제합니다.
    2.  **캐시 강제 갱신**: 빌드된 `.exe` 파일의 이름을 변경하면 Windows가 아이콘을 새로 로드합니다.

### 4. 빌드 후 실행 무반응
* **원인**: `main.py` 파일 하단에 `if __name__ == "__main__":` 실행 블록이 누락되어 함수가 호출되지 않는 경우입니다.
* **해결 방법**: 반드시 스크립트 최하단에 `main()` 호출 코드를 포함해야 합니다.

---
