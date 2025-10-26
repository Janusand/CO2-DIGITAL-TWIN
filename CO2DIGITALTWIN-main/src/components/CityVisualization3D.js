// src/components/CityVisualization3D.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import CaptureModel from '../models/CaptureModel';

const CityVisualization3D = ({ sources, interventions }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount || sources.length === 0) return;

    const emissionRates = sources.map(s => s.emission_rate);
    const minEmission = Math.min(...emissionRates);
    const maxEmission = Math.max(...emissionRates);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x34495e); // Darker sky
    scene.fog = new THREE.Fog(0x34495e, 700, 2000);
    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 3000);
    camera.position.set(0, 650, 650); // Corrected centered camera
    
    const webglRenderer = new THREE.WebGLRenderer({ antialias: true });
    webglRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    webglRenderer.shadowMap.enabled = true;
    webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    currentMount.appendChild(webglRenderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    currentMount.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, webglRenderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 50, 0);
    
    // === Lighting ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(-300, 400, 200);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // === Textured Ground Plane ===
    const textureLoader = new THREE.TextureLoader();
    const citySize = 1200;
    const textureRepeat = 12;

    const colorMap = textureLoader.load('/textures/grid_color.jpg');
    const normalMap = textureLoader.load('/textures/grid_normal.jpg');
    const roughnessMap = textureLoader.load('/textures/grid_roughness.jpg');
    const aoMap = textureLoader.load('/textures/grid_ao.jpg');
    const smokeTexture = textureLoader.load('/textures/smoke.png');

    for (const map of [colorMap, normalMap, roughnessMap, aoMap]) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(textureRepeat, textureRepeat);
    }
    
    const planeGeometry = new THREE.PlaneGeometry(citySize, citySize);
    const planeMaterial = new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        aoMap: aoMap,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const animatedObjects = [];

    // === Add Emission Sources and Smoke ===
    sources.forEach(source => {
      const normalizedEmission = (source.emission_rate - minEmission) / (maxEmission - minEmission || 1);
      const height = 20 + normalizedEmission * 280;
      const buildingColor = new THREE.Color().lerpColors(new THREE.Color(0x48bb78), new THREE.Color(0xf56565), normalizedEmission);

      const geometry = new THREE.BoxGeometry(35, height, 35);
      const material = new THREE.MeshStandardMaterial({ color: buildingColor });
      const cube = new THREE.Mesh(geometry, material);
      
      const posX = source.x - citySize / 2;
      const posZ = source.y - citySize / 2;
      
      cube.position.set(posX, height / 2, posZ);
      cube.castShadow = true;
      cube.receiveShadow = true;
      scene.add(cube);

      const labelDiv = document.createElement('div');
      labelDiv.className = 'details-label';
      labelDiv.innerHTML = `<strong>${source.name}</strong><br>Emission: ${source.emission_rate.toFixed(2)} kg/hr`;
      const label = new CSS2DObject(labelDiv);
      label.position.set(0, height / 2 + 20, 0);
      cube.add(label);
      
      if (normalizedEmission > 0.6) {
        const smokeGeometry = new THREE.BufferGeometry();
        const smokeMaterial = new THREE.PointsMaterial({
          map: smokeTexture,
          size: 60,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.25,
        });

        const smokeParticlesCount = 30;
        const positions = new Float32Array(smokeParticlesCount * 3);
        for (let i = 0; i < smokeParticlesCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 30;
          positions[i * 3 + 1] = Math.random() * 20;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const smokeSystem = new THREE.Points(smokeGeometry, smokeMaterial);
        smokeSystem.position.set(posX, height - 10, posZ);
        scene.add(smokeSystem);
        animatedObjects.push({ mesh: smokeSystem, isSmoke: true });
      }
    });

    // === Add Interventions to the Map ===
    interventions.forEach(inter => {
        const radius = 25;
        const material = new THREE.MeshStandardMaterial({
            color: 0x00d1b2, transparent: true, opacity: 0.5,
            emissive: 0x00d1b2, emissiveIntensity: 2,
        });
        const geometry = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(geometry, material);
        
        const posX = inter.x - citySize / 2;
        const posZ = inter.y - citySize / 2;
        dome.position.set(posX, 0, posZ);
        scene.add(dome);
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'details-label';
        const techDetails = CaptureModel.TECHNOLOGIES[inter.type] || { name: 'Unknown' };
        labelDiv.innerHTML = `<strong>${techDetails.name}</strong>`;
        const label = new CSS2DObject(labelDiv);
        label.position.set(0, radius + 10, 0);
        dome.add(label);
    });

    // === Animation & Cleanup ===
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      animatedObjects.forEach(obj => {
        if (obj.isSmoke) {
          obj.mesh.rotation.y += delta * 0.1;
          const positions = obj.mesh.geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += 8 * delta;
            if (positions[i + 1] > 120) {
              positions[i + 1] = Math.random() * 20;
            }
          }
          obj.mesh.geometry.attributes.position.needsUpdate = true;
        }
      });
      
      controls.update();
      webglRenderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();
    
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      webglRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      labelRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeChild(webglRenderer.domElement);
      currentMount.removeChild(labelRenderer.domElement);
    };
  }, [sources, interventions]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
};

export default CityVisualization3D;