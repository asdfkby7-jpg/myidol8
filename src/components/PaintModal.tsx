import React, { useRef, useState, useEffect } from 'react';
import { X, Paintbrush, PaintBucket, Eraser, RotateCcw, Upload, Download, Check, Sparkles, Image as ImageIcon, Trash2, Film } from 'lucide-react';
import { sound } from '../utils/sound';
import { isGifImage, PRESET_SAMPLE_GIFS, GifSample } from '../utils/imageUtils';

interface PaintModalProps {
  traineeName: string;
  initialImage?: string;
  onSave: (imageDataUrl: string) => void;
  onClose: () => void;
}

type ToolType = 'BRUSH' | 'BUCKET' | 'ERASER';

interface PresetColor {
  name: string;
  hex: string;
  border?: boolean;
}

const PRESET_COLORS: PresetColor[] = [
  { name: '옅은 살구색', hex: '#FFE0BD' },
  { name: '진한 살구색', hex: '#E59866' },
  { name: '검정', hex: '#000000' },
  { name: '흰색', hex: '#FFFFFF', border: true },
  { name: '빨강', hex: '#EF4444' },
  { name: '분홍', hex: '#EC4899' },
  { name: '연주황', hex: '#F97316' },
  { name: '노랑', hex: '#EAB308' },
  { name: '연두', hex: '#84CC16' },
  { name: '초록', hex: '#22C55E' },
  { name: '하늘', hex: '#06B6D4' },
  { name: '파랑', hex: '#3B82F6' },
  { name: '보라', hex: '#A855F7' },
  { name: '갈색', hex: '#78350F' },
  { name: '회색', hex: '#6B7280' },
];

