/**
 * 선 그리기 유틸리티
 */
export const drawLine = (ctx, x1, y1, x2, y2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

/**
 * 회전된 그리드 계산 및 그리기
 */
export const drawRotatedGrid = (ctx, pts, cfg, scale) => {
  const { rows, cols, margin, rowGap, colGap, groupGap, groups, gridColor, groupDirection } = cfg;
  const [p1, p2, p3] = pts;

  const vX = { x: p2.x - p1.x, y: p2.y - p1.y };
  const distX = Math.sqrt(vX.x ** 2 + vX.y ** 2);
  const unitX = { x: vX.x / distX, y: vX.y / distX };
  const unitY = { x: -unitX.y, y: unitX.x }; 

  const vP3 = { x: p3.x - p1.x, y: p3.y - p1.y };
  const distY = Math.abs(vP3.x * unitY.x + vP3.y * unitY.y); 

  ctx.strokeStyle = gridColor || '#ffffff'; 
  ctx.lineWidth = 1.4 / scale;

  let cellWidth, cellHeight, groupW, groupH;

  if (groupDirection === 'vertical') {
    const totalGroupGap = groupGap * (groups - 1);
    const availableHeight = distY - (margin * 2) - totalGroupGap;
    groupH = availableHeight / groups;
    cellWidth = (distX - (margin * 2) - (colGap * (cols - 1))) / cols;
    cellHeight = (groupH - (rowGap * (rows - 1))) / rows;
  } else {
    const totalGroupGap = groupGap * (groups - 1);
    const availableWidth = distX - (margin * 2) - totalGroupGap;
    groupW = availableWidth / groups;
    cellWidth = (groupW - (colGap * (cols - 1))) / cols;
    cellHeight = (distY - (margin * 2) - (rowGap * (rows - 1))) / rows;
  }

  for (let g = 0; g < groups; g++) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let dX, dY;
        if (groupDirection === 'vertical') {
          const gOffset = margin + g * (groupH + groupGap);
          dX = margin + (c * (cellWidth + colGap));
          dY = gOffset + (r * (cellHeight + rowGap));
        } else {
          const gOffset = margin + g * (groupW + groupGap);
          dX = gOffset + (c * (cellWidth + colGap));
          dY = margin + (r * (cellHeight + rowGap));
        }

        const pTL = { x: p1.x + (unitX.x * dX) + (unitY.x * dY), y: p1.y + (unitX.y * dX) + (unitY.y * dY) };
        const pTR = { x: pTL.x + (unitX.x * cellWidth), y: pTL.y + (unitX.y * cellWidth) };
        const pBL = { x: pTL.x + (unitY.x * cellHeight), y: pTL.y + (unitY.y * cellHeight) };
        const pBR = { x: pTR.x + (unitY.x * cellHeight), y: pTR.y + (unitY.y * cellHeight) };

        drawLine(ctx, pTL.x, pTL.y, pTR.x, pTR.y);
        drawLine(ctx, pTR.x, pTR.y, pBR.x, pBR.y);
        drawLine(ctx, pBR.x, pBR.y, pBL.x, pBL.y);
        drawLine(ctx, pBL.x, pBL.y, pTL.x, pTL.y);
      }
    }
  }

  return { distX, distY, unitX, unitY };
};

/**
 * 그리드 내부 번호 표시
 */
export const drawGridNumbers = (ctx, info, cfg, currentScale) => {
  const { rows, cols, groups, groupDirection, margin, rowGap, colGap, groupGap, startNumber = 1 } = cfg;
  const { width, height, p1, unitX, unitY } = info;

  let cellW, cellH, groupW, groupH;
  if (groupDirection === 'horizontal') {
    const availW = width - (margin * 2) - (groupGap * (groups - 1));
    groupW = availW / groups;
    cellW = (groupW - (colGap * (cols - 1))) / cols;
    cellH = (height - (margin * 2) - (rowGap * (rows - 1))) / rows;
  } else {
    const availH = height - (margin * 2) - (groupGap * (groups - 1));
    groupH = availH / groups;
    cellW = (width - (margin * 2) - (colGap * (cols - 1))) / cols;
    cellH = (groupH - (rowGap * (rows - 1))) / rows;
  }

  ctx.font = `bold ${Math.max(12, 14 / currentScale)}px Arial`;
  ctx.fillStyle = "yellow";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let r = 0; r < rows; r++) {
    for (let g = 0; g < groups; g++) {
      for (let c = 0; c < cols; c++) {
        const index = groupDirection === 'vertical' 
          ? (g * (rows * cols)) + (r * cols) + (c + 1)
          : (r * (groups * cols)) + (g * cols) + (c + 1);

        const num = index + startNumber -1;

        let dX, dY;
        if (groupDirection === 'horizontal') {
          dX = (margin + g * (groupW + groupGap)) + (c * (cellW + colGap)) + (cellW / 2);
          dY = margin + (r * (cellH + rowGap)) + (cellH / 2);
        } else {
          dX = margin + (c * (cellW + colGap)) + (cellW / 2);
          dY = (margin + g * (groupH + groupGap)) + (r * (cellH + rowGap)) + (cellH / 2);
        }

        const realX = p1.x + (unitX.x * dX) + (unitY.x * dY);
        const realY = p1.y + (unitX.y * dX) + (unitY.y * dY);

        
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(num, realX, realY);
        ctx.shadowBlur = 0;
      }
    }
  }
};