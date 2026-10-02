import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SpacePoints3D, SolvedProblemBlueprint, UnitPreference } from '../types/engineering';
import { formatLength } from '../utils/engineeringGeometry';
import {
  Rotate3d,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';

interface SpatialView3DProps {
  blueprint: SolvedProblemBlueprint;
  unit?: UnitPreference;
}

export const SpatialView3D: React.FC<SpatialView3DProps> = ({ blueprint, unit = 'mm' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [unfoldAngle, setUnfoldAngle] = useState(0); // 0 to 90 degrees
  const [isAutoUnfolding, setIsAutoUnfolding] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFoldShrunk, setIsFoldShrunk] = useState(false);
  const hpGroupRef = useRef<THREE.Group | null>(null);

  const { space3D, parsed_parameters, calculated_answers } = blueprint;

  // Dedicated function to request full-screen mode on the 3D canvas container element to hide all sidebars and UI
  const requestFullscreenMode = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    }
    setIsFullscreen(true);
  }, []);

  // Dedicated handler to exit full-screen mode
  const exitFullscreenMode = useCallback(() => {
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
    setIsFullscreen(false);
  }, []);

  // Listen to ESC key press and native fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      const isNativeFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isNativeFs);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreenMode();
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreenMode]);

  // Trigger window resize event when fullscreen state changes so Three.js camera & renderer adapt
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 80);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(160, 140, 220);
    camera.lookAt(40, 30, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(120, 200, 150);
    scene.add(dirLight);

    // 3. Static Elements: Vertical Plane (VP)
    // VP is in the X-Y plane (Z = 0, Y >= 0)
    const vpWidth = 240;
    const vpHeight = 160;

    const vpGeo = new THREE.PlaneGeometry(vpWidth, vpHeight);
    const vpMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const vpMesh = new THREE.Mesh(vpGeo, vpMat);
    vpMesh.position.set(vpWidth / 2 - 20, vpHeight / 2, 0);
    scene.add(vpMesh);

    // VP Wireframe Grid
    const vpGrid = new THREE.GridHelper(vpWidth, 12, 0x38bdf8, 0x334155);
    vpGrid.rotation.x = Math.PI / 2;
    vpGrid.position.set(vpWidth / 2 - 20, vpHeight / 2, 0);
    scene.add(vpGrid);

    // 4. Reference XY Line
    const xyLineMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 3 });
    const xyLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-30, 0, 0),
      new THREE.Vector3(vpWidth, 0, 0),
    ]);
    const xyLine = new THREE.Line(xyLineGeo, xyLineMat);
    scene.add(xyLine);

    // 5. Dynamic Horizontal Plane (HP) Group (Hinged at Z=0 along XY line)
    // HP is originally at Y=0, extending into +Z (in front of VP).
    // When unfolded by 90°, it rotates about the X axis down to -Y!
    const hpGroup = new THREE.Group();
    scene.add(hpGroup);
    hpGroupRef.current = hpGroup;

    const hpDepth = 160;
    const hpGeo = new THREE.PlaneGeometry(vpWidth, hpDepth);
    const hpMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const hpMesh = new THREE.Mesh(hpGeo, hpMat);
    hpMesh.rotation.x = -Math.PI / 2;
    hpMesh.position.set(vpWidth / 2 - 20, 0, hpDepth / 2);
    hpGroup.add(hpMesh);

    // HP Grid
    const hpGrid = new THREE.GridHelper(vpWidth, 12, 0x06b6d4, 0x334155);
    hpGrid.position.set(vpWidth / 2 - 20, 0, hpDepth / 2);
    hpGroup.add(hpGrid);

    // 6. 3D Line in Space (Line AB)
    const [Ax, Ay, Az] = space3D.A;
    const [Bx, By, Bz] = space3D.B;

    const ptA = new THREE.Vector3(Ax, Ay, Az);
    const ptB = new THREE.Vector3(Bx, By, Bz);

    // Line AB Tube
    const lineCurve = new THREE.LineCurve3(ptA, ptB);
    const lineGeo = new THREE.TubeGeometry(lineCurve, 20, 1.8, 8, false);
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4,
    });
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    scene.add(lineMesh);

    // End Spheres for A and B
    const sphereGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const sphereMatA = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
    const sphereA = new THREE.Mesh(sphereGeo, sphereMatA);
    sphereA.position.copy(ptA);
    scene.add(sphereA);

    const sphereMatB = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
    const sphereB = new THREE.Mesh(sphereGeo, sphereMatB);
    sphereB.position.copy(ptB);
    scene.add(sphereB);

    // 7. Projected Front View (FV) on VP (Fixed to VP)
    const [a_pX, a_pY, a_pZ] = space3D.a_prime;
    const [b_pX, b_pY, b_pZ] = space3D.b_prime;
    const pta_prime = new THREE.Vector3(a_pX, a_pY, a_pZ);
    const ptb_prime = new THREE.Vector3(b_pX, b_pY, b_pZ);

    const fvCurve = new THREE.LineCurve3(pta_prime, ptb_prime);
    const fvGeo = new THREE.TubeGeometry(fvCurve, 20, 1.4, 8, false);
    const fvMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const fvMesh = new THREE.Mesh(fvGeo, fvMat);
    scene.add(fvMesh);

    // 8. Projected Top View (TV) on HP (Attached to hpGroup so it rotates coplanar on unfold!)
    const [aX, aY, aZ] = space3D.a;
    const [bX, bY, bZ] = space3D.b;
    const pta = new THREE.Vector3(aX, aY, aZ);
    const ptb = new THREE.Vector3(bX, bY, bZ);

    const tvCurve = new THREE.LineCurve3(pta, ptb);
    const tvGeo = new THREE.TubeGeometry(tvCurve, 20, 1.4, 8, false);
    const tvMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const tvMesh = new THREE.Mesh(tvGeo, tvMat);
    hpGroup.add(tvMesh);

    // Spheres on projections
    const projSphereGeo = new THREE.SphereGeometry(2.5, 12, 12);
    const fvSphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const tvSphereMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const fvSphereA = new THREE.Mesh(projSphereGeo, fvSphereMat);
    fvSphereA.position.copy(pta_prime);
    scene.add(fvSphereA);

    const fvSphereB = new THREE.Mesh(projSphereGeo, fvSphereMat);
    fvSphereB.position.copy(ptb_prime);
    scene.add(fvSphereB);

    const tvSphereA = new THREE.Mesh(projSphereGeo, tvSphereMat);
    tvSphereA.position.copy(pta);
    hpGroup.add(tvSphereA);

    const tvSphereB = new THREE.Mesh(projSphereGeo, tvSphereMat);
    tvSphereB.position.copy(ptb);
    hpGroup.add(tvSphereB);

    // 9. Perpendicular Projection Ray Lines (Connecting Space points to planes)
    // Ray A -> a' (perpendicular to VP)
    const rayMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 4,
      gapSize: 2,
    });

    const createDashedLine = (p1: THREE.Vector3, p2: THREE.Vector3) => {
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const l = new THREE.Line(geo, rayMat);
      l.computeLineDistances();
      return l;
    };

    scene.add(createDashedLine(ptA, pta_prime));
    scene.add(createDashedLine(ptB, ptb_prime));
    scene.add(createDashedLine(ptA, pta));
    scene.add(createDashedLine(ptB, ptb));

    // 10. Interactive Orbit Controls (Mouse Drag & Scroll)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = new THREE.Spherical().setFromVector3(camera.position);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      spherical.theta -= deltaX * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 + 0.3, spherical.phi - deltaY * 0.008));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(40, 30, 30);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(80, Math.min(600, spherical.radius + e.deltaY * 0.4));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(40, 30, 30);
    };

    const domEl = mountRef.current;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel);

    // 11. Animation Loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (domEl.contains(renderer.domElement)) {
        domEl.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [blueprint]);

  // Synchronize HP unfolding rotation with React state
  useEffect(() => {
    if (hpGroupRef.current) {
      // Rotate around X-axis from 0 to 90 degrees (Math.PI / 2)
      const rad = (unfoldAngle * Math.PI) / 180;
      hpGroupRef.current.rotation.x = rad;
    }
  }, [unfoldAngle]);

  // Auto-unfold animation timer
  useEffect(() => {
    if (!isAutoUnfolding) return;
    const interval = setInterval(() => {
      setUnfoldAngle((prev) => {
        if (prev >= 90) {
          setIsAutoUnfolding(false);
          return 90;
        }
        return Math.min(90, prev + 2);
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoUnfolding]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#070b12] overflow-hidden flex flex-col transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'rounded-2xl border border-slate-800/80 shadow-2xl'
      }`}
    >
      {/* 3D Header Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-cyan-400 font-semibold uppercase text-[11px]">
            1st Quadrant 3D Conceptual Model
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400 text-[11px]">Click &amp; Drag to Rotate · Scroll to Zoom</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">
            HP Unfold: <strong className="text-cyan-300 font-mono">{unfoldAngle}°</strong>
          </span>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="relative flex-1 w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing">
        {/* Spatial Labels Overlay */}
        <div className="absolute top-4 left-4 pointer-events-none space-y-1.5 text-xs font-mono">
          <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 text-slate-300 inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span>Line AB in Space (TL = {formatLength(parsed_parameters.true_length_mm, unit)})</span>
          </div>
          <div className="block">
            <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 text-slate-300 inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
              <span>Front View on VP (FV = {formatLength(calculated_answers.front_view_length_mm, unit)})</span>
            </div>
          </div>
          <div className="block">
            <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 text-slate-300 inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>Top View on HP (TV = {formatLength(calculated_answers.top_view_length_mm, unit)})</span>
            </div>
          </div>
        </div>

        {/* 90° HP Unfold Floating Controller with Shrink Option */}
        {isFoldShrunk ? (
          // Shrunk Compact Pill
          <div className="absolute bottom-4 right-18 z-30 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/60 rounded-2xl p-2 px-3 shadow-2xl flex items-center gap-2.5 animate-fadeIn">
            <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
              <Rotate3d className="w-4 h-4 text-cyan-400" />
              <span>HP: {unfoldAngle}°</span>
            </div>

            <button
              onClick={() => setIsAutoUnfolding(!isAutoUnfolding)}
              className="p-1.5 px-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors flex items-center gap-1 text-[11px]"
              title={isAutoUnfolding ? 'Pause Animate Fold' : 'Animate 90° Fold'}
            >
              {isAutoUnfolding ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isAutoUnfolding ? 'Pause' : 'Fold'}</span>
            </button>

            <button
              onClick={() => {
                setUnfoldAngle(0);
                setIsAutoUnfolding(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset to 0° 3D quadrant"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Expand / Unshrink button */}
            <button
              onClick={() => setIsFoldShrunk(false)}
              className="p-1.5 px-2 rounded-lg text-cyan-400 hover:text-cyan-200 hover:bg-slate-800 border border-cyan-500/40 transition-colors flex items-center gap-1 text-[11px]"
              title="Expand HP Unfold Panel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expand</span>
            </button>
          </div>
        ) : (
          // Full Expanded Panel
          <div className="absolute bottom-4 right-18 z-30 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/60 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2.5 w-72 sm:w-80 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Rotate3d className="w-4 h-4" />
                <span>Horizontal Plane Unfolding</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Small Shrink Button as requested */}
                <button
                  onClick={() => setIsFoldShrunk(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors flex items-center gap-1 text-[11px]"
                  title="Shrink / minimize fold controls"
                  aria-label="Shrink HP fold controls"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Shrink</span>
                </button>
                <button
                  onClick={() => {
                    setUnfoldAngle(0);
                    setIsAutoUnfolding(false);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
                  title="Reset to 0° 3D quadrant"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Rotate the Horizontal Plane 90° clockwise down about the XY line to see how 3D space projections align coplanar into the 2D orthographic drawing!
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0° (3D Space)</span>
                <span className="font-mono text-cyan-300 font-bold">{unfoldAngle}°</span>
                <span>90° (2D Drawing)</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={unfoldAngle}
                onChange={(e) => {
                  setIsAutoUnfolding(false);
                  setUnfoldAngle(parseInt(e.target.value));
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsAutoUnfolding(!isAutoUnfolding)}
                className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-500/20"
              >
                {isAutoUnfolding ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isAutoUnfolding ? 'Pause Animation' : 'Animate 90° Fold'}</span>
              </button>

              {/* Small Shrink option beside Animate Fold */}
              <button
                onClick={() => setIsFoldShrunk(true)}
                className="p-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Shrink panel to compact pill"
              >
                <Minimize2 className="w-3 h-3" />
                <span>Shrink</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Fullscreen Icon Button at bottom-right corner of 3D container */}
        <button
          type="button"
          onClick={isFullscreen ? exitFullscreenMode : requestFullscreenMode}
          className="absolute bottom-4 right-4 z-40 p-3 rounded-2xl border border-slate-700/80 bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 shadow-2xl shadow-black/60 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 group"
          aria-label={isFullscreen ? 'Exit 3D Fullscreen' : 'Enter 3D Fullscreen'}
          title={isFullscreen ? 'Exit Fullscreen Mode (Esc)' : 'Enter 3D Fullscreen (Hide all UI & sidebars)'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          ) : (
            <Maximize2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Floating Exit Hint Bar (Visible in Fullscreen Mode) */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 animate-fadeIn pointer-events-auto">
            <span className="text-[11px] font-mono font-medium px-2.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 shadow-lg hidden sm:inline">
              3D Quadrant Fullscreen · Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold">Esc</kbd> to exit
            </span>
            <button
              type="button"
              onClick={exitFullscreenMode}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors shadow-lg"
              title="Exit Fullscreen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
