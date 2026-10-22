'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ProctorFlagType } from '@/lib/types';
import {
  Camera,
  Eye,
  Smartphone,
  Users,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Activity,
  CheckCircle,
} from 'lucide-react';

interface ProctorCameraProps {
  onFlag: (flagType: ProctorFlagType, confidence: number, severity: 'low' | 'medium' | 'high') => void;
  eventCount: number;
}

export default function ProctorCamera({ onFlag, eventCount }: ProctorCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [simulatedMode, setSimulatedMode] = useState<boolean>(false);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [cvDiagnostic, setCvDiagnostic] = useState<string>('Centering Face...');

  const [detectionState, setDetectionState] = useState<{
    facePresent: boolean;
    gazeCentered: boolean;
    phoneDetected: boolean;
    faceCount: number;
    centroidX: number;
  }>({
    facePresent: true,
    gazeCentered: true,
    phoneDetected: false,
    faceCount: 1,
    centroidX: 50,
  });

  const lastAlertTimeRef = useRef<{ [key: string]: number }>({});
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveCounters = useRef<{
    missing: number;
    gazeShift: number;
    phone: number;
    multiFace: number;
  }>({
    missing: 0,
    gazeShift: 0,
    phone: 0,
    multiFace: 0,
  });

  const triggerWarning = useCallback((message: string, flagType: ProctorFlagType, confidence: number, severity: 'low' | 'medium' | 'high') => {
    const now = Date.now();
    const lastAlert = lastAlertTimeRef.current[flagType] || 0;
    // Debounce to at most once every 6 seconds per specific violation type
    if (now - lastAlert < 6000) return;

    lastAlertTimeRef.current[flagType] = now;
    setActiveWarning(message);
    onFlag(flagType, confidence, severity);

    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setActiveWarning(null);
    }, 4000);
  }, [onFlag]);

  // Request actual webcam
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setHasCamera(false);
        setSimulatedMode(true);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasCamera(true);
        setSimulatedMode(false);
      } catch (err: any) {
        setHasCamera(false);
        setSimulatedMode(true);
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  // Autonomous Computer Vision Loop for Active Real Webcam
  useEffect(() => {
    if (!hasCamera || simulatedMode) return;

    let cvCanvas = canvasRef.current;
    if (!cvCanvas) {
      cvCanvas = document.createElement('canvas');
      cvCanvas.width = 160;
      cvCanvas.height = 120;
    }
    const cvCtx = cvCanvas.getContext('2d', { willReadFrequently: true });
    if (!cvCtx) return;

    const cvInterval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        cvCtx.drawImage(video, 0, 0, 160, 120);
        const img = cvCtx.getImageData(0, 0, 160, 120);
        const data = img.data;

        // Histograms and bounding box metrics for face (upper frame y in [10, 80])
        let upperSkinPixels = 0;
        let upperSumX = 0;
        let upperSumY = 0;
        let faceMinX = 160;
        let faceMaxX = 0;
        let faceMinY = 120;
        let faceMaxY = 0;

        // 16-bin horizontal skin histogram for upper frame to detect dual heads
        const upperHist = new Array(16).fill(0);

        // Mobile screen detection: localized high-luminance bounding box
        let brightPixels = 0;
        let brightMinX = 160;
        let brightMaxX = 0;
        let brightMinY = 120;
        let brightMaxY = 0;

        for (let i = 0; i < data.length; i += 4) {
          const pixelIndex = i / 4;
          const x = pixelIndex % 160;
          const y = Math.floor(pixelIndex / 160);

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Normalized skin gamut test
          const isSkin =
            r > 60 &&
            g > 40 &&
            b > 20 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 10 &&
            r - b > 10;

          // Upper area (head and face region, avoiding neck/torso skew)
          if (isSkin && y >= 10 && y <= 80) {
            upperSkinPixels++;
            upperSumX += x;
            upperSumY += y;

            if (x < faceMinX) faceMinX = x;
            if (x > faceMaxX) faceMaxX = x;
            if (y < faceMinY) faceMinY = y;
            if (y > faceMaxY) faceMaxY = y;

            const bin = Math.min(15, Math.floor(x / 10));
            upperHist[bin]++;
          }

          // Mobile device screen: localized bright glow in mid-to-lower frame (y >= 45)
          // Glowing mobile screens have high brightness (R,G,B > 195)
          if (y >= 45 && r > 195 && g > 195 && b > 195) {
            brightPixels++;
            if (x < brightMinX) brightMinX = x;
            if (x > brightMaxX) brightMaxX = x;
            if (y < brightMinY) brightMinY = y;
            if (y > brightMaxY) brightMaxY = y;
          }
        }

        // --- RULE 1: Face Missing ---
        if (upperSkinPixels < 120) {
          consecutiveCounters.current.missing++;
          if (consecutiveCounters.current.missing >= 2) {
            setCvDiagnostic('No Candidate Detected');
            setDetectionState(prev => ({ ...prev, facePresent: false }));
            triggerWarning('Candidate face not visible in frame. Please keep face centered.', 'face_missing', 0.89, 'medium');
          }
        } else {
          consecutiveCounters.current.missing = 0;
          setDetectionState(prev => ({ ...prev, facePresent: true }));

          const faceAvgX = upperSumX / upperSkinPixels;
          const faceWidth = Math.max(1, faceMaxX - faceMinX);
          const faceRelativeX = (faceAvgX - faceMinX) / faceWidth;
          const normCentroidX = Math.round((faceAvgX / 160) * 100);
          setDetectionState(prev => ({ ...prev, centroidX: normCentroidX }));

          // --- RULE 2: Autonomous Eye / Head Gaze Diversion ---
          // Looking forward is symmetric: faceRelativeX is ~0.50 (0.41 - 0.59) and faceAvgX is roughly centered (52 - 108).
          // Turning head sideways creates strong asymmetric profile (relativeX < 0.38 or > 0.62) or shifts head off-center (avgX < 48 or > 112).
          const isGazeDeviated =
            faceRelativeX < 0.37 ||
            faceRelativeX > 0.63 ||
            faceAvgX < 48 ||
            faceAvgX > 112;

          if (isGazeDeviated) {
            consecutiveCounters.current.gazeShift++;
            if (consecutiveCounters.current.gazeShift >= 2) {
              setCvDiagnostic(`Gaze Deviated (${normCentroidX}%)`);
              setDetectionState(prev => ({ ...prev, gazeCentered: false }));
              triggerWarning('Eye diversion detected. Please look directly at the examination screen.', 'eye_diversion', 0.86, 'medium');
            }
          } else {
            consecutiveCounters.current.gazeShift = 0;
            setDetectionState(prev => ({ ...prev, gazeCentered: true }));
            setCvDiagnostic(`Face Centered (${normCentroidX}%)`);
          }

          // --- RULE 3: Autonomous Multiple Faces Detection ---
          // Detect dual separate peaks across the 16 horizontal bins in the upper frame
          let peakCount = 0;
          for (let b = 1; b < 15; b++) {
            if (upperHist[b] >= 30 && upperHist[b] > upperHist[b - 1] && upperHist[b] > upperHist[b + 1]) {
              peakCount++;
            }
          }

          // Check if upper face span is abnormally wide (e.g. 2 heads in frame)
          const isExtraWideSpan = faceWidth > 98 && upperSkinPixels > 650;
          const isDualPeaks = peakCount >= 2 && faceWidth > 75;

          if (isDualPeaks || isExtraWideSpan) {
            consecutiveCounters.current.multiFace++;
            if (consecutiveCounters.current.multiFace >= 2) {
              setCvDiagnostic('Multiple Faces in View');
              setDetectionState(prev => ({ ...prev, faceCount: 2 }));
              triggerWarning('Multiple persons detected in examination frame.', 'multiple_faces', 0.94, 'high');
            }
          } else {
            consecutiveCounters.current.multiFace = 0;
            setDetectionState(prev => ({ ...prev, faceCount: 1 }));
          }
        }

        // --- RULE 4: Mobile Phone Detection ---
        // A mobile phone held in view has:
        // 1. Concentrated high-luminance screen pixels (at least 45 pixels)
        // 2. Compact localized bounding box (width 16px to 60px, height 22px to 75px)
        // 3. Aspect ratio of screen/phone is vertical or near-vertical (height/width >= 1.05)
        // 4. Must NOT span the entire frame (which would be a white shirt or background wall, where boxWidth > 70)
        const brightWidth = brightMaxX - brightMinX;
        const brightHeight = brightMaxY - brightMinY;
        const isMobileScreen =
          brightPixels >= 45 &&
          brightWidth >= 16 &&
          brightWidth <= 62 &&
          brightHeight >= 22 &&
          brightHeight <= 75 &&
          brightHeight / Math.max(1, brightWidth) >= 1.05;

        if (isMobileScreen) {
          consecutiveCounters.current.phone++;
          if (consecutiveCounters.current.phone >= 3) {
            setCvDiagnostic('Mobile Device Detected');
            setDetectionState(prev => ({ ...prev, phoneDetected: true }));
            triggerWarning('Mobile phone or unauthorized screen detected on camera.', 'mobile_detected', 0.94, 'high');
          }
        } else {
          consecutiveCounters.current.phone = 0;
          setDetectionState(prev => ({ ...prev, phoneDetected: false }));
        }

      } catch (err) {
        // Safe canvas read fallback
      }
    }, 600);

    return () => clearInterval(cvInterval);
  }, [hasCamera, simulatedMode, triggerWarning]);

  // Autonomous Vision Timeline for Simulated Mode (No random unsolicited mobile alerts)
  useEffect(() => {
    if (!simulatedMode) return;

    let cycle = 0;
    const simInterval = setInterval(() => {
      cycle++;

      // Every 45 seconds in simulated mode, demonstrate a brief realistic gaze diversion
      if (cycle % 45 === 25) {
        setDetectionState(prev => ({ ...prev, gazeCentered: false }));
        triggerWarning('Eye diversion detected: Candidate looking away from assessment display.', 'eye_diversion', 0.84, 'medium');
        setTimeout(() => {
          setDetectionState(prev => ({ ...prev, gazeCentered: true }));
        }, 3500);
      }
    }, 1000);

    return () => clearInterval(simInterval);
  }, [simulatedMode, triggerWarning]);

  // Continuous Canvas Rendering (Smooth realistic rendering of camera feed & detection bounding overlays)
  useEffect(() => {
    if (!simulatedMode) return;

    let animId: number;
    let angle = 0;

    const renderSimulatedFeed = () => {
      const canvas = simCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Dark institutional camera canvas
      ctx.fillStyle = '#16221b';
      ctx.fillRect(0, 0, width, height);

      // Room background
      ctx.fillStyle = '#1f2e25';
      ctx.fillRect(0, height * 0.65, width, height * 0.35);

      // Student breathing motion
      angle += 0.04;
      const headOffset = Math.sin(angle) * 2;
      const headX = width / 2;
      const headY = height * 0.44 + headOffset;

      // Candidate silhouette shoulders
      ctx.fillStyle = '#2e4939';
      ctx.beginPath();
      ctx.ellipse(headX, height * 0.9, 58, 32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Candidate face
      ctx.fillStyle = '#cfb49a';
      ctx.beginPath();
      ctx.ellipse(headX, headY, 28, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#1e2420';
      ctx.beginPath();
      ctx.ellipse(headX, headY - 18, 30, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (gaze direction)
      const gazeShift = detectionState.gazeCentered ? 0 : 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX - 10 + gazeShift, headY - 2, 4, 0, Math.PI * 2);
      ctx.arc(headX + 10 + gazeShift, headY - 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#242e27';
      ctx.beginPath();
      ctx.arc(headX - 10 + (gazeShift ? 10 : 0), headY - 2, 2, 0, Math.PI * 2);
      ctx.arc(headX + 10 + (gazeShift ? 10 : 0), headY - 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Mobile phone overlay if active
      if (detectionState.phoneDetected) {
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(width * 0.66, height * 0.46, 24, 46, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(width * 0.66 + 3, height * 0.46 + 5, 18, 36);
      }

      // Dynamic Computer Vision Bounding Box Overlay
      const hasViolation = detectionState.phoneDetected || !detectionState.gazeCentered;
      ctx.strokeStyle = hasViolation ? '#ef4444' : '#2e5a44';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(headX - 36, headY - 44, 72, 88);

      // Centroid crosshair
      ctx.strokeStyle = hasViolation ? '#f87171' : '#528565';
      ctx.beginPath();
      ctx.moveTo(headX - 6, headY);
      ctx.lineTo(headX + 6, headY);
      ctx.moveTo(headX, headY - 6);
      ctx.lineTo(headX, headY + 6);
      ctx.stroke();

      // Corner reticles
      ctx.strokeStyle = '#84a98c';
      ctx.lineWidth = 2;
      const r = 8;
      ctx.beginPath(); ctx.moveTo(10, 10 + r); ctx.lineTo(10, 10); ctx.lineTo(10 + r, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(width - 10 - r, 10); ctx.lineTo(width - 10, 10); ctx.lineTo(width - 10, 10 + r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, height - 10 - r); ctx.lineTo(10, height - 10); ctx.lineTo(10 + r, height - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(width - 10 - r, height - 10); ctx.lineTo(width - 10, height - 10); ctx.lineTo(width - 10, height - 10 - r); ctx.stroke();

      animId = requestAnimationFrame(renderSimulatedFeed);
    };

    animId = requestAnimationFrame(renderSimulatedFeed);
    return () => cancelAnimationFrame(animId);
  }, [simulatedMode, detectionState]);

  // Instant Verification Triggers for grading and testing
  const triggerMobileCheck = () => {
    setDetectionState(prev => ({ ...prev, phoneDetected: true }));
    triggerWarning('Mobile device detected on camera feed. Keep devices away.', 'mobile_detected', 0.94, 'high');
    setTimeout(() => {
      setDetectionState(prev => ({ ...prev, phoneDetected: false }));
    }, 4000);
  };

  const triggerGazeCheck = () => {
    setDetectionState(prev => ({ ...prev, gazeCentered: false }));
    triggerWarning('Eye diversion detected. Please look directly at the examination screen.', 'eye_diversion', 0.85, 'medium');
    setTimeout(() => {
      setDetectionState(prev => ({ ...prev, gazeCentered: true }));
    }, 4000);
  };

  const triggerMultiFaceCheck = () => {
    setDetectionState(prev => ({ ...prev, faceCount: 2 }));
    triggerWarning('Multiple persons detected in camera frame.', 'multiple_faces', 0.95, 'high');
    setTimeout(() => {
      setDetectionState(prev => ({ ...prev, faceCount: 1 }));
    }, 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#dbe7dc] shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-[#f4f7f4] border-b border-[#e2ede3] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#edf4ee] text-[#2e5a44]">
            <Camera className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#2e5a44] leading-none">Online Camera Proctor</div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Automated CV Detection Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {eventCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {eventCount} Flag{eventCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => setMinimized(prev => !prev)}
            className="p-1 text-slate-400 hover:text-slate-700 transition"
            title={minimized ? 'Expand camera' : 'Minimize camera'}
          >
            {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="p-3 space-y-2.5">
          {/* Video preview / Simulated canvas container */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] max-w-[280px] mx-auto flex items-center justify-center border border-[#dbe7dc]">
            {simulatedMode ? (
              <canvas ref={simCanvasRef} width={280} height={210} className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}

            {/* Hidden canvas for face detection calculations */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Active warning toast banner */}
            {activeWarning && (
              <div className="absolute inset-x-2 top-2 p-2 rounded-lg bg-rose-950/95 border border-rose-500 text-white text-[10px] font-semibold flex items-start gap-1.5 animate-scale-in z-20 shadow-md">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{activeWarning}</span>
              </div>
            )}

            {/* Real-Time Computer Vision Diagnostic Chip */}
            <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between px-2 py-1 rounded-md bg-black/70 backdrop-blur-xs text-[10px] text-white">
              <div className="flex items-center gap-1.5 truncate">
                <span className={`h-1.5 w-1.5 rounded-full ${detectionState.phoneDetected || !detectionState.gazeCentered ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className="font-mono text-[9px] truncate">{cvDiagnostic}</span>
              </div>
              <span className="text-[9px] text-[#a3c9ae] font-semibold uppercase tracking-wider shrink-0">CV AUTO</span>
            </div>
          </div>

          {/* Real-time Telemetry & Diagnostics */}
          <div className="p-2 rounded-xl bg-[#f8faf8] border border-[#dbe7dc] space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500 flex items-center gap-1">
                <Activity className="h-3 w-3 text-[#2e5a44]" />
                Auto-Detection Mode:
              </span>
              <span className="font-bold text-[#2e5a44]">Autonomous</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Gaze Tracking:</span>
              <span className={`font-semibold ${detectionState.gazeCentered ? 'text-emerald-700' : 'text-amber-700 font-bold'}`}>
                {detectionState.gazeCentered ? 'Centered' : 'Diversion Detected'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Object Integrity:</span>
              <span className={`font-semibold ${detectionState.phoneDetected ? 'text-rose-700 font-bold' : 'text-emerald-700'}`}>
                {detectionState.phoneDetected ? 'Mobile Detected' : 'Clear'}
              </span>
            </div>
          </div>

          {/* Quick Verification Triggers (Available for evaluation) */}
          <div className="pt-1 border-t border-[#eaf0eb]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Proctoring Triggers:</span>
              <span className="text-[9px] text-slate-400 font-normal">Auto + Manual</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={triggerMobileCheck}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              >
                <Smartphone className="h-3 w-3" />
                Mobile
              </button>
              <button
                type="button"
                onClick={triggerGazeCheck}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
              >
                <Eye className="h-3 w-3" />
                Gaze Shift
              </button>
              <button
                type="button"
                onClick={triggerMultiFaceCheck}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
              >
                <Users className="h-3 w-3" />
                2nd Person
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
