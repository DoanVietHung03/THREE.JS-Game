import * as THREE from "three";

let cameraAttribute = {
  initX: 0,
  initY: 1,
  initZ: 5,
};

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  50
);

// Camera cố định trục X, giữ nguyên vị trí trục Z
camera.position.set(
  cameraAttribute.initX,
  cameraAttribute.initY,
  cameraAttribute.initZ
);
camera.lookAt(new THREE.Vector3(0, 0.5, 0));

export { camera, cameraAttribute };
