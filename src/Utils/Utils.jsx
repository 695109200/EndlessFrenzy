// src/utils/util.jsx
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

// 加载HDR环境贴图
export const loadHDRTexture = (path) => {
    return new Promise((resolve, reject) => {
        new HDRLoader()
            .load(path, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                resolve(texture);
            }, undefined, reject);
    });
};

// 加载GLTF模型
export const loadGLTFModel = (url) => {
    return new Promise((resolve, reject) => {
        new GLTFLoader().load(url, resolve, undefined, reject);
    });
};

// 动画混合器更新
export const updateMixer = (mixer, delta) => {
    if (mixer) mixer.update(delta);
};

export function createFixedCollisionBox(width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);

    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 1.0, // 完全不可见
        depthTest: false, // 禁用深度测试
        wireframe: false,
    });

    const collisionMesh = new THREE.Mesh(geometry, material);

    collisionMesh.position.y = height / 2;

    collisionMesh.visible = false;
    collisionMesh.castShadow = false;
    collisionMesh.receiveShadow = false;

    collisionMesh.name = "CollisionBox";

    return collisionMesh;
}