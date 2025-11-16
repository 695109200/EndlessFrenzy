import { loadGLTFModel, createFixedCollisionBox } from '../Utils/Utils';
import { useGameStore } from '../Store/StoreManage';
import MonsterAI from './MonsterAI'
import { clone } from 'three/addons/utils/SkeletonUtils.js';
class MonsterManage {
    constructor(scene) {
        this.setData = useGameStore.getState().setData
        this.getState = useGameStore.getState
        this.heroManage = this.getState().HeroManage
        this.scene = scene
        this.monsterGroup = new THREE.Group()
        this.monsterAIs = [];
        this.monsterCache = null;
        this.monsterAnimations = null;
        this.collisionBoxMesh = null
        this.loadPromise = this.init();
    }

    async init() {
        await this.loadMonsterModel()
        this.scene.add(this.monsterGroup);
    }

    loadMonsterModel = async () => {
        const gltf = await loadGLTFModel('/Model/Monster/melee_minion_-_chaos.glb');
        const model = gltf.scene;
        model.scale.set(0.01, 0.01, 0.01);

        this.collisionBoxMesh = createFixedCollisionBox(100, 120, 100);

        model.traverse((object) => {
            if (object.isMesh || object.isSkinnedMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                object.material = object.material.clone();
                object.material.metalness = 1.0;
                object.material.roughness = 0.2;
                object.material.color.set(1, 1, 1);
                if (object.material.map) {
                    object.material.metalnessMap = object.material.map;
                }
            }
        });
        model.add(this.collisionBoxMesh);

        this.monsterCache = model;

        this.monsterAnimations = gltf.animations;
    };

    async addMonsters() {
        if (!this.monsterCache) {
            console.warn('怪物模型或动画未加载完成，无法添加怪物');
            return;
        }
        const hero = this.heroManage.hero
        const monsterMesh = clone(this.monsterCache)
        monsterMesh.traverse((object) => {
            if (object.isMesh || object.isSkinnedMesh) {
                if (object.geometry) {
                    object.geometry = object.geometry.clone();
                }
            }
        });
        const randomPos = new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            0,
            (Math.random() - 0.5) * 40
        );
        monsterMesh.position.copy(randomPos);
        monsterMesh.rotation.set(0, Math.random() * Math.PI * 2, 0);

        this.monsterGroup.add(monsterMesh);

        const monsterAI = new MonsterAI(monsterMesh);
        monsterMesh.monsterAI = monsterAI
        this.monsterAIs.push(monsterAI);
    }

    removeMonster(monsterAI) {
        const { monster } = monsterAI;
        if (!monster) return;

        if (monsterAI.lifetimeTimer) {
            clearTimeout(monsterAI.lifetimeTimer);
        }
        if (monsterAI.dispose) {
            monsterAI.dispose();
        }
        if (monsterAI.animate) {
            monsterAI.animate.dispose();
            monsterAI.animate = null;
        }
        this.monsterGroup.remove(monster);
        monster.removeFromParent();

        this.dispose(monster);

        const index = this.monsterAIs.indexOf(monsterAI);
        if (index !== -1) {
            this.monsterAIs.splice(index, 1);
        }

        monsterAI = null;
    }

    dispose(monster) {
        monster.traverse(child => {
            if (child.isMesh || child.isSkinnedMesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    if (child.material.normalMap) child.material.normalMap.dispose();
                    child.material.dispose();
                }
            }
        });
    }
};

export default MonsterManage;
