import React from 'react';
import styled from 'styled-components';

import { 
  FileImage, 
  HelpCircle, 
  Crop, 
  MousePointer2, 
  Move, 
  ZoomIn, 
  X,
  CheckCircle2
} from 'lucide-react';

const Toolbar = styled.div`
  height: 64px;
  padding: 0 24px;
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 100;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: ${props => props.primary ? '#6366f1' : '#2d2d2d'};
  color: white;
  border: 1px solid ${props => props.primary ? 'transparent' : '#444'};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled { 
    opacity: 0.4; 
    cursor: not-allowed;
    filter: grayscale(1);
  }

  &:hover:not(:disabled) { 
    background-color: ${props => props.primary ? '#4f46e5' : '#3d3d3d'}; 
    border-color: ${props => props.primary ? 'transparent' : '#555'};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 8px;
  
  .label { font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; }
  .name { font-size: 13px; color: #e4e4e7; font-weight: 500; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const HelpOverlay = styled.div`
  position: absolute;
  top: 74px;
  left: 24px; 
  width: 320px;
  background-color: #262626;
  border: 1px solid #3f3f46;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  z-index: 1000;
  display: ${props => props.show ? 'block' : 'none'};
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #262626;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #333;
  font-size: 12px;
  color: ${props => props.complete ? '#10b981' : '#a1a1aa'};
`;

const GuideSection = styled.div`
  margin-bottom: 16px;
  h4 { color: #818cf8; margin: 0 0 8px 0; font-size: 14px; display: flex; align-items: center; gap: 6px; }
  p { font-size: 12px; color: #d1d5db; line-height: 1.6; margin: 0; }
  ul { padding-left: 18px; margin: 8px 0; font-size: 12px; color: #9ca3af; list-style-type: none; }
  li { position: relative; margin-bottom: 4px; }
  li:before { content: "•"; color: #6366f1; position: absolute; left: -14px; }
`;

function TopBar({ handleOpenFile, isLoading, showHelp, setShowHelp, imageData, clicks, openConfirmModal }) {
  const fileName = imageData ? imageData.path.split(/[\\/]/).pop() : '선택된 파일 없음';

  return (
    <Toolbar>
      {/* 1. 파일 열기 버튼 */}
      <Button onClick={handleOpenFile} primary disabled={isLoading}>
        <FileImage size={18} />
        {isLoading ? '로딩 중...' : '이미지 불러오기'}
      </Button>

      {/* 2. 도움말 버튼 */}
      <Button onClick={() => setShowHelp(!showHelp)}>
        <HelpCircle size={18} />
        {showHelp ? '도움말 닫기' : '도움말'}
      </Button>

      {/* 3. 파일 정보 표시 */}
      <FileInfo>
        <span className="label">Current File</span>
        <span className="name">{fileName}</span>
      </FileInfo>

      {/* 도움말 오버레이 */}
      <HelpOverlay show={showHelp}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>사용 가이드</h3>
            <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700 }}>Maid by 김형균</span>
          </div>
          <X size={18} color="#71717a" style={{ cursor: 'pointer' }} onClick={() => setShowHelp(false)} />
        </div>

        <GuideSection>
          <h4><MousePointer2 size={14} /> 영역 지정 (3점 클릭)</h4>
          <p>ㄱ자 모양의 기준점을 순서대로 찍어주세요.</p>
          <ul>
            <li>첫 번째: 좌상단 기준점</li>
            <li>두 번째: 가로 축 (기울기)</li>
            <li>세 번째: 세로 높이 축</li>
          </ul>
        </GuideSection>

        <GuideSection>
          <h4><Move size={14} /> 조작법</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#9ca3af' }}>
            <div style={{ background: '#1a1a1a', padding: '8px', borderRadius: '6px' }}><strong>좌클릭</strong> 점 찍기</div>
            <div style={{ background: '#1a1a1a', padding: '8px', borderRadius: '6px' }}><strong>우클릭</strong> 드래그</div>
            <div style={{ background: '#1a1a1a', padding: '8px', borderRadius: '6px' }}><strong>휠</strong> 확대/축소</div>
          </div>
        </GuideSection>
      </HelpOverlay>

      {/* 4. 우측 상태 및 실행 영역 */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <StatusBadge complete={clicks.length === 3}>
          <CheckCircle2 size={14} color={clicks.length === 3 ? '#10b981' : '#71717a'} />
          클릭 수: <strong>{clicks.length}</strong> / 3
        </StatusBadge>

        <Button onClick={openConfirmModal} disabled={clicks.length !== 3} primary>
          <Crop size={18} />
          영역 자르기 실행
        </Button>
      </div>
    </Toolbar>
  );
}

export default TopBar;