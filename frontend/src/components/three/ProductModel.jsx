import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { useThreeScene } from './ThreeContext';

export default function ProductModel({ url }) {
  const ctx = useThreeScene();
  const groupRef = useRef(null);

  useEffect(() => {
    if (!ctx || !url) return;
    const { scene } = ctx;
    const group = new THREE.Group();
    groupRef.current = group;

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(draco);

    loader.load(url, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.y -= center.y;
      model.position.z -= center.z;
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim;
      model.scale.set(scale, scale, scale);
      model.traverse((child) => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material) child.material.envMapIntensity = 1; }
      });
      group.add(model);
      scene.add(group);
    }, undefined, () => {
      const geo = new THREE.BoxGeometry(2, 2, 2);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geo, mat);
      group.add(cube);
      scene.add(group);
    });

    return () => {
      scene.remove(group);
      group.traverse((child) => {
        if (child.isMesh) { if (child.geometry) child.geometry.dispose(); if (child.material) child.material.dispose(); }
      });
    };
  }, [ctx, url]);

  return null;
}
