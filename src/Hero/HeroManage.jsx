import { loadGLTFModel, createFixedCollisionBox } from '../Utils/Utils';
import { useGameStore, useHeroModelDict } from '../Store/StoreManage';
import HeroControl from './HeroControl'
import HeroAttack from './HeroAttack'
import HeroBasics from './HeroBasics';
import HeroExperience from './HeroExperience';
import HealthBar from '../Base/HealthBar'
import Txt from '../Base/Txt'
import Animation from '../Base/Animation'

class HeroManage extends HeroBasics {
    constructor(scene, followGroup, camera, heroName) {
        super()
        this.setData = useGameStore.getState().setData
        this.getState = useGameStore.getState
        this.collisionManager = this.getState().CollisionManager

        this.scene = scene
        this.followGroup = followGroup
        this.camera = camera

        this.HeroExperience = null
        this.HeroControl = null
        this.HeroAttack = null
        this.animations = null
        this.hero = null
        this.healthBar = null
        this.collisionBoxMesh = null

        this.loadModel = useHeroModelDict.getState()[heroName]
        this.loadPromise = this.init();
        this.isInvulnerable = false;
        this.id = THREE.MathUtils.generateUUID();
        this.INVULNERABILITY_DURATION = 1
        this.tag = 'hero';
        this.AnimationStates = {
            Idle: {
                from: ['Run', 'Attack'],
                clip: 'Idle1'
            },
            Run: {
                from: ['Idle', 'Attack'],
                clip: 'Run_Normal'
            },
            Attack: {
                from: ['Idle', 'Run'],
                clip: 'caitlyn_skin11_attackfast1.anm',
                isSingle: false
            },
            Death: {
                from: ['Attack', 'Idle', 'Run'],
                clip: 'Death_Base',
                isSingle: true
            }
        };
    }

    async init() {
        await this.initModel();
        this.HeroAnimate = new Animation(this.hero, this.animations, this.AnimationStates, this.state, 'Idle')
        this.HeroControl = new HeroControl(this.hero)
        this.HeroAttack = new HeroAttack(this.hero)
        this.HeroExperience = new HeroExperience(this.hero, this.scene)
        this.healthBar = new HealthBar(this.hero, this.state.health, 3.3)
        this.txt = new Txt(this.hero, 3.3)
        this.initCollision()
    }

    initCollision() {
        this.collisionManager.register({
            id: this.id,
            mesh: this.collisionBoxMesh,
            tag: this.tag,
            onCollision: this.handleCollision.bind(this)
        });
    }

    handleCollision(otherObject) {
        if (this.isInvulnerable) {
            return;
        }

        if (otherObject.tag == 'bullet' && otherObject.mesh.from == 'monster') {
            this.state.health -= otherObject.mesh.damage;
            this.healthBar.updateHealth(this.state.health)
            this.startInvulnerability();
        }

        if (otherObject.tag == 'monster') {
            this.state.health -= 1;
            this.txt.showTxt(1, 2.5, '#5d0707ff')

            this.healthBar.updateHealth(this.state.health)
            this.startInvulnerability();
        }

        if (this.state.health <= 0) {
            this.death()
        }
    }

    death() {
        this.state.currentState = 'Death'
        this.state.isAlive = false
        this.getState().MonsterManage.handelHeroDeath()
        this.HeroExperience.hiddenBar()
        this.HeroAnimate.heroDeathAnimate()
        this.collisionManager.unregister(this.id)
    }

    startInvulnerability() {
        this.isInvulnerable = true;
        setTimeout(() => {
            this.isInvulnerable = false;
        }, this.INVULNERABILITY_DURATION * 1000); // 转换为毫秒
    }

    initModel = async () => {
        const gltf = await loadGLTFModel(this.loadModel);
        gltf.scene.scale.set(0.02, 0.02, 0.02)
        this.hero = gltf.scene
        this.scene.add(this.hero)

        this.collisionBoxMesh = createFixedCollisionBox(100, 120, 100);

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
        this.hero.add(this.collisionBoxMesh);
        this.animations = gltf.animations
    };

    addExperience(experience) {
        this.HeroExperience.updateExperience(experience)
    }

    upLevel() {
        this.state.level += 1
        console.log(this.state.level)
    }

    dispose() {
        this.HeroAnimate.dispose()
        this.updateFn = null
    }
};

export default HeroManage;
