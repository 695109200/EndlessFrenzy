import { loadHDRTexture, loadGLTFModel } from '../Utils/Utils';
import { useGameStore, useDefaultSetting, useHeroModelDict } from '../Store/StoreManage';
import HeroControl from './HeroControl'
import HeroAnimate from './HeroAnimate'
class HeroManage {
    constructor(scene, followGroup, camera, heroName) {
        this.setData = useGameStore.getState().setData
        this.getState = useGameStore.getState

        this.scene = scene
        this.followGroup = followGroup
        this.camera = camera

        this.HeroControl = null
        this.animations = null
        this.hero = null

        this.loadModel = useHeroModelDict.getState()[heroName]
        this.loadPromise = new Promise(async (resolve) => {
            await this.init();
            resolve();
        });
    }

    async init() {
        await this.initModel();
        this.HeroControl = new HeroControl(this.hero)
        this.HeroAnimate = new HeroAnimate(this.hero, this.animations)
    }

    waitForLoad() {
        return this.loadPromise;
    }

    initModel = async () => {
        const gltf = await loadGLTFModel(this.loadModel);
        gltf.scene.scale.set(0.01, 0.01, 0.01)
        this.hero = gltf.scene
        this.scene.add(this.hero)

        this.hero.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                object.material.metalness = 1.0;
                object.material.roughness = 0.2;
                object.material.color.set(1, 1, 1);
                object.material.metalnessMap = object.material.map;
            }
        });
        this.animations = gltf.animations
    };

    attack = ()=>{
        this.HeroControl.attackTarget()
    }

    death = () => {

    }
};

export default HeroManage;
