import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { drawRotatedGrid, drawGridNumbers } from '../utils/gridUtils';
import { Search, Move, MousePointer } from 'lucide-react';

// --- Styled Components ---

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #121212;
  /* 미세한 격자 배경으로 에디터 느낌 강조 */
  background-image: radial-gradient(#252525 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledCanvas = styled.canvas`
  display: block;
  /* 상태에 따라 커서 변경 */
  cursor: ${props => props.isPanning ? 'grabbing' : 'crosshair'};
`;

// 우측 하단 배율 표시기
const ZoomIndicator = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(38, 38, 38, 0.8);
  backdrop-filter: blur(8px);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #3f3f46;
  color: #a1a1aa;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
`;

// 좌측 상단 툴 상태 표시기
const ToolStatus = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
`;

const Badge = styled.div`
  background: rgba(38, 38, 38, 0.8);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #3f3f46;
  color: ${props => props.active ? '#818cf8' : '#71717a'};
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// --- Component ---

const GridCanvas = ({ imageData, config, clicks, onCanvasClick }) => {
  const canvasRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const resetView = useCallback(() => {
    if (!canvasRef.current || !imageData) return;
    const container = canvasRef.current.parentElement;
    const scale = Math.min(
      (container.clientWidth * 0.85) / imageData.preview_w,
      (container.clientHeight * 0.85) / imageData.preview_h
    );
    setTransform({
      x: (container.clientWidth - imageData.preview_w * scale) / 2,
      y: (container.clientHeight - imageData.preview_h * scale) / 2,
      scale: scale
    });
  }, [imageData]);

  useEffect(() => {
    if (!imageData?.base64) return;
    const img = new Image();
    img.src = imageData.base64;
    img.onload = () => { setImageObj(img); resetView(); };
  }, [imageData, resetView]);

  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 부드러운 렌더링 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // 1. 이미지 그리기 (그림자 효과 추가)
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20 / transform.scale;
    ctx.drawImage(imageObj, 0, 0, imageData.preview_w, imageData.preview_h);
    ctx.shadowBlur = 0; // 그림자 해제

    // 2. 클릭한 점 그리기 (고급 디자인)
    const colors = ['#ef4444', '#22c55e', '#3b82f6']; // Red, Green, Blue (500)
    clicks.forEach((p, idx) => {
      ctx.save();
      
      // 발광 효과
      ctx.shadowBlur = 10 / transform.scale;
      ctx.shadowColor = colors[idx];
      
      // 바깥 원
      ctx.fillStyle = colors[idx];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7 / transform.scale, 0, Math.PI * 2);
      ctx.fill();

      // 안쪽 흰 점
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5 / transform.scale, 0, Math.PI * 2);
      ctx.fill();

      // 포인트 인덱스 텍스트 표시
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = `bold ${12 / transform.scale}px Inter, sans-serif`;
      ctx.fillText(idx + 1, p.x + (10 / transform.scale), p.y - (10 / transform.scale));
      
      ctx.restore();
    });

    // 3. 그리드 및 번호 그리기
    if (clicks.length === 3) {
      const gridInfo = drawRotatedGrid(ctx, clicks, config, transform.scale);
      if (gridInfo) {
        drawGridNumbers(
          ctx, 
          { 
            width: gridInfo.distX, 
            height: gridInfo.distY, 
            p1: clicks[0], 
            unitX: gridInfo.unitX, 
            unitY: gridInfo.unitY 
          }, 
          config, 
          transform.scale
        );
      }
    }
    
    ctx.restore();
  }, [imageObj, clicks, config, transform, imageData]);

  // 휠 확대/축소 로직
  const handleWheel = (e) => {
    const zoomSpeed = 0.0015;
    const delta = -e.deltaY;
    const newScale = Math.min(Math.max(transform.scale + delta * zoomSpeed * transform.scale, 0.05), 50);

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = newScale / transform.scale;
    
    setTransform({
      scale: newScale,
      x: mouseX - (mouseX - transform.x) * zoomFactor,
      y: mouseY - (mouseY - transform.y) * zoomFactor
    });
  };

  const handleMouseDown = (e) => {
    if (e.button === 2) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;

      if (x >= 0 && x <= imageData.preview_w && y >= 0 && y <= imageData.preview_h) {
        if (clicks.length >= 3) onCanvasClick([{ x, y }]);
        else onCanvasClick([...clicks, { x, y }]);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <CanvasContainer onContextMenu={(e) => e.preventDefault()}>
      <ToolStatus>
        <Badge active={!isPanning}><MousePointer size={12} /> SELECT</Badge>
        <Badge active={isPanning}><Move size={12} /> PAN</Badge>
      </ToolStatus>

      <StyledCanvas
        ref={canvasRef}
        isPanning={isPanning}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      <ZoomIndicator>
        <Search size={14} />
        {Math.round(transform.scale * 100)}%
      </ZoomIndicator>
    </CanvasContainer>
  );
};

export default GridCanvas;