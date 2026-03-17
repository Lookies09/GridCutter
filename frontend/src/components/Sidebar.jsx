import React from 'react';
import styled from 'styled-components';
import { 
  Settings, 
  Save, 
  Trash2, 
  Layers, 
  Maximize, 
  ArrowRight, 
  ArrowDown, 
  Hash, 
  Palette,
  LayoutGrid,
  Square,
  Crop,
  ListOrdered,
  Group
} from 'lucide-react';

// --- Styled Components ---

const SidebarContainer = styled.div`
  width: 320px;
  background-color: #1a1a1a;
  border-left: 1px solid #333;
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #e0e0e0;
  overflow: hidden;
  box-sizing: border-box;
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
  &::-webkit-scrollbar-track { background: transparent; }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #818cf8;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  label,
  .input-label {
    font-size: 12px;
    font-weight: 600;
    color: #9ca3af;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  input[type="number"], input[type="text"] {
    width: 100%;
    box-sizing: border-box;
    background: #262626;
    border: 1px solid #3f3f46;
    color: #fff;
    padding: 10px;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    &:focus { 
      border-color: #6366f1; 
      background: #2d2d2d;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
  }
`;

const PresetList = styled.div`
  background: #262626;
  border: 1px solid #333;
  border-radius: 10px;
  max-height: 180px;
  overflow-y: auto;
  margin-top: 8px;
`;

const PresetItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: background 0.2s;
  &:last-child { border-bottom: none; }
  &:hover { background: #323232; }
  
  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    span.name { font-size: 13px; font-weight: 600; color: #fff; }
    span.details { font-size: 11px; color: #71717a; }
  }
`;

const ColorPickerContainer = styled.div`
  background: #262626;
  border: 1px solid #3f3f46;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  &:hover { border-color: #6366f1; }

  input[type="color"] {
    -webkit-appearance: none;
    border: none;
    width: 42px;
    height: 42px;
    cursor: pointer;
    background: none;
    padding: 0;
    &::-webkit-color-swatch-wrapper { padding: 0; }
    &::-webkit-color-swatch { 
      border-radius: 6px; 
      border: 1px solid #3f3f46;
    }
  }

  .color-info {
    display: flex;
    flex-direction: column;
    span.hex { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #fff; }
    span.label { font-size: 10px; color: #71717a; text-transform: uppercase; }
  }
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? '#6366f1' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#9ca3af'};
  border: ${props => props.primary ? 'none' : '1px solid #3f3f46'};
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { 
    background: ${props => props.primary ? '#4f46e5' : '#323232'}; 
    color: white;
  }
  &:active { transform: scale(0.98); }
`;

const TabGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #262626;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid #3f3f46;
`;

const TabButton = styled.button`
  background: ${props => props.active ? '#4f46e5' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#71717a'};
  border: none;
  padding: 8px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  &:hover { color: #fff; }
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #71717a;
  padding: 6px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  &:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
`;

// --- Component ---

function Sidebar({ 
  presets, presetName, setPresetName, saveCurrentAsPreset, 
  loadPreset, deletePreset, config, setConfig 
}) {
  return (
    <SidebarContainer>
      <ScrollArea>
        {/* 프리셋 관리 섹션 */}
        <Section>
          <SectionTitle><Save size={16} /> Presets</SectionTitle>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              aria-label="새 프리셋 이름"
              style={{ flex: 1, padding: '10px', background: '#262626', color: 'white', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
              placeholder="새 프리셋 이름..."
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
            />
            <ActionButton primary onClick={saveCurrentAsPreset}>
               저장
            </ActionButton>
          </div>
          <PresetList>
            {presets.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#52525b', fontSize: '12px' }}>저장된 프리셋이 없습니다.</div>
            ) : (
              presets.map(p => (
                <PresetItem key={p.id} onClick={() => loadPreset(p)}>
                  <div className="info">
                    <span className="name">{p.name}</span>
                    <span className="details">{p.config.rows}행 × {p.config.cols}열 | {p.config.groups}그룹</span>
                  </div>
                  <IconButton onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }}>
                    <Trash2 size={14} />
                  </IconButton>
                </PresetItem>
              ))
            )}
          </PresetList>
        </Section>

        {/* 그리드 설정 섹션 */}
        <Section>
          <SectionTitle><Settings size={16} /> Grid Settings</SectionTitle>
          
          <TwoColumnGrid>
            <InputGroup>
              <label htmlFor="grid-rows"><LayoutGrid size={14} /> 행 (Rows)</label>
              <input id="grid-rows" type="number" value={config.rows} onChange={e => setConfig({...config, rows: parseInt(e.target.value, 10) || 0})}/>
            </InputGroup>
            <InputGroup>
              <label htmlFor="grid-cols"><LayoutGrid size={14} /> 열 (Cols)</label>
              <input id="grid-cols" type="number" value={config.cols} onChange={e => setConfig({...config, cols: parseInt(e.target.value, 10) || 0})}/>
            </InputGroup>
            <InputGroup>
              <label htmlFor="grid-groups"><Layers size={14} /> 그룹 수</label>
              <input id="grid-groups" type="number" value={config.groups} onChange={e => setConfig({...config, groups: parseInt(e.target.value, 10) || 0})}/>
            </InputGroup>
          </TwoColumnGrid>

          <TwoColumnGrid>
            <InputGroup>
              <label htmlFor="grid-margin"><Square size={14} /> 여백</label>
              <input id="grid-margin" type="number" value={config.margin} onChange={e => setConfig({...config, margin: parseInt(e.target.value, 10) || 0})}/>
            </InputGroup>
            <InputGroup>
              <label htmlFor="grid-group-gap"><Square size={14} /> 그룹 간격</label>
              <input id="grid-group-gap" type="number" value={config.groupGap} onChange={e => setConfig({...config, groupGap: parseInt(e.target.value, 10) || 0})}/>
            </InputGroup>
            <InputGroup>
              <label htmlFor="grid-col-gap"><Square size={14} /> 가로 간격</label>
              <input id="grid-col-gap" type="number" value={config.colGap} onChange={e => setConfig({...config, colGap: parseInt(e.target.value, 10) || 0})}/>
            </InputGroup>
            <InputGroup>
              <label htmlFor="grid-row-gap"><Square size={14} /> 세로 간격</label>
              <input id="grid-row-gap" type="number" value={config.rowGap} onChange={e => setConfig({...config, rowGap: parseInt(e.target.value, 10) || 0})}/>
            </InputGroup>
          </TwoColumnGrid>

          <InputGroup>
            <span className="input-label"><ArrowRight size={14} /> 그룹 배치 방향</span>
            <TabGroup>
              <TabButton id="group-direction-horizontal" type="button" active={config.groupDirection === 'horizontal'} onClick={() => setConfig({...config, groupDirection: 'horizontal'})}>
                <ArrowRight size={14} /> 가로 배치
              </TabButton>
              <TabButton type="button" active={config.groupDirection === 'vertical'} onClick={() => setConfig({...config, groupDirection: 'vertical'})}>
                <ArrowDown size={14} /> 세로 배치
              </TabButton>
            </TabGroup>
          </InputGroup>
          
          <InputGroup>
            <span className="input-label"><ListOrdered size={14} /> 번호 매기기 방향</span>
            <TabGroup>
              <TabButton id="numbering-row" type="button" active={config.numberingDirection === 'row'} onClick={() => setConfig({...config, numberingDirection: 'row'})}>
                행 우선
              </TabButton>
              <TabButton type="button" active={config.numberingDirection === 'col'} onClick={() => setConfig({...config, numberingDirection: 'col'})}>
                열 우선
              </TabButton>
            </TabGroup>
          </InputGroup>

          <InputGroup>
            <span className="input-label"><Group size={14} /> 그리드 순서</span>
            <TabGroup>
              <TabButton id="group-order-group" type="button" active={config.numberingGroupOrder === 'group'} onClick={() => setConfig({...config, numberingGroupOrder: 'group'})}>
                그룹 우선
              </TabButton>
              <TabButton type="button" active={config.numberingGroupOrder === 'all'} onClick={() => setConfig({...config, numberingGroupOrder: 'all'})}>
                전체 우선
              </TabButton>
            </TabGroup>
          </InputGroup>

          <InputGroup>
            <span className="input-label"><Crop size={14} /> Crop 방식</span>
            <TabGroup>
              <TabButton id="crop-mode-visible" type="button" active={config.cropMode === 'visible_grid'} onClick={() => setConfig({...config, cropMode: 'visible_grid'})}>
                보이는 그리드
              </TabButton>
              <TabButton type="button" active={config.cropMode === 'fixed_pixel_split'} onClick={() => setConfig({...config, cropMode: 'fixed_pixel_split'})}>
                픽셀 기준 분할
              </TabButton>
            </TabGroup>
          </InputGroup>

          {config.cropMode === 'fixed_pixel_split' && (
            <InputGroup>
              <label htmlFor="grid-patch-size"><Maximize size={14} /> 추출 크기 (px)</label>
              <input id="grid-patch-size" type="number" value={config.patchSize} onChange={e => setConfig({...config, patchSize: parseInt(e.target.value, 10) || 0})}/>
            </InputGroup>
          )}

          <TwoColumnGrid>
            <InputGroup>
              <label htmlFor="grid-start-number"><Hash size={14} /> 시작 번호</label>
              <input id="grid-start-number" type="number" value={config.startNumber || 1} onChange={e => setConfig({...config, startNumber: parseInt(e.target.value, 10) || 1})} />
            </InputGroup>
            <InputGroup>
              <label htmlFor="grid-color"><Palette size={14} /> 가이드 색상</label>
              <ColorPickerContainer>
                <input id="grid-color" type="color" value={config.gridColor} onChange={e => setConfig({...config, gridColor: e.target.value})} />
                <div className="color-info">
                  <span className="hex">{config.gridColor.toUpperCase()}</span>
                  <span className="label">Color</span>
                </div>
              </ColorPickerContainer>
            </InputGroup>
          </TwoColumnGrid>
        </Section>
        <div style={{ minHeight: '40px' }} />
      </ScrollArea>
    </SidebarContainer>
  );
}

export default Sidebar;
