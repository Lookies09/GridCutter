import React, { useState } from 'react';
import styled from 'styled-components';
import GridCanvas from './components/GridCanvas';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #252526;
  color: white;
`;

const Toolbar = styled.div`
  padding: 15px;
  background-color: #333333;
  display: flex;
  gap: 20px;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 300px;
  padding: 20px;
  background-color: #2d2d2d;
  border-left: 1px solid #444;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  label { font-size: 12px; color: #aaa; }
  input { 
    background: #3c3c3c; border: 1px solid #555; color: white; padding: 5px; 
    border-radius: 4px;
  }
`;

const Button = styled.button`
  padding: 10px;
  background-color: ${props => props.primary ? '#007acc' : '#444'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background-color: ${props => props.primary ? '#0062a3' : '#555'}; }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  gap: 15px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #333;
  border-top: 5px solid #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function App() {
  const [imageData, setImageData] = useState(null); // {base64, path, preview_w, preview_h, orig_w, orig_h}
  const [isLoading, setIsLoading] = useState(false);
  const [clicks, setClicks] = useState([]);
  const [config, setConfig] = useState({
  rows: 6,
  cols: 4,
  margin: 0,
  rowGap: 10,    
  colGap: 10,    
  groupGap: 10,
  groups: 1,
  gridColor: '#FF00FF'
});

  // 파일 열기
  const handleOpenFile = async () => {
    setIsLoading(true); // 로딩 시작
    try {
      const response = await window.pywebview.api.open_file_dialog();
      if (response) {
        setImageData(response);
        setClicks([]);
      }
    } catch (error) {
      console.error("파일 로드 실패:", error);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  // 점 찍기 업데이트
  const handleCanvasClick = (newClicks) => {
    setClicks(newClicks);
  };

  // 파이썬으로 자르기 요청 보내기
  const handleCropRequest = async () => {
    if (clicks.length !== 3) return;

    const savePath = await window.pywebview.api.select_save_folder();
    if (!savePath) return;

    setIsLoading(true);

    try {
    const payload = {
      path: imageData.path,
      save_path: savePath,
      preview_size: { w: imageData.preview_w, h: imageData.preview_h },
      orig_size: { w: imageData.orig_w, h: imageData.orig_h },
      clicks: clicks,
      config: config
    };

    const response = await window.pywebview.api.process_crop(payload);
    
    if (response.status === "success") {
      alert(response.message);
    } else {
      alert("오류 발생: " + response.message);
    }
  } catch (error) {
    console.error("자르기 요청 중 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    setIsLoading(false);
  }
  };

  return (
    <AppContainer>
      <Toolbar>
        <Button onClick={handleOpenFile} primary disabled={isLoading}>
          {isLoading ? '로딩 중...' : '이미지 불러오기 (TIF)'}
        </Button>
        <span style={{ fontSize: '14px' }}>
          {imageData ? `파일: ${imageData.path.split('\\').pop()}` : '파일을 선택하세요'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <span style={{ color: '#888' }}>클릭 수: {clicks.length} / 3</span>
          <Button 
            onClick={handleCropRequest} 
            disabled={clicks.length !== 3}
            primary
          >
            선택 영역 자르기
          </Button>
        </div>
      </Toolbar>

      <MainContent>
        <div style={{ flex: 1, position: 'relative' }}>
          {isLoading && (
            <LoadingOverlay>
              <Spinner />
              <p>고해상도 이미지를 처리하고 있습니다...</p>
            </LoadingOverlay>
          )}
          {imageData ? (
            <GridCanvas 
              imageData={imageData} 
              config={config} 
              clicks={clicks} 
              onCanvasClick={handleCanvasClick} 
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {!isLoading && (
                  <p>TIF 파일을 불러와 주세요. (점 3개를 찍어 영역을 지정합니다)</p>
              )
              }          
              
            </div>
          )}
        </div>

        <Sidebar>
          <h3>그리드 설정</h3>
          <InputGroup>
            <label>행 (Rows)</label>
            <input type="number" value={config.rows} onChange={e => setConfig({...config, rows: parseInt(e.target.value)})}/>
          </InputGroup>
          <InputGroup>
            <label>열 (Cols)</label>
            <input type="number" value={config.cols} onChange={e => setConfig({...config, cols: parseInt(e.target.value)})}/>
          </InputGroup>
          <InputGroup>
            <label>여백 (Margin)</label>
            <input type="number" value={config.margin} onChange={e => setConfig({...config, margin: parseInt(e.target.value)})}/>
          </InputGroup>
          <InputGroup>
            <label>그룹 수 (Groups)</label>
            <input type="number" value={config.groups} onChange={e => setConfig({...config, groups: parseInt(e.target.value)})}/>
          </InputGroup>
          <InputGroup>
            <label>그룹 간격 (Group Gap)</label>
            <input type="number" value={config.groupGap} onChange={e => setConfig({...config, groupGap: parseInt(e.target.value)})}/>
          </InputGroup>
          <InputGroup>
            <label>가로 간격 (Col Gap)</label>
            <input type="number" value={config.colGap} onChange={e => setConfig({...config, colGap: parseInt(e.target.value)})}/>
          </InputGroup>
          <InputGroup>
            <label>세로 간격 (Row Gap)</label>
            <input type="number" value={config.rowGap} onChange={e => setConfig({...config, rowGap: parseInt(e.target.value)})}/>
          </InputGroup>

          <InputGroup>
            <label>객체 추출 크기 (기본 100px)</label>
            <input 
              type="number" 
              value={config.patchSize} 
              onChange={e => setConfig({...config, patchSize: parseInt(e.target.value) || 100})}
              placeholder="예: 100"
            />
            <p style={{fontSize: '10px', color: '#888'}}>* 군락 내부를 이 크기로 쪼갭니다.</p>
          </InputGroup>

          <InputGroup>
            <label>그리드 색상 (Grid Color)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={config.gridColor} 
                onChange={e => setConfig({...config, gridColor: e.target.value})}
                style={{ width: '40px', height: '30px', padding: '0', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px' }}>{config.gridColor.toUpperCase()}</span>
            </div>
          </InputGroup>
          
          <hr style={{ border: '0.5px solid #444', width: '100%', margin: '10px 0' }} />
          <p style={{ fontSize: '11px', color: '#888', lineHeight: '1.5' }}>
            1. 첫 번째 점: 좌상단 기준점<br />
            2. 두 번째 점: 가로/기울기 결정<br />
            3. 세 번째 점: 세로 높이 결정<br /><br />
            (즉! ㄱ자 모양으로 점 3개를 찍어주세요)<br />
            <br />
            휠: 줌 인/아웃<br />
            좌 클릭: 점 찍기<br />
            우 클릭: 이미지 이동 <br />
          </p>
        </Sidebar>
      </MainContent>
    </AppContainer>
  );
}

export default App;