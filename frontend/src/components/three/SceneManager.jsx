import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ThreeContext } from './ThreeContext';

const BG_COLORS = { modern: '#e0e5ec', dark: '#0a0c10', natural: '#f0f4f8' };

export default function SceneManager({ children, scenery = 'modern' }) {
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const animRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  const init = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG_COLORS[scenery] || '#e0e5ec');
    scene.fog = new THREE.Fog(scene.background, 20, 100);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 2, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambi = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7); dir.castShadow = true;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xb1e1ff, 0.3);
    fill.position.set(-5, 0, -5);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const ctxValue = { scene, camera, renderer, controls, container };
    setCtx(ctxValue);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      setCtx(null);
    };
  }, [scenery]);

  useEffect(() => {
    const cleanup = init();
    return () => cleanup && cleanup();
  }, [init]);

  return (
    <ThreeContext.Provider value={ctx}>
      <div ref={containerRef} className="scene-container-inner">
        {children}
      </div>
    </ThreeContext.Provider>
  );
}
