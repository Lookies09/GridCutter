# 🌾 RiceGrid (GridCutter)

> **React와 Python(pywebview)을 결합한 지능형 이미지 그리드 커팅 및 관리 도구입니다.** > 고해상도 이미지(TIF 등)를 격자 형태로 정밀하게 자르고, 관리하기 쉬운 인터페이스를 제공합니다.
> 모델에 사용되는 이미지를 전처리하는 용도로 만들어졌습니다.

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
pyinstaller --noconfirm --onedir --windowed `
--icon="backend/app_icon.ico" `
--add-data "frontend/dist;frontend/dist" `
--add-data "backend/src;src" `
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
