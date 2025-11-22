import { loadGLTFModel, createFixedCollisionBox } from '../Utils/Utils';
import { useGameStore, monsterDict } from '../Store/StoreManage';
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

        this.monsterAnimations = {};
        this.monsterCache = {};
        this.collisionBoxMesh = {}
        this.loadPromise = this.init();
    }

    async init() {
        await this.loadMonsterModel()
        this.scene.add(this.monsterGroup);
    }

    loadMonsterModel = async () => {
        const monsterNames = Object.keys(monsterDict);
        for (const name of monsterNames) {
            await this.loadSingleMonster(name);
        }
    };

    loadSingleMonster = async (name) => {
        const config = monsterDict[name];

        const gltf = await loadGLTFModel(config.modelPath);
        const model = gltf.scene;

        this.processMonsterModel(model);
        this.attachCollisionBox(model, name);

        this.monsterCache[name] = model;
        this.monsterAnimations[name] = gltf.animations;
    };

    processMonsterModel(model) {
        model.scale.set(0.01, 0.01, 0.01);
        model.traverse((obj) => {
            if (obj.isMesh || obj.isSkinnedMesh) {

                const mat = obj.material = obj.material.clone();
                obj.castShadow = true;
                obj.receiveShadow = true;

                mat.metalness = 1.0;
                mat.roughness = 0.2;
                mat.color.set(1, 1, 1);
                if (mat.map) mat.metalnessMap = mat.map;
            }
        });
    }

    attachCollisionBox(model, name) {
        const box = createFixedCollisionBox(100, 120, 100);
        this.collisionBoxMesh[name] = box;
        model.add(box);
    }

    async addMonsters(type) {
        if (!this.monsterCache[type]) {
            console.warn('怪物模型或动画未加载完成，无法添加怪物');
            return;
        }
        const monsterMesh = clone(this.monsterCache[type])
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
        monsterMesh.monsterType = type
        this.monsterGroup.add(monsterMesh);

        const monsterAI = new MonsterAI(monsterMesh, this.monsterAnimations[type], type);
        monsterMesh.monsterAI = monsterAI
        this.monsterAIs.push(monsterAI);
    }

    removeMonster(monsterAI) {
        const { monster } = monsterAI;
        if (!monster) return;

        if (monsterAI.lifetimeTimer) {
            clearTimeout(monsterAI.lifetimeTimer);
        }

        if (monsterAI.animate) {
            monsterAI.animate.dispose();
            monsterAI.animate = null;
        }

        if (monsterAI.dispose) {
            monsterAI.dispose();
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

    handelHeroDeath() {
        this.monsterAIs.forEach(AI => {
            AI.stopUpdate = true
            AI.attack.stopAttackLoop()
            AI.currentState = 'Win'
        })
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
