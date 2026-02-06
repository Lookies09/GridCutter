import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Loader2, Calendar, AlertCircle } from 'lucide-react';
import GridCanvas from './components/GridCanvas';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { Save, FolderOpen, AlertTriangle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
// --- Animations ---
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// --- Styled Components ---
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #121212;
  color: #e4e4e7;
  overflow: hidden;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease-out;
`;

const SpinnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  svg {
    animation: ${spin} 1s linear infinite;
    color: #6366f1;
  }

  p {
    font-size: 14px;
    font-weight: 500;
    color: #a1a1aa;
    letter-spacing: 0.05em;
  }
`;

const ModalBox = styled.div`
  background: #1f1f23;
  padding: 32px;
  border-radius: 16px;
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border: 1px solid #3f3f46;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  h3 { margin: 0; font-size: 18px; color: #fff; }
  svg { color: #818cf8; }
`;

const InputField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label { font-size: 12px; color: #71717a; font-weight: 600; text-transform: uppercase; }
  input {
    background: #27272a;
    border: 1px solid #3f3f46;
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    &:focus { border-color: #6366f1; }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  background: ${props => props.primary ? '#6366f1' : '#3f3f46'};
  color: white;

  &:hover {
    background: ${props => props.primary ? '#4f46e5' : '#52525b'};
    transform: translateY(-1px);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #52525b;
  gap: 16px;
  p { font-size: 14px; }
`;

// --- Main App Component ---

function App() {
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('grid_presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [presetName, setPresetName] = useState("");
  const [imageData, setImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [clicks, setClicks] = useState([]);
  const [config, setConfig] = useState({
    rows: 6, cols: 4, margin: 0, rowGap: 10, colGap: 10, groupGap: 10,
    groups: 1, groupDirection: 'horizontal', gridColor: '#FF00FF', patchSize: 100
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20; // 최대 2초 동안 대기

    const initPresets = async () => {
      if (!window.pywebview || !window.pywebview.api) {
        window.addEventListener('pywebviewready', () => initPresets(), { once: true });
        return;
      }

      const api = window.pywebview.api;

      if (typeof api.load_presets === 'function') {
        try {
          const saved = await api.load_presets();
          if (saved && Array.isArray(saved)) {
            setPresets(saved);
            console.log("프리셋 파일 로드 완료");
          }
        } catch (error) {
          console.error("프리셋 로드 중 오류:", error);
        }
      } else {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initPresets, 100);
        } else {
          console.error("API 로드 제한시간 초과");
        }
      }
    };

    initPresets();
  }, []);
  
  const handleOpenFile = async () => {
    setIsLoading(true);
    try {
      const response = await window.pywebview.api.open_file_dialog();
      if (response) {
        setImageData(response);
        setClicks([]);
      }
    } catch (error) {
      console.error("파일 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmModal = () => {
    if (clicks.length !== 3) return;
    const fileName = imageData.path.split(/[\\/]/).pop();
    const dateMatch = fileName.match(/\d{8}/) || fileName.match(/\d+/);
    setTargetDate(dateMatch ? dateMatch[0] : "");
    setShowConfirm(true);
  };

  const handleFinalCrop = async () => {
  if (isLoading) return;

  const savePath = await window.pywebview.api.select_save_folder();
  if (!savePath) return;

  setShowConfirm(false);
  setIsLoading(true);

  const loadingToast = toast.loading('그리드를 분석하여 추출하고 있습니다...');

  try {
    const payload = {
      path: imageData.path,
      save_path: savePath,
      preview_size: { w: imageData.preview_w, h: imageData.preview_h },
      clicks: clicks,
      config: { ...config, start_number: config.startNumber || 1 },
      custom_date: targetDate
    };
    
    const response = await window.pywebview.api.process_crop(payload);
    
    toast.dismiss(loadingToast);

    const successMsg = typeof response === 'object' ? response.message : response;

    toast.success(successMsg || '그리드 추출이 완료되었습니다!', {
      duration: 5000,
      style: {
        background: '#1f1f23',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: '10px',
        padding: '16px',
      },
      iconTheme: {
        primary: '#6366f1',
        secondary: '#fff',
      },
    });

  } catch (error) {
    toast.dismiss(loadingToast);
    
    const errorMsg = error?.message || String(error);

    toast.error(`작업 중 오류 발생: ${errorMsg}`, {
      duration: 6000,
      style: {
        background: '#1f1f23',
        color: '#ff4d4d',
        border: '1px solid #333',
        borderRadius: '10px',
      },
    });
  } finally {
    setIsLoading(false);
  }
};

  const saveCurrentAsPreset = async () => {
  // 이름 입력 체크
  if (!presetName.trim()) { 
    toast('프리셋 이름을 입력해주세요.', { 
      icon: <AlertTriangle size={18} color="#fbbf24" />,
    }); 
    return; 
  }

  // 클릭 데이터 체크
  if (!clicks || clicks.length !== 3) {
    toast.error('그리드 설정을 위해 3개의 점을 먼저 찍어주세요!', {
      icon: <Image size={18} />,
      style: {
        background: '#1f1f23',
        color: '#fff',
        border: '1px solid #333',
      }
    });
    return;
  }
  
  const newPreset = { 
    id: Date.now(), 
    name: presetName, 
    config: { ...config }, 
    clicks: [...clicks] 
  };
  
  const updated = [...presets, newPreset];
  
  try {
    const result = await window.pywebview.api.save_presets(updated);
    const isSuccess = typeof result === 'object' ? result.status === "success" : true;
    
    if (isSuccess) {
      setPresets(updated);
      setPresetName("");
      toast.success('프리셋이 성공적으로 저장되었습니다.', {
        icon: <Save size={18} color="#6366f1" />,
      });
    }
  } catch (error) {
    toast.error(`저장 실패: ${error.message || error}`);
  }
};

  const deletePreset = async (id) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    
    try {
      await window.pywebview.api.save_presets(updated);
      toast.success('프리셋이 삭제되었습니다.');
    } catch (error) {
      console.error("삭제 동기화 실패:", error);
    }
  };

  const loadPreset = (preset) => {
  if (!imageData) {
    toast.error('이미지를 먼저 불러와야 합니다.', {
      icon: <ImageIcon size={18} color="#ef4444" />,
    });
    return;
  }

  if (window.confirm(`'${preset.name}' 설정을 불러올까요?`)) {
    setConfig(preset.config);
    setClicks(preset.clicks);
    toast.success(`'${preset.name}' 적용 완료`, {
      icon: <CheckCircle2 size={18} color="#10b981" />,
    });
  }
};

  return (
    <AppContainer>
      
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          style: { borderRadius: '10px', fontSize: '14px' }
        }}
      />

      <TopBar 
        handleOpenFile={handleOpenFile}
        isLoading={isLoading}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        imageData={imageData}
        clicks={clicks}
        openConfirmModal={openConfirmModal}
      />

      <MainContent>
        {/* 날짜 확인 모달 */}
        {showConfirm && (
          <Overlay>
            <ModalBox>
              <ModalHeader>
                <Calendar size={22} />
                <h3>최종 확인</h3>
              </ModalHeader>
              <InputField>
                <label>추출 날짜 (YYYYMMDD)</label>
                <input 
                  type="text" 
                  value={targetDate} 
                  onChange={e => setTargetDate(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="20240101"
                />
              </InputField>
              <ButtonGroup>
                <ModalButton onClick={() => setShowConfirm(false)}>취소</ModalButton>
                <ModalButton primary onClick={handleFinalCrop} disabled={!targetDate}>확인 및 실행</ModalButton>
              </ButtonGroup>
            </ModalBox>
          </Overlay>
        )}

        {/* 모던 로딩 인디케이터 */}
        {isLoading && (
          <Overlay>
            <SpinnerWrapper>
              <Loader2 size={48} />
              <p>이미지를 처리하는 중입니다...</p>
            </SpinnerWrapper>
          </Overlay>
        )}
        
        {/* 메인 작업 영역 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {imageData ? (
            <GridCanvas 
              imageData={imageData} 
              config={config} 
              clicks={clicks} 
              onCanvasClick={setClicks} 
            />
          ) : (
            <EmptyState>
              {!isLoading && (
                <>
                  <AlertCircle size={48} />
                  <p>TIF 파일을 불러와서 작업을 시작하세요.</p>
                </>
              )}
            </EmptyState>
          )}
        </div>

        {/* 사이드바 */}
        <Sidebar 
          presets={presets}
          presetName={presetName}
          setPresetName={setPresetName}
          saveCurrentAsPreset={saveCurrentAsPreset}
          loadPreset={loadPreset}
          deletePreset={deletePreset}
          config={config}
          setConfig={setConfig}
        />
      </MainContent>
    </AppContainer>
  );
}

export default App;