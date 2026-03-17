const MIN_AXIS_LENGTH = 4;

export const drawLine = (ctx, x1, y1, x2, y2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const parsePositiveInt = (value, label) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} 값이 올바르지 않습니다.`);
  }

  return Math.floor(parsed);
};

const parseNonNegativeNumber = (value, label) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} 값이 올바르지 않습니다.`);
  }

  return parsed;
};

export const resolveGridFrame = (pts) => {
  if (!Array.isArray(pts) || pts.length !== 3) {
    throw new Error('그리드를 해석하려면 3개의 기준점이 필요합니다.');
  }

  const [p1, p2, p3] = pts;

  // Compute both possible axes
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const dist1 = Math.hypot(v1.x, v1.y);

  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  const dist2 = Math.hypot(v2.x, v2.y);

  if (!Number.isFinite(dist1) || dist1 < MIN_AXIS_LENGTH) {
    throw new Error('첫 번째 점과 두 번째 점이 너무 가까워 유효한 1차 축을 만들 수 없습니다.');
  }

  if (!Number.isFinite(dist2) || dist2 < MIN_AXIS_LENGTH) {
    throw new Error('두 번째 점과 세 번째 점이 너무 가까워 유효한 2차 축을 만들 수 없습니다.');
  }

  // Determine which vector is more horizontal (X-axis) vs vertical (Y-axis)
  // Compare absolute slopes: |dy/dx| for each vector
  // A more horizontal line has smaller |dy/dx|, a more vertical line has larger |dy/dx|
  const slope1 = Math.abs(v1.y / v1.x);  // slope of p1→p2
  const slope2 = Math.abs(v2.y / v2.x);  // slope of p2→p3

  let unitX, unitY, distX, distY;

  // If v1 is more horizontal than v2, use v1 as X-axis
  if (slope1 <= slope2) {
    unitX = { x: v1.x / dist1, y: v1.y / dist1 };
    unitY = { x: v2.x / dist2, y: v2.y / dist2 };
    distX = dist1;
    distY = dist2;
  } else {
    // Swap: v2 is more horizontal, use it as X-axis
    unitX = { x: v2.x / dist2, y: v2.y / dist2 };
    unitY = { x: v1.x / dist1, y: v1.y / dist1 };
    distX = dist2;
    distY = dist1;
  }

  return { p1, p2, p3, unitX, unitY, distX, distY };
};


export const resolveGridLayout = (pts, cfg) => {
  const frame = resolveGridFrame(pts);
  const rows = parsePositiveInt(cfg.rows, '행');
  const cols = parsePositiveInt(cfg.cols, '열');
  const groups = parsePositiveInt(cfg.groups, '그룹 수');
  const margin = parseNonNegativeNumber(cfg.margin, '여백');
  const rowGap = parseNonNegativeNumber(cfg.rowGap, '세로 간격');
  const colGap = parseNonNegativeNumber(cfg.colGap, '가로 간격');
  const groupGap = parseNonNegativeNumber(cfg.groupGap, '그룹 간격');
  const groupDirection = cfg.groupDirection === 'vertical' ? 'vertical' : 'horizontal';
  const numberingDirection = cfg.numberingDirection === 'col' ? 'col' : 'row';
  const numberingGroupOrder = cfg.numberingGroupOrder === 'all' ? 'all' : 'group';

  let cellWidth;
  let cellHeight;
  let groupWidth = null;
  let groupHeight = null;

  if (groupDirection === 'vertical') {
    const availableHeight = frame.distY - (margin * 2) - (groupGap * (groups - 1));

    if (availableHeight <= 0) {
      throw new Error('그룹 수나 간격이 너무 커서 세로 방향 그리드를 만들 수 없습니다.');
    }

    groupHeight = availableHeight / groups;
    cellWidth = (frame.distX - (margin * 2) - (colGap * (cols - 1))) / cols;
    cellHeight = (groupHeight - (rowGap * (rows - 1))) / rows;
    groupWidth = (cellWidth * cols) + (colGap * (cols - 1));
  } else {
    const availableWidth = frame.distX - (margin * 2) - (groupGap * (groups - 1));

    if (availableWidth <= 0) {
      throw new Error('그룹 수나 간격이 너무 커서 가로 방향 그리드를 만들 수 없습니다.');
    }

    groupWidth = availableWidth / groups;
    cellWidth = (groupWidth - (colGap * (cols - 1))) / cols;
    cellHeight = (frame.distY - (margin * 2) - (rowGap * (rows - 1))) / rows;
    groupHeight = (cellHeight * rows) + (rowGap * (rows - 1));
  }

  if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight) || cellWidth <= 0 || cellHeight <= 0) {
    throw new Error('축 길이, 여백, 또는 간격 설정 때문에 유효한 그리드를 만들 수 없습니다.');
  }

  return {
    ...frame,
    rows,
    cols,
    groups,
    margin,
    rowGap,
    colGap,
    groupGap,
    groupDirection,
    numberingDirection,
    numberingGroupOrder,
    cellWidth,
    cellHeight,
    groupWidth,
    groupHeight,
    startNumber: parsePositiveInt(cfg.startNumber ?? 1, '시작 번호'),
    gridColor: cfg.gridColor || '#ffffff',
  };
};

const getCellOffset = (layout, groupIndex, rowIndex, colIndex) => {
  if (layout.groupDirection === 'vertical') {
    const groupOffset = layout.margin + (groupIndex * (layout.groupHeight + layout.groupGap));

    return {
      dX: layout.margin + (colIndex * (layout.cellWidth + layout.colGap)),
      dY: groupOffset + (rowIndex * (layout.cellHeight + layout.rowGap)),
    };
  }

  const groupOffset = layout.margin + (groupIndex * (layout.groupWidth + layout.groupGap));

  return {
    dX: groupOffset + (colIndex * (layout.cellWidth + layout.colGap)),
    dY: layout.margin + (rowIndex * (layout.cellHeight + layout.rowGap)),
  };
};

export const drawRotatedGrid = (ctx, pts, cfg, scale) => {
  let layout;

  try {
    layout = resolveGridLayout(pts, cfg);
  } catch {
    return null;
  }

  ctx.strokeStyle = layout.gridColor;
  ctx.lineWidth = 1.4 / scale;

  for (let groupIndex = 0; groupIndex < layout.groups; groupIndex += 1) {
    for (let rowIndex = 0; rowIndex < layout.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < layout.cols; colIndex += 1) {
        const { dX, dY } = getCellOffset(layout, groupIndex, rowIndex, colIndex);
        const pTL = {
          x: layout.p1.x + (layout.unitX.x * dX) + (layout.unitY.x * dY),
          y: layout.p1.y + (layout.unitX.y * dX) + (layout.unitY.y * dY),
        };
        const pTR = {
          x: pTL.x + (layout.unitX.x * layout.cellWidth),
          y: pTL.y + (layout.unitX.y * layout.cellWidth),
        };
        const pBL = {
          x: pTL.x + (layout.unitY.x * layout.cellHeight),
          y: pTL.y + (layout.unitY.y * layout.cellHeight),
        };
        const pBR = {
          x: pTR.x + (layout.unitY.x * layout.cellHeight),
          y: pTR.y + (layout.unitY.y * layout.cellHeight),
        };

        drawLine(ctx, pTL.x, pTL.y, pTR.x, pTR.y);
        drawLine(ctx, pTR.x, pTR.y, pBR.x, pBR.y);
        drawLine(ctx, pBR.x, pBR.y, pBL.x, pBL.y);
        drawLine(ctx, pBL.x, pBL.y, pTL.x, pTL.y);
      }
    }
  }

  return layout;
};

export const drawGridNumbers = (ctx, layout, currentScale) => {
  if (!layout) {
    return;
  }

  ctx.font = `bold ${Math.max(12, 14 / currentScale)}px Arial`;
  ctx.fillStyle = 'yellow';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let rowIndex = 0; rowIndex < layout.rows; rowIndex += 1) {
    for (let groupIndex = 0; groupIndex < layout.groups; groupIndex += 1) {
      for (let colIndex = 0; colIndex < layout.cols; colIndex += 1) {
        // 번호 매기기 방향에 따라 인덱스 계산
        // row 우선: {1,2,3},{4,5,6} - 행을 먼저 채움
        // col 우선: {1,4,7},{2,5,8} - 열을 먼저 채움
        let cellIndex;
        if (layout.numberingDirection === 'col') {
          // 열 우선: colIndex * rows + rowIndex
          cellIndex = colIndex * layout.rows + rowIndex;
        } else {
          // 행 우선: rowIndex * cols + colIndex (기본)
          cellIndex = rowIndex * layout.cols + colIndex;
        }

        // 그룹 순서에 따라 전체 인덱스 계산
        // group 우선: 각 그룹 내에서 cellIndex 순차 진행
        // all 우선: 모든 그룹의 행을 먼저 진행 (groupDirection horizontal에서 의미 있음)
        let index;
        const cellsPerGroup = layout.rows * layout.cols;
        
        if (layout.numberingGroupOrder === 'all' && layout.groupDirection === 'horizontal') {
          // 전체 우선 (horizontal): row -> group -> col 순서
          // 행을 먼저 진행하면서 각 그룹을 순차적으로 채움
          index = (rowIndex * layout.cols * layout.groups) + (groupIndex * layout.cols) + colIndex;
        } else if (layout.numberingGroupOrder === 'all' && layout.groupDirection === 'vertical') {
          // 전체 우선 (vertical): col -> group -> row 순서
          // 열을 먼저 진행하면서 각 그룹을 순차적으로 채움
          index = (colIndex * layout.rows * layout.groups) + (groupIndex * layout.rows) + rowIndex;
        } else {
          // 그룹 우선 (기본): group -> row -> col 순서
          index = (groupIndex * cellsPerGroup) + cellIndex;
        }

        const { dX, dY } = getCellOffset(layout, groupIndex, rowIndex, colIndex);
        
        // 번호 위치: 셀의 중앙
        // realX = p1.x + unitX.x * (dX + cellWidth/2) + unitY.x * (dY + cellHeight/2)
        // realY = p1.y + unitX.y * (dX + cellWidth/2) + unitY.y * (dY + cellHeight/2)
        const realX = layout.p1.x + (layout.unitX.x * (dX + (layout.cellWidth / 2))) + (layout.unitY.x * (dY + (layout.cellHeight / 2)));
        const realY = layout.p1.y + (layout.unitX.y * (dX + (layout.cellWidth / 2))) + (layout.unitY.y * (dY + (layout.cellHeight / 2)));

        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(layout.startNumber + index, realX, realY);
        ctx.shadowBlur = 0;
      }
    }
  }
};
