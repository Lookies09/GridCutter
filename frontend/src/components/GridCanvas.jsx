import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  overflow: hidden;
  position: relative;
`;

const StyledCanvas = styled.canvas`
  cursor: crosshair;
  display: block;
`;

const GridCanvas = ({ imageData, config, clicks, onCanvasClick }) => {
  const canvasRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // --- [1] 유틸리티 함수 ---
  const drawLine = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawRotatedGrid = (ctx, pts, cfg) => {
    const { rows, cols, margin, rowGap, colGap, groupGap, groups, gridColor } = cfg;

    // 1:1 좌표계이므로 scaleX, scaleY는 생략 (이미 좌표가 preview_w 기준임)
    const p1 = pts[0];
    const p2 = pts[1];
    const p3 = pts[2];

    const vX = { x: p2.x - p1.x, y: p2.y - p1.y };
    const distX = Math.sqrt(vX.x ** 2 + vX.y ** 2);
    const unitX = { x: vX.x / distX, y: vX.y / distX };
    const unitY = { x: -unitX.y, y: unitX.x }; 

    const vP3 = { x: p3.x - p1.x, y: p3.y - p1.y };
    const distY = Math.abs(vP3.x * unitY.x + vP3.y * unitY.y); 

    ctx.strokeStyle = gridColor || '#ffffff'; 
    ctx.lineWidth = 1 / transform.scale;

    const totalGroupGap = groupGap * (groups - 1);
  const availableWidth = distX - (margin * 2) - totalGroupGap;
  const groupWidth = availableWidth / groups;

  // [수정] 셀 너비/높이 계산 시 사이 간격을 제외함
  const cellWidth = (groupWidth - (colGap * (cols - 1))) / cols;
  const cellHeight = (distY - (margin * 2) - (rowGap * (rows - 1))) / rows;

  for (let g = 0; g < groups; g++) {
    const gOffset = margin + g * (groupWidth + groupGap);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // [수정] 각 셀의 시작 위치 계산 (간격 포함)
        const dX = gOffset + (c * (cellWidth + colGap));
        const dY = margin + (r * (cellHeight + rowGap));

        // 셀의 네 꼭짓점 계산
        const pTL = { x: p1.x + (unitX.x * dX) + (unitY.x * dY), y: p1.y + (unitX.y * dX) + (unitY.y * dY) };
        const pTR = { x: pTL.x + (unitX.x * cellWidth), y: pTL.y + (unitX.y * cellWidth) };
        const pBL = { x: pTL.x + (unitY.x * cellHeight), y: pTL.y + (unitY.y * cellHeight) };
        const pBR = { x: pTR.x + (unitY.x * cellHeight), y: pTR.y + (unitY.y * cellHeight) };

        // 개별 셀 그리기 (사각형)
        drawLine(ctx, pTL.x, pTL.y, pTR.x, pTR.y);
        drawLine(ctx, pTR.x, pTR.y, pBR.x, pBR.y);
        drawLine(ctx, pBR.x, pBR.y, pBL.x, pBL.y);
        drawLine(ctx, pBL.x, pBL.y, pTL.x, pTL.y);
      }
    }
  }
};

const resetView = useCallback(() => {
    if (!canvasRef.current || !imageData) return;
    const container = canvasRef.current.parentElement;
    const scale = Math.min(
      (container.clientWidth * 0.9) / imageData.preview_w,
      (container.clientHeight * 0.9) / imageData.preview_h
    );
    setTransform({
      x: (container.clientWidth - imageData.preview_w * scale) / 2,
      y: (container.clientHeight - imageData.preview_h * scale) / 2,
      scale: scale
    });
  }, [imageData]);

  // --- [1] 이미지 로드 ---
  useEffect(() => {
    if (!imageData?.base64) return;
    const img = new Image();
    img.src = imageData.base64;
    img.onload = () => {
      setImageObj(img);
      // 이미지 로드 시 중앙 정렬 및 초기 스케일 계산
      resetView();
    };
  }, [imageData]);

  

  // --- [2] 그리기 로직 ---
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 변환 행렬 적용 (Pan & Zoom)
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // 이미지 그리기
    ctx.drawImage(imageObj, 0, 0, imageData.preview_w, imageData.preview_h);

    // 점 및 그리드 그리기 (1:1 preview_w 좌표계 사용)
    const colors = ['#ff4d4d', '#4dff4d', '#4d4dff'];
    clicks.forEach((p, idx) => {
      ctx.fillStyle = colors[idx];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6 / transform.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2 / transform.scale;
      ctx.stroke();
    });

    // drawRotatedGrid 호출 (이전 로직 동일)
    if (clicks.length === 3) {
      // drawRotatedGrid 함수는 이전 답변의 로직을 그대로 사용한다고 가정
      // (내부에서 p1, p2, p3를 1:1 좌표로 사용하므로 그대로 작동함)
      drawRotatedGrid(ctx, clicks, config); 
    }
    
    ctx.restore();
  }, [imageObj, clicks, config, transform, imageData]);

  // --- [3] 이벤트 핸들러 ---

  // 휠 확대/축소
  const handleWheel = (e) => {
    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const newScale = Math.min(Math.max(transform.scale + delta * zoomSpeed, 0.1), 20);

    // 마우스 위치 기준으로 확대
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

  // 팬(이동) 시작
  const handleMouseDown = (e) => {
    if (e.button === 2) { // 우클릭
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) { // 좌클릭 (점 찍기)
      const rect = canvasRef.current.getBoundingClientRect();
      // 변환 행렬을 역산하여 이미지상의 1:1 좌표 계산
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
  const handleContextMenu = (e) => e.preventDefault(); // 우클릭 메뉴 방지

  return (
    <CanvasContainer onContextMenu={handleContextMenu}>
      <StyledCanvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </CanvasContainer>
  );
};

export default GridCanvas;