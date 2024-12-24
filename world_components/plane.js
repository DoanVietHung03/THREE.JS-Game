import * as THREE from "three";

const planeGeometry = new THREE.PlaneGeometry(10, 1000);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;

export { plane };