export const PaintModal: React.FC<PaintModalProps> = ({
  traineeName,
  initialImage,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<ToolType>('BRUSH');
  const [color, setColor] = useState<string>('#FFE0BD'); // Default to light apricot
  const [brushSize, setBrushSize] = useState<number>(6);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  // GIF / 움짤 State
  const [activeGifUrl, setActiveGifUrl] = useState<string | null>(
    initialImage && isGifImage(initialImage) ? initialImage : null
  );
  const [isGifMode, setIsGifMode] = useState<boolean>(
    initialImage ? isGifImage(initialImage) : false
  );

  const CANVAS_SIZE = 400; // 400x400 square canvas for portrait

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Fill initial canvas with white or load initialImage
    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        // Draw image keeping ratio or centered
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        saveHistoryState();
      };
      img.src = initialImage;
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      saveHistoryState();
    }
  }, []);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setHistory(prev => [...prev.slice(-15), imageData]); // keep last 15 states
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const previousState = newHistory[newHistory.length - 1];

    const canvas = canvasRef.current;
    if (!canvas || !previousState) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
    sound.playClick();
  };

  const handleClear = () => {
    if (confirm('그림판 전체 내용을 지우시겠습니까?')) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      saveHistoryState();
      sound.playClick();
    }
  };

  // Get canvas cursor coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  // Flood Fill Algorithm for Paint Bucket (페인트붓기 기능)
  const executeFloodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = imgData.data;

    // Convert target hex color to RGBA
    const targetRgba = hexToRgba(color);

    const startPos = (startY * CANVAS_SIZE + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // Check if start color is already fill color
    if (
      Math.abs(startR - targetRgba[0]) < 10 &&
      Math.abs(startG - targetRgba[1]) < 10 &&
      Math.abs(startB - targetRgba[2]) < 10 &&
      Math.abs(startA - targetRgba[3]) < 10
    ) {
      return;
    }

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE);
    const tolerance = 40; // Tolerance for smooth fill over line boundaries

    while (queue.length > 0) {
      const [x, y] = queue.pop()!;
      if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue;

      const idx = y * CANVAS_SIZE + x;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const pos = idx * 4;
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];

      // Distance check from original clicked pixel color
      const dist =
        Math.abs(r - startR) +
        Math.abs(g - startG) +
        Math.abs(b - startB) +
        Math.abs(a - startA);

      if (dist <= tolerance) {
        data[pos] = targetRgba[0];
        data[pos + 1] = targetRgba[1];
        data[pos + 2] = targetRgba[2];
        data[pos + 3] = targetRgba[3];

        if (x > 0) queue.push([x - 1, y]);
        if (x < CANVAS_SIZE - 1) queue.push([x + 1, y]);
        if (y > 0) queue.push([x, y - 1]);
        if (y < CANVAS_SIZE - 1) queue.push([x, y + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveHistoryState();
    sound.playClick();
  };

  const hexToRgba = (hex: string): [number, number, number, number] => {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(char => char + char).join('');
    }
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
  };

  // Mouse / Touch Events
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (tool === 'BUCKET') {
      executeFloodFill(coords.x, coords.y);
      return;
    }

    setIsDrawing(true);
    setLastPos(coords);

    // Draw single point click
    draw(coords.x, coords.y, coords.x, coords.y);
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos || tool === 'BUCKET') return;
    const coords = getCanvasCoords(e);
    draw(lastPos.x, lastPos.y, coords.x, coords.y);
    setLastPos(coords);
  };

  const handleEndDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPos(null);
      saveHistoryState();
    }
  };

  const draw = (x1: number, y1: number, x2: number, y2: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'ERASER') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = brushSize * 2;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }

    ctx.stroke();
  };

  // Upload image to paint canvas or GIF player
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|gif)$/i)) {
      alert('JPG, PNG, GIF 이미지 파일만 지원됩니다.');
      return;
    }

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (isGif) {
          setActiveGifUrl(dataUrl);
          setIsGifMode(true);
          sound.playClick();
        } else {
          setActiveGifUrl(null);
          setIsGifMode(false);
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

            // Center crop / fit image to canvas
            ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            saveHistoryState();
            sound.playClick();
          };
          img.src = dataUrl;
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetGif = (sample: GifSample) => {
    setActiveGifUrl(sample.url);
    setIsGifMode(true);
    sound.playClick();
  };

  const handleConvertGifToCanvas = () => {
    if (!activeGifUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      saveHistoryState();
      setIsGifMode(false);
      sound.playClick();
    };
    img.src = activeGifUrl;
  };

  const handleSave = () => {
    if (isGifMode && activeGifUrl) {
      onSave(activeGifUrl);
      sound.playClick();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    sound.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-4 relative flex flex-col max-h-[95vh] overflow-y-auto">
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>[{traineeName}] 아이돌 연습생 그림판 & 프로필 편집</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              직접 그림을 그리거나, 이미지 파일(JPG, PNG, GIF)을 불러와 편집할 수 있습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start justify-center">
          
          {/* Canvas Box / GIF Preview */}
          <div className="flex flex-col items-center">
            {isGifMode && activeGifUrl ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="relative border-2 border-pink-500/80 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(236,72,153,0.3)] bg-slate-950 w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex items-center justify-center group">
                  <img
                    src={activeGifUrl}
                    alt="GIF 움짤 미리보기"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-lg flex items-center space-x-1 border border-white/30 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    <span>GIF 움짤 재생 중</span>
                  </div>
                </div>

                <div className="flex gap-1.5 w-full">
                  <button
                    onClick={handleConvertGifToCanvas}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-[11px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                    title="움짤 정지 화면을 캔버스로 불러와 그림을 그립니다"
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>그림판 덧칠 편집</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-white touch-none">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleMoveDraw}
                  onMouseUp={handleEndDraw}
                  onMouseLeave={handleEndDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleMoveDraw}
                  onTouchEnd={handleEndDraw}
                  className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] cursor-crosshair block"
                />
              </div>
            )}
            <span className="text-[10px] text-slate-400 mt-1.5 text-center">
              {isGifMode
                ? '🎞️ 애니메이션 GIF(움짤) 원본이 적용 가능한 상태입니다.'
                : tool === 'BUCKET'
                ? '🪣 닫힌 영역을 클릭하여 색상을 채우세요'
                : '✏️ 캔버스 위에서 드래그하여 그려보세요'}
            </span>
          </div>

          {/* Tools & Palette Control Panel */}
          <div className="flex-1 space-y-3.5 w-full">
            
            {/* Tool Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">🎨 그리기도구 선택</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setTool('BRUSH'); sound.playClick(); }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                    tool === 'BRUSH'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <Paintbrush className="w-4 h-4" />
                  <span>붓/브러시</span>
                </button>

                <button
                  onClick={() => { setTool('BUCKET'); sound.playClick(); }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                    tool === 'BUCKET'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                  title="실선으로 닫힌 영역에 한번에 색상을 채우는 페인트붓기 기능"
                >
                  <PaintBucket className="w-4 h-4" />
                  <span>페인트붓기</span>
                </button>

                <button
                  onClick={() => { setTool('ERASER'); sound.playClick(); }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                    tool === 'ERASER'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  <span>지우개</span>
                </button>
              </div>
            </div>

            {/* Brush Size Slider */}
            {tool !== 'BUCKET' && (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>선 두께 (크기)</span>
                  <span className="text-cyan-400">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>
            )}

            {/* Color Palette (Includes 옅은 살구색 & 진한 살구색) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 block">🌈 색상 팔레트</label>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400">커스텀:</span>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                    title="사용자 지정 색상 선택"
                  />
                </div>
              </div>

              {/* Special Apricot Highlight Notice */}
              <div className="flex gap-1.5 mb-2">
                <button
                  onClick={() => { setColor('#FFE0BD'); sound.playClick(); }}
                  className={`flex-1 py-1 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                    color.toUpperCase() === '#FFE0BD'
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 text-white bg-slate-800'
                      : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-black/30 inline-block" style={{ backgroundColor: '#FFE0BD' }} />
                  <span>옅은 살구색</span>
                </button>

                <button
                  onClick={() => { setColor('#E59866'); sound.playClick(); }}
                  className={`flex-1 py-1 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                    color.toUpperCase() === '#E59866'
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 text-white bg-slate-800'
                      : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-black/30 inline-block" style={{ backgroundColor: '#E59866' }} />
                  <span>진한 살구색</span>
                </button>
              </div>

              {/* Palette Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                {PRESET_COLORS.map((c) => {
                  const isActive = color.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      onClick={() => { setColor(c.hex); sound.playClick(); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition relative ${
                        c.border ? 'border border-slate-600' : ''
                      } ${isActive ? 'ring-2 ring-cyan-400 scale-110 z-10' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {isActive && (
                        <Check className={`w-4 h-4 ${['#FFFFFF', '#FFE0BD', '#EAB308'].includes(c.hex.toUpperCase()) ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preset K-POP GIF Samples */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-pink-400 mb-1.5 flex items-center space-x-1">
                <Film className="w-3.5 h-3.5 text-pink-400" />
                <span>🎞️ 추천 K-POP 아이돌 움짤(GIF) 샘플</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_SAMPLE_GIFS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectPresetGif(sample)}
                    className={`p-1.5 rounded-lg border text-left transition flex items-center space-x-2 cursor-pointer ${
                      activeGifUrl === sample.url && isGifMode
                        ? 'bg-pink-500/20 border-pink-500 ring-1 ring-pink-500'
                        : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <img src={sample.url} alt={sample.name} className="w-8 h-8 rounded shrink-0 object-cover bg-slate-950" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-slate-200 truncate">{sample.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{sample.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Actions (Undo, Clear, File Upload) */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>되돌리기</span>
              </button>

              <button
                onClick={handleClear}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-slate-700 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>전체 지우기</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-slate-700 transition cursor-pointer"
                title="기존 이미지 파일(JPG, PNG, GIF)을 불러오기"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>파일 불러오기</span>
              </button>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {isGifMode ? '* 움짤(GIF) 애니메이션 파일이 적용됩니다.' : '* 완성된 그림을 프로필 이미지로 적용할 수 있습니다.'}
          </span>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg flex items-center space-x-1.5 cursor-pointer ${
                isGifMode
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-600/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isGifMode ? 'GIF(움짤) 원본 적용하기' : '프로필 이미지 적용하기'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
