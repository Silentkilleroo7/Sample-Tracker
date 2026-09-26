import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  SampleItem,
  STAGE_CONFIG,
  getSampleImage,
  PRESET_STYLE_IMAGES,
} from '../types/sample';
import { uploadStylePhoto } from '../lib/supabase';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  Move,
  Check,
  Layers,
} from 'lucide-react';

interface ImageZoomContextValue {
  openZoom: (sample: SampleItem, initialImageUrl?: string, startZoomed?: boolean) => void;
  closeZoom: () => void;
}

const ImageZoomContext = createContext<ImageZoomContextValue>({
  openZoom: () => {},
  closeZoom: () => {},
});

export const useImageZoom = () => useContext(ImageZoomContext);

interface ImageZoomProviderProps {
  children: React.ReactNode;
  onUpdateSampleThumbnail?: (sampleId: string, newThumbnail: string, additionalImages?: string[]) => void;
}

export const ImageZoomProvider: React.FC<ImageZoomProviderProps> = ({
  children,
  onUpdateSampleThumbnail,
}) => {
  const [activeSample, setActiveSample] = useState<SampleItem | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [justUpdatedPhoto, setJustUpdatedPhoto] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const openZoom = (sample: SampleItem, initialImageUrl?: string, startZoomed = true) => {
    const primary = getSampleImage(sample);
    const extra = sample.images || [];
    // Build unique gallery of images for this style
    const uniqueUrls = Array.from(new Set([primary, ...extra].filter(Boolean)));
    // Ensure at least 2 angles in the gallery so the user can inspect multiple views
    if (uniqueUrls.length === 1) {
      const altPreset =
        PRESET_STYLE_IMAGES.find((p) => p.url !== uniqueUrls[0])?.url ||
        PRESET_STYLE_IMAGES[0].url;
      uniqueUrls.push(altPreset);
    }

    const startIdx = initialImageUrl ? Math.max(0, uniqueUrls.indexOf(initialImageUrl)) : 0;
    setActiveSample(sample);
    setGallery(uniqueUrls);
    setSelectedIndex(startIdx);
    setScale(startZoomed ? 2.2 : 1);
    setPosition({ x: 0, y: 0 });
  };

  const closeZoom = () => {
    setActiveSample(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard shortcuts (Escape, +, -, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!activeSample) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom();
      if (e.key === '+' || e.key === '=') {
        setScale((s) => Math.min(4, +(s + 0.5).toFixed(2)));
      }
      if (e.key === '-') {
        setScale((s) => {
          const next = Math.max(1, +(s - 0.5).toFixed(2));
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
      if (e.key === 'ArrowRight') {
        setSelectedIndex((idx) => (idx + 1) % gallery.length);
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((idx) => (idx - 1 + gallery.length) % gallery.length);
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSample, gallery.length]);

  // Double-click inside the zoom viewer cycles zoom levels centered on cursor!
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - (rect.left + rect.width / 2);
    const clickY = e.clientY - (rect.top + rect.height / 2);

    if (scale === 1) {
      setScale(2.25);
      setPosition({ x: -clickX * 0.85, y: -clickY * 0.85 });
    } else if (scale < 3.2) {
      setScale(3.5);
      setPosition({ x: -clickX * 1.4, y: -clickY * 1.4 });
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setScale((prev) => {
      const next = Math.min(4, Math.max(1, +(prev + delta).toFixed(2)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleUploadNewPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeSample) return;

    setIsUploadingPhoto(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadStylePhoto(files[i], {
          sampleId: activeSample.id,
          styleCode: activeSample.styleCode,
        });
        if (result.url) {
          uploadedUrls.push(result.url);
        }
      }

      if (uploadedUrls.length > 0) {
        const nextGallery = Array.from(new Set([...uploadedUrls, ...gallery]));
        setGallery(nextGallery);
        setSelectedIndex(0);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        onUpdateSampleThumbnail?.(activeSample.id, uploadedUrls[0], nextGallery);
        setJustUpdatedPhoto(true);
        setTimeout(() => setJustUpdatedPhoto(false), 2500);
      }
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <ImageZoomContext.Provider value={{ openZoom, closeZoom }}>
      {children}

      {/* Full-Screen High-Resolution Product Zoom Modal */}
      {activeSample && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-150 print:hidden"
          onClick={closeZoom}
        >
          {/* Top Inspector Bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-900/95 border-b border-slate-800 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono font-black text-indigo-400 px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500/40 text-xs shrink-0">
                {activeSample.styleCode}
              </span>
              <div className="truncate">
                <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                  <span>{activeSample.styleName}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      STAGE_CONFIG[activeSample.stage].badgeBg
                    }`}
                  >
                    {STAGE_CONFIG[activeSample.stage].badgeText}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Buyer: <strong className="text-slate-200">{activeSample.buyer}</strong> • PO:{' '}
                  <span className="font-mono text-slate-300">{activeSample.poNumber}</span> • Color:{' '}
                  <span className="text-slate-200">{activeSample.color}</span> • Fabric:{' '}
                  <span className="font-mono text-indigo-300">{activeSample.fabricCode}</span>
                </div>
              </div>
            </div>

            {/* Interactive Zoom Controls */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Double-click picture to toggle zoom (1x → 2.25x → 3.5x)</span>
              </div>

              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => {
                  setScale((s) => {
                    const next = Math.max(1, +(s - 0.5).toFixed(2));
                    if (next === 1) setPosition({ x: 0, y: 0 });
                    return next;
                  });
                }}
                disabled={scale <= 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Zoom Level Indicator / Quick Cycle */}
              <button
                type="button"
                onClick={() => {
                  if (scale === 1) setScale(2.25);
                  else if (scale < 3.2) setScale(3.5);
                  else {
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 font-mono font-bold text-xs min-w-[68px] text-center cursor-pointer hover:bg-indigo-600/50 transition-colors"
                title="Click to cycle zoom magnification"
              >
                {Math.round(scale * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(4, +(s + 0.5).toFixed(2)))}
                disabled={scale >= 4}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Reset View */}
              <button
                type="button"
                onClick={() => {
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              {/* Upload New Product Photo */}
              <label className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer">
                {isUploadingPhoto ? (
                  <>
                    <Upload className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
                    <span>Uploading...</span>
                  </>
                ) : justUpdatedPhoto ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Photo Saved!</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Upload Product Photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadNewPhoto}
                  className="hidden"
                />
              </label>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeZoom}
                className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 transition-colors cursor-pointer ml-1"
                title="Close Zoom Inspector (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Interactive Zoom Canvas */}
          <div
            ref={containerRef}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleCanvasDoubleClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative flex-1 overflow-hidden flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black ${
              scale > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in'
            }`}
          >
            {/* Previous Image Button */}
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((idx) => (idx - 1 + gallery.length) % gallery.length);
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="absolute left-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white border border-slate-700 shadow-xl transition-all cursor-pointer"
                title="Previous Angle"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Zoomable Product Image */}
            <img
              src={gallery[selectedIndex]}
              alt={`${activeSample.styleName} - View ${selectedIndex + 1}`}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1)',
              }}
              className="max-h-[75vh] max-w-[88vw] object-contain rounded-xl shadow-2xl border border-white/10"
            />

            {/* Next Image Button */}
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((idx) => (idx + 1) % gallery.length);
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="absolute right-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white border border-slate-700 shadow-xl transition-all cursor-pointer"
                title="Next Angle"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Floating Helper Overlay at Bottom of Canvas */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-3 shadow-xl pointer-events-none">
              <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                <ZoomIn className="w-3.5 h-3.5" />
                Double-click image to {scale > 1 ? 'zoom deeper or reset' : 'zoom in (2.25x)'}
              </span>
              {scale > 1 && (
                <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <Move className="w-3.5 h-3.5" />
                  Drag to pan around garment details
                </span>
              )}
            </div>
          </div>

          {/* Bottom Multi-Angle Thumbnail Strip & Garment Spec Summary */}
          <div
            className="px-4 sm:px-6 py-3 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Product Views ({gallery.length}):
              </span>
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`relative w-12 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedIndex === idx
                      ? 'border-indigo-400 scale-105 shadow-md shadow-indigo-500/30'
                      : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Angle ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono text-white text-center">
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Zoom Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] mr-1">Magnification:</span>
              {[1, 1.75, 2.5, 3.5].map((presetScale) => (
                <button
                  key={presetScale}
                  type="button"
                  onClick={() => {
                    setScale(presetScale);
                    if (presetScale === 1) setPosition({ x: 0, y: 0 });
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    Math.abs(scale - presetScale) < 0.15
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {presetScale}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ImageZoomContext.Provider>
  );
};

interface StyleProductImageProps {
  sample: SampleItem;
  className?: string;
  imgClassName?: string;
  showBadge?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'banner';
}

/**
 * Reusable Product Picture component for any Style.
 * Double-clicking on the picture immediately opens the high-resolution Zoom Inspector.
 */
export const StyleProductImage: React.FC<StyleProductImageProps> = ({
  sample,
  className = '',
  imgClassName = '',
  showBadge = true,
  size = 'md',
}) => {
  const { openZoom } = useImageZoom();
  const imageUrl = getSampleImage(sample);

  const sizeClasses: Record<string, string> = {
    xs: 'w-9 h-11 rounded-lg',
    sm: 'w-11 h-14 rounded-lg',
    md: 'w-14 h-16 rounded-xl',
    lg: 'w-20 h-24 rounded-xl',
    banner: 'w-full h-28 rounded-xl',
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openZoom(sample, imageUrl, true);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        // Prevent single click on the zoom badge from triggering parent card navigation if user clicks the lens icon
      }}
      title={`Double-click picture to zoom "${sample.styleName}" (${sample.styleCode})`}
      className={`relative overflow-hidden bg-slate-900 border border-slate-700/80 hover:border-indigo-400 transition-all group/img select-none cursor-zoom-in shrink-0 shadow-sm ${sizeClasses[size]} ${className}`}
    >
      <img
        src={imageUrl}
        alt={`${sample.styleCode} - ${sample.styleName}`}
        className={`w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300 ${imgClassName}`}
        draggable={false}
      />

      {/* Subtle hover overlay indicating Double-Click to Zoom */}
      {showBadge && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-end p-1 pointer-events-none">
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-600/95 text-white text-[8px] font-bold tracking-tight shadow">
            <ZoomIn className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">2× Click Zoom</span>
          </div>
        </div>
      )}

      {/* Corner mini zoom indicator icon */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openZoom(sample, imageUrl, true);
        }}
        title="Click or Double-Click picture to Zoom"
        className="absolute bottom-1 right-1 w-4 h-4 rounded bg-black/70 text-indigo-300 hover:bg-indigo-600 hover:text-white flex items-center justify-center opacity-80 group-hover/img:opacity-100 transition-all cursor-pointer"
      >
        <Maximize2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};
