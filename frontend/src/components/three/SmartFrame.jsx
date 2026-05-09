function createSpecCanvas(specs, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'right';
  ctx.shadowColor = 'rgba(255,255,255,0.7)';
  ctx.shadowBlur = 4;
  ctx.fillText('المواصفات', width - 12, 40);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(12, 52);
  ctx.lineTo(width - 12, 52);
  ctx.stroke();

  ctx.font = '22px Arial';
  const startY = 82;
  const lineH = 34;
  specs.forEach((s, i) => {
    const y = startY + i * lineH;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 3;
    ctx.fillText(s.label, width - 12, y);
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(s.value, 12, y);
    ctx.shadowBlur = 0;
    ctx.font = '22px Arial';
  });
  return canvas;
}

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThreeScene } from './ThreeContext';

export default function SmartFrame({ imageUrl, specs = [] }) {
  const ctx = useThreeScene();
  const groupRef = useRef(null);

  useEffect(() => {
    if (!ctx) return;
    const { scene } = ctx;
    const group = new THREE.Group();

    const planeGeo = new THREE.PlaneGeometry(3, 4);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.position.z = 0.12;
    group.add(plane);

    const frameGeo = new THREE.BoxGeometry(3.4, 4.4, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.receiveShadow = true; frame.castShadow = true;
    group.add(frame);

    const backGeo = new THREE.PlaneGeometry(3, 4);
    const backMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f7, roughness: 0.3, metalness: 0 });
    const backPlane = new THREE.Mesh(backGeo, backMat);
    backPlane.rotation.y = Math.PI;
    backPlane.position.z = -0.12;
    group.add(backPlane);

    group.rotation.x = -0.15;
    group.rotation.y = 0.15;

    if (imageUrl) {
      new THREE.TextureLoader().load(imageUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const imgAspect = texture.image.width / texture.image.height;
        const baseHeight = 4;
        const calcWidth = baseHeight * imgAspect;
        if (calcWidth > 0 && !isNaN(calcWidth)) {
          plane.geometry.dispose();
          plane.geometry = new THREE.PlaneGeometry(calcWidth, baseHeight);
          frame.geometry.dispose();
          frame.geometry = new THREE.BoxGeometry(calcWidth + 0.4, baseHeight + 0.4, 0.2);
          backPlane.geometry.dispose();
          backPlane.geometry = new THREE.PlaneGeometry(calcWidth, baseHeight);
        }
        plane.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide, toneMapped: false });
      });
    }

    if (specs.length > 0) {
      const specCanvas = createSpecCanvas(specs, 800, Math.max(120, 60 + specs.length * 36));
      const specTexture = new THREE.CanvasTexture(specCanvas);
      specTexture.colorSpace = THREE.SRGBColorSpace;
      const h = Math.min(3, 0.8 + specs.length * 0.35);
      const specGeo = new THREE.PlaneGeometry(2.6, h);
      const specMat = new THREE.MeshBasicMaterial({ map: specTexture, toneMapped: false, transparent: true, depthWrite: false });
      const specPlane = new THREE.Mesh(specGeo, specMat);
      specPlane.rotation.y = Math.PI;
      specPlane.position.z = -0.35;
      group.add(specPlane);
    }

    scene.add(group);
    groupRef.current = group;

    return () => {
      scene.remove(group);
      group.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        }
      });
    };
  }, [ctx, imageUrl, specs]);

  return null;
}
