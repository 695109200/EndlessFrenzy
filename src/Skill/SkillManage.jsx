
import { useGameStore, useBulletModelDict } from '../Store/StoreManage';
import NormalBullet from './NormalBullet';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
class SkillManage {
    constructor() {
        this.setData = useGameStore.getState().setData
        this.getState = useGameStore.getState
        this.bulletModelCache = {};
        this.init()
    }

    async init() {
        const bulletPaths = useBulletModelDict.getState();
        const loader = new GLTFLoader();

        const loadPromises = Object.entries(bulletPaths).map(([type, path]) =>
            this.loadModel(loader, type, path)
        );

        await Promise.all(loadPromises);
        console.log("所有子弹模型加载完成并缓存。");
    }

    async loadModel(loader, type, path) {
        return new Promise((resolve, reject) => {
            loader.load(
                path,
                (gltf) => {
                    this.bulletModelCache[type] = gltf.scene;
                    console.log(this.bulletModelCache)
                    resolve();
                },
                undefined,
                (error) => {
                    console.error(`Failed to load bullet model for type ${type}:`, error);
                    reject(error);
                }
            );
        });
    }

    createBullet(targetMesh, type = 'normalBullet') {
        const sourceModel = this.bulletModelCache[type];
        if (!sourceModel) {
            console.error(`Bullet type ${type} model not found in cache.`);
            return;
        }
        const newBulletMesh = sourceModel.clone();
        const newBulletInstance = new NormalBullet(targetMesh, newBulletMesh);
        newBulletInstance.create();
        return newBulletInstance;
    }
}
export default SkillManage;