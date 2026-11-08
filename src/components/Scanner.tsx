import React, { useRef, useEffect, useState } from 'react';
import { rgbToHsv, classifyHsv, FACE_NAMES } from '../utils/colorDetector';

interface ScannerProps {
  onScanComplete: (scannedString: string) => void;
  onCancel: () => void;
}

// Scanning sequence order: U -> R -> F -> D -> L -> B
const SCAN_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];

interface StepGuide {
  targetFace: string;
  name: string;
  topColor: string;
  actionText: string;
  rotationType: 'start' | 'yaw-left' | 'pitch-up';
}

const STEP_GUIDES: StepGuide[] = [
  {
    targetFace: 'U',
    name: 'White (Up)',
    topColor: 'Green on top',
    actionText: 'Face White toward camera, Green on top',
    rotationType: 'start'
  },
  {
    targetFace: 'R',
    name: 'Red (Right)',
    topColor: 'Green on top',
    actionText: 'Roll entire cube 90° to the LEFT (like turning a globe)',
    rotationType: 'yaw-left'
  },
  {
    targetFace: 'F',
    name: 'Green (Front)',
    topColor: 'White on top',
    actionText: 'Roll entire cube 90° to the LEFT again',
    rotationType: 'yaw-left'
  },
  {
    targetFace: 'D',
    name: 'Yellow (Down)',
    topColor: 'Green on top',
    actionText: 'Tilt entire cube 90° UPWARD (bottom face up to camera)',
    rotationType: 'pitch-up'
  },
  {
    targetFace: 'L',
    name: 'Orange (Left)',
    topColor: 'White on top',
    actionText: 'Roll entire cube 90° to the LEFT',
    rotationType: 'yaw-left'
  },
  {
    targetFace: 'B',
    name: 'Blue (Back)',
    topColor: 'White on top',
    actionText: 'Roll entire cube 90° to the LEFT',
    rotationType: 'yaw-left'
  }
];

export default function Scanner({ onScanComplete, onCancel }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [scannedFaces, setScannedFaces] = useState<Record<string, string[]>>({});
  const [cameraError, setCameraError] = useState<string | null>(null);

  const currentStep = STEP_GUIDES[currentStepIndex];
  const currentFaceInfo = FACE_NAMES[currentStep.targetFace];

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 640 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setCameraError('Camera access denied or unavailable. Please enable permissions.');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureCurrentFace = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    if (size === 0) return;

    canvas.width = size;
    canvas.height = size;

    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const cellSize = size / 3;
    const detected: string[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const centerX = Math.floor(col * cellSize + cellSize / 2);
        const centerY = Math.floor(row * cellSize + cellSize / 2);

        const imgData = ctx.getImageData(centerX - 1, centerY - 1, 3, 3).data;
        let r = 0, g = 0, b = 0;
        const totalPixels = 9;

        for (let i = 0; i < imgData.length; i += 4) {
          r += imgData[i];
          g += imgData[i + 1];
          b += imgData[i + 2];
        }

        r = Math.round(r / totalPixels);
        g = Math.round(g / totalPixels);
        b = Math.round(b / totalPixels);

        // Lock center sticker to current step's expected face
        if (row === 1 && col === 1) {
          detected.push(currentStep.targetFace);
        } else {
          const [h, s, v] = rgbToHsv(r, g, b);
          detected.push(classifyHsv(h, s, v));
        }
      }
    }

    const updatedScans = { ...scannedFaces, [currentStep.targetFace]: detected };
    setScannedFaces(updatedScans);

    if (currentStepIndex + 1 >= STEP_GUIDES.length) {
      const full54String = SCAN_ORDER.map((f) => (updatedScans[f] || []).join('')).join('');
      onScanComplete(full54String);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Top Banner Guide */}
      <div className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center shadow">
        <div>
          <span className="text-xs text-slate-400 block font-semibold">
            Face {currentStepIndex + 1} of 6 • {currentStep.topColor}
          </span>
          <h2 className={`text-lg font-bold ${currentFaceInfo.color}`}>
            Scanning: {currentStep.name}
          </h2>
        </div>
        <div
          className="w-8 h-8 rounded-lg border-2 border-slate-600 shadow"
          style={{ backgroundColor: currentFaceInfo.sampleHex }}
        />
      </div>

      {/* Rotation Instruction Box */}
      <div className="w-full bg-slate-950/80 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 flex items-center justify-between">
        <div>
          <span className="text-emerald-400 font-bold block mb-0.5">Physical Movement:</span>
          <span>{currentStep.actionText}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {currentStep.rotationType === 'yaw-left' ? 'Horizontal Roll' : currentStep.rotationType === 'pitch-up' ? 'Vertical Tilt' : 'Hold Steady'}
          </span>
        </div>
      </div>

      {/* Camera Viewport with 3D Orbital Trajectory Reticle */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden bg-black border-2 border-slate-700 shadow-2xl flex items-center justify-center">
        {cameraError ? (
          <p className="p-4 text-center text-xs text-red-400">{cameraError}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* 3x3 Grid Overlay */}
            <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-2 pointer-events-none z-10">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg flex items-center justify-center ${
                    idx === 4
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-white/40 bg-white/5'
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
                </div>
              ))}
            </div>

            {/* 3D Isometric Curved Arrow Overlay */}
            {currentStep.rotationType === 'yaw-left' && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <svg className="w-48 h-48 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                    <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
                    </marker>
                  </defs>
                  {/* Elliptical 3D orbit around the cube */}
                  <ellipse cx="100" cy="100" rx="85" ry="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" transform="rotate(-10 100 100)" />
                  <path
                    d="M 180 90 A 85 30 0 0 0 25 105"
                    fill="none"
                    stroke="url(#curveGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    markerEnd="url(#arrowHead)"
                    className="animate-pulse"
                  />
                  <text x="100" y="150" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    Roll body 90° Left ➔
                  </text>
                </svg>
              </div>
            )}

            {currentStep.rotationType === 'pitch-up' && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <svg className="w-48 h-48 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="upGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <marker id="arrowUpHead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
                    </marker>
                  </defs>
                  {/* Vertical 3D loop */}
                  <ellipse cx="100" cy="100" rx="32" ry="85" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
                  <path
                    d="M 100 180 A 30 85 0 0 0 100 25"
                    fill="none"
                    stroke="url(#upGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    markerEnd="url(#arrowUpHead)"
                    className="animate-pulse"
                  />
                  <text x="100" y="105" textAnchor="middle" fill="#eab308" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    Tilt Bottom Upwards ⬆
                  </text>
                </svg>
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Capture Actions */}
      <div className="flex w-full gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={captureCurrentFace}
          disabled={!!cameraError}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition shadow cursor-pointer"
        >
          {currentStepIndex === STEP_GUIDES.length - 1 ? 'Finish Scan' : 'Capture Face'}
        </button>
      </div>

      {/* Completed Faces Indicator */}
      <div className="flex gap-2">
        {SCAN_ORDER.map((face, idx) => (
          <div
            key={face}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border transition-colors ${
              scannedFaces[face]
                ? 'bg-emerald-600/40 border-emerald-500 text-emerald-300'
                : idx === currentStepIndex
                ? 'bg-slate-700 border-white text-white'
                : 'bg-slate-900 border-slate-800 text-slate-600'
            }`}
          >
            {face}
          </div>
        ))}
      </div>
    </div>
  );
}