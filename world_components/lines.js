import * as THREE from "three";

const LineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const lines = []; // Khởi tạo mảng để lưu các đối tượng Line

for (let i = -2.5; i <= 2.5; i += 2.5) {
  if (i === 0) {
    continue;
  } else {
    for (let z = 496; z > -494; z -= 5) {
      const LineGeometry = new THREE.PlaneGeometry(0.5, 3);
      const Line = new THREE.Mesh(LineGeometry, LineMaterial);
      Line.rotation.x = -Math.PI / 2;
      Line.position.set(i, 0.03, z - 3);
      lines.push(Line); // Thêm Line vào mảng
    }
  }
}

const startLineGeometry = new THREE.PlaneGeometry(10, 1); // Vạch rộng 20, dày 1
const startLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
startLine.rotation.x = -Math.PI / 2; // Đặt nằm ngang
startLine.position.set(0, 0.01, 497); // Đặt ở đầu đường đua

const squareSize = 1; // Kích thước mỗi ô vuông
const numSquares = 10; // Số ô vuông trên mỗi hàng (tùy chỉnh theo chiều rộng đường đua)
const finishLineWidth = numSquares * squareSize; // Chiều rộng của vạch đích
const finishLineLength = 3; // Chiều dài của vạch đích
const startZ = -496; // Vị trí z của vạch đích
const finishLine = [];

for (let row = 0; row < finishLineLength / squareSize; row++) {
  for (let col = 0; col < numSquares; col++) {
    // Tính toán màu xen kẽ
    const isBlack = (row + col) % 2 === 0;
    const color = isBlack ? 0x000000 : 0xffffff;

    // Tạo hình vuông (mặt phẳng nhỏ)
    const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);
    const squareMaterial = new THREE.MeshBasicMaterial({ color: color });
    const square = new THREE.Mesh(squareGeometry, squareMaterial);

    // Xoay mặt phẳng để nằm ngang
    square.rotation.x = -Math.PI / 2;

    // Đặt vị trí cho ô vuông
    const x = col * squareSize - finishLineWidth / 2 + squareSize / 2;
    const z = startZ + row * squareSize - finishLineLength / 2;
    square.position.set(x, 0.01, z);

    // Thêm vào mảng
    finishLine.push(square);
  }
}

export { lines, startLine, finishLine };
