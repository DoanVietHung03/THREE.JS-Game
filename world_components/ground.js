import * as THREE from "three";

const loader = new THREE.TextureLoader();

//Cát
const sandTexture = loader.load("../texture/sand.jpg"); // Đường dẫn tới texture cát
sandTexture.wrapS = THREE.RepeatWrapping; // Lặp texture theo trục S (ngang)
sandTexture.wrapT = THREE.RepeatWrapping; // Lặp texture theo trục T (dọc)
sandTexture.repeat.set(50, 50); // Số lần lặp texture trên mặt đất

// 3. Tạo mặt phẳng mặt đất với texture
const groundGeometry = new THREE.PlaneGeometry(10000, 10000); // Kích thước mặt đất
const groundMaterial = new THREE.MeshStandardMaterial({
  map: sandTexture, // Texture được áp dụng
  roughness: 1, // Độ nhám để làm cát không bóng
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Nằm ngang
ground.position.y = -0.03; // Vị trí mặt đất
ground.receiveShadow = true;

export { ground };
