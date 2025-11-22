import { useGameStore, monsterDict } from '../Store/StoreManage';
import { gsap } from 'gsap';
import * as THREE from 'three';
import MonsterAnimate from './MonsterAnimate'
import MonsterControl from './MonsterControl'
import MonsterAttack from './MonsterAttack'
import ExperienceBall from '../Base/ExperienceBall'
import HealthBar from '../Base/HealthBar'
import Txt from '../Base/Txt'
import Animation from '../Base/Animation'

class MonsterAI {
    constructor(monster, animate, type) {
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.heroManage = this.getState().HeroManage
        this.collisionManager = this.getState().CollisionManager
        this.scene = this.getState().scene;
        this.monster = monster;
        this.monsterAnimate = animate
        this.monsterType = type

        this.pixelRatio = window.devicePixelRatio || 1;

        this.AnimationStates = monsterDict[this.monster.monsterType].AnimationStates || {}
        this.maxHealth = monsterDict[this.monster.monsterType].maxHealth || 5;
        this.deathExperience = monsterDict[this.monster.monsterType].deathExperience || 1;
        this.attackSpeed = monsterDict[this.monster.monsterType].attackSpeed || 1.0
        this.attackAnimateTime = monsterDict[this.monster.monsterType].attackAnimateTime || 0.2
        this.damage = monsterDict[this.monster.monsterType].damage || 1
        this.health = this.maxHealth;

        this.id = THREE.MathUtils.generateUUID();
        this.tag = 'monster';
        this.currentState = 'Run'

        this.animate = null
        this.control = null
        this.healthBar = null
        this.attack = null
        this.txt = null
        this.updateFn = null
        this.stopUpdate = false
        this.isAlive = true
        this.textOffset = 3
        this.init()
    }

    init() {
        this.updateFn = (delta) => {
            this.update(delta);
        };
        useGameStore.getState().addLoop(this.updateFn);
        this.initCollision()
        this.animate = new Animation(this.monster, this.monsterAnimate, this.AnimationStates, this, 'Run')
        this.control = new MonsterControl(this)
        this.attack = new MonsterAttack(this)
        this.healthBar = new HealthBar(this.monster, this.maxHealth, 2.5)
        this.txt = new Txt(this.monster)
    }

    update(delta) {
    }

    initCollision() {
        this.collisionManager.register({
            id: this.id,
            mesh: this.monster.children[2],
            tag: this.tag,
            onCollision: this.handleCollision.bind(this)
        });
    }

    handleCollision(otherObject) {
        if (otherObject.tag === 'bullet' && otherObject.mesh.from === 'hero') {
            this.onHit(otherObject.mesh.damage);
        }
    }

    onHit(damage) {
        this.health -= damage;
        this.healthBar.updateHealth(this.health)
        this.health = Math.max(0, this.health);
        this.txt.showTxt(damage, this.textOffset, '#FFFFFF')
        if (this.health <= 0) {
            this.death()
        }
    }

    death() {
        this.isAlive = false
        this.attack.stopAttackLoop()
        this.currentState = 'Death'
        this.collisionManager.unregister(this.id);
        new ExperienceBall(this.deathExperience, this.monster.position)
        setTimeout(() => {
            this.getState().MonsterManage.removeMonster(this);
        }, 1000)
    }

    dispose() {
        const { removeLoop } = useGameStore.getState();
        if (this.updateFn && removeLoop) {
            removeLoop(this.updateFn);
        }
        if (this.collisionManager) {
            this.collisionManager.unregister(this.id);
        }

        this.healthBar.dispose()
        this.monster = null;
    }
}

export default MonsterAI