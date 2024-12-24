import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let playerAttribute = {
  velocity: 0, // Vận tốc ban đầu (0 khi đứng yên)
  isJumping: false, // Trạng thái nhảy
  isMovingLeft: false,
  isMovingRight: false,
  gravity: -0.006, // Gia tốc trọng trường (âm vì vật rơi xuống)
  moveSpeed: 0.17, // Sức mạnh của cú nhảy (vận tốc ban đầu khi nhảy)
  initX: 0,
  initY: 0,
  initZ: 498,
};

let mixer; // AnimationMixer
let model = new THREE.Object3D();
const model_loader = new GLTFLoader();
model_loader.load(
  "GLB_Models/firefly_minecraft.glb", // Đường dẫn đến tệp .glb
  (gltf) => {
    model.add(gltf.scene);
    model.position.set(
      playerAttribute.initX,
      playerAttribute.initY,
      playerAttribute.initZ
    );
    model.scale.set(0.7, 0.7, 0.7);
    // Lặp qua tất cả các đối tượng trong model
    model.traverse((object) => {
      if (object.isMesh) {
        // Kiểm tra nếu đối tượng là mesh
        object.castShadow = true; // Đặt castShadow cho mesh
        object.receiveShadow = true; // Đặt receiveShadow cho mesh
      }
    });

    mixer = new THREE.AnimationMixer(model);

    // Duyệt qua các hoạt hình trong mô hình (nếu có) và thêm chúng vào mixer
    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded"); // Hiển thị tiến độ tải
  },
  (error) => {
    console.error("An error occurred while loading the model:", error);
  }
);

export { mixer, model, playerAttribute };
