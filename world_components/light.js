import * as THREE from "three";

// Ánh sáng môi trường
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);

// Ánh sáng định hướng
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.castShadow = true;

directionalLight.position.set(-10, 5, 0);
directionalLight.target.position.set(0, 0, 0); // Set target of the light

// Set up the shadow camera for directional light
directionalLight.shadow.camera.left = -500;
directionalLight.shadow.camera.right = 500;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.bias = -0.00001; // Điều chỉnh bias để bóng không bị lệch
directionalLight.shadow.mapSize.set(4096, 4096); // Đặt độ phân giải bóng cao hơn

// Xuất ánh sáng môi trường và ánh sáng định hướng
export { ambientLight, directionalLight };
