import * as THREE from "three";
import { useGameStore } from '../Store/StoreManage';

class MonsterAttack {
    constructor(monsterAI) {
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.heroManage = this.getState().HeroManage;
        this.scene = this.getState().scene;

        this.monsterAI = monsterAI;
        this.monster = monsterAI.monster;

        this.attackTimer = null
        this.updateFn = null;

        this.speed = 5;
        this.maxDistance = 40;
        this.elapsed = 0;
        this.autoAttack = false
        this.init();
    }

    init() {
        this.setAttackTimer()
    }

    setAttackTimer() {
        const intervalMs = (1 / this.monsterAI.attackSpeed) * 1000;
        const minIntervalMs = 50;
        const finalIntervalMs = Math.max(intervalMs, minIntervalMs);
        this.attackTimer = setInterval(() => this.startAttack(), finalIntervalMs);
    }

    startAttack() {
        if (!this.autoAttack) return
        this.elapsed = 0;
        this.origin = this.monster.position.clone();
        this.target = this.heroManage.hero.position.clone();
        this.direction = new THREE.Vector3()
            .subVectors(this.target, this.origin)
            .normalize();

        const attackAction = this.monsterAI.animate.actions.Attack;
        const attackDuration = attackAction.getClip().duration;
        const currentAS = this.monsterAI.attackSpeed;
        const actualDuration = attackDuration / currentAS;

        const delayMs = actualDuration * this.monsterAI.attackAnimateTime * 1000;
        setTimeout(() => {
            this.attack()
        }, delayMs);
    }

    attack() {
        if (!this.getState().HeroManage.state.isAlive) {
            this.monsterAI.currentState = 'Win'
            return
        }
        if (this.monsterAI.monsterType == 'normalMonster') {
            this.monsterAI.currentState = 'Attack'

        } else {
            const { SkillManage } = this.getState()
            SkillManage.createBullet(
                this.heroManage.hero,
                this.monster,
                "MagicProjectile",
                'monster',
                this.monsterAI.damage
            );
        }
    }

    startAttackLoop() {
        this.autoAttack = true
    }

    stopAttackLoop() {
        this.autoAttack = false
    }

    dispose() {
        if (this.attackTimer) clearInterval(this.attackTimer);
        const { removeLoop } = useGameStore.getState();
        if (this.updateFn && removeLoop) removeLoop(this.updateFn);
        this.updateFn = null;
    }
}

export default MonsterAttack;
