import { useGameStore } from '../Store/StoreManage';
import HeroBasics from './HeroBasics';
import * as THREE from 'three';

class HeroAttack extends HeroBasics {
    constructor(model) {
        super();
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.model = model;
        this.isAttacking = false;
        this.isRotatingToTarget = false;
        this.attackTimer = null;
        this.cleanupAttackCheck = null;
        this.targetQuaternion = new THREE.Quaternion()
        this.rotationThreshold = 0.01
        this.rotateSpeed = 10
        this.nearestMonster = null
        this.hasCreatedBullet = false;
        this.init();
    }

    init() {
        this.startAttackLoop();
        useGameStore.getState().addLoop((delta) => {
            this.update(delta);
        });
    }
    updateAttackLoop() {
        if (this.attackTimer) clearInterval(this.attackTimer);
        const intervalMs = (1 / this.state.attackSpeed) * 1000;
        const minIntervalMs = 50;
        const finalIntervalMs = Math.max(intervalMs, minIntervalMs);
        this.attackTimer = setInterval(() => this.tryInitiateAttack(), finalIntervalMs);
    }
    startAttackLoop() {
        this.updateAttackLoop();
    }

    tryInitiateAttack() {
        if (this.state.currentState === 'Run' || this.isRotatingToTarget || this.isAttacking) return;

        const monsters = this.getState().MonsterManage.monsterGroup.children;
        if (monsters.length === 0) {
            return;
        }

        this.nearestMonster = this.findMonster();
        if (this.nearestMonster) {
            this.attackTarget(this.nearestMonster);
            this.isRotatingToTarget = true; // 标记转向状态
        }
    }

    attackTarget = (nearestMonster) => {
        const heroPos = this.model.position;
        const targetDir = new THREE.Vector3()
            .subVectors(nearestMonster.position, heroPos)
            .normalize();
        targetDir.y = 0;

        const targetQuat = new THREE.Quaternion();
        targetQuat.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            targetDir
        );

        const currentQuat = this.model.quaternion;
        const dotProduct = currentQuat.dot(targetQuat);
        if (dotProduct < 0) {
            targetQuat.x = -targetQuat.x;
            targetQuat.y = -targetQuat.y;
            targetQuat.z = -targetQuat.z;
            targetQuat.w = -targetQuat.w;
        }

        this.targetQuaternion.copy(targetQuat);
    };

    // 每帧更新转向逻辑
    update(delta) {
        if (this.isRotatingToTarget) {
            this.rotateTowardsTarget(delta);
        }
    }

    // 查找最近的怪物
    findMonster = () => {
        const monsterArr = this.getState().MonsterManage.monsterGroup.children;
        if (monsterArr.length === 0) return null;

        const heroPos = this.model.position;
        let nearestMonster = null;
        let minDist = Infinity;
        monsterArr.forEach(monster => {
            const dist = heroPos.distanceTo(monster.position);
            if (dist < minDist) {
                minDist = dist;
                nearestMonster = monster;
            }
        });
        return nearestMonster;
    }

    // 缓慢转向目标
    rotateTowardsTarget(delta) {
        const currentQuat = this.model.quaternion;
        const targetQuat = this.targetQuaternion;
        const angleDiff = currentQuat.angleTo(targetQuat);

        if (angleDiff < this.rotationThreshold) {
            this.model.quaternion.copy(targetQuat);
            this.isRotatingToTarget = false;
            this.executeAttackAfterRotation(); // 转向完成后执行攻击动画
            return;
        }

        currentQuat.rotateTowards(targetQuat, this.rotateSpeed * delta);
        this.model.quaternion.copy(currentQuat);
    }

    // 转向完成后执行攻击
    executeAttackAfterRotation() {
        if (this.state.currentState === 'Run' || !this.nearestMonster) return;

        this.isAttacking = true;
        this.state.currentState = 'Attack';

        const heroAnimate = this.getState().HeroManage.HeroAnimate;
        if (heroAnimate && heroAnimate.actions.Attack) {
            const attackAction = heroAnimate.actions.Attack;
            const attackDuration = attackAction.getClip().duration;
            const currentAS = this.state.attackSpeed;

            const actualDuration = attackDuration / currentAS;

            const bulletHitPoint = 0.2;

            const delayMs = actualDuration * bulletHitPoint * 1000;

            if (this.bulletDelayTimer) clearTimeout(this.bulletDelayTimer);

            this.bulletDelayTimer = setTimeout(() => {
                this.createBullet();
            }, delayMs);
        }
    }

    createBullet = () => {
        if (!this.nearestMonster) return;
        const { SkillManage } = this.getState()
        SkillManage.createBullet(
            this.nearestMonster,
            "normalBullet"
        );
    }

    interruptAttack() {
        this.isRotatingToTarget = false;
        this.isAttacking = false;

        if (this.bulletDelayTimer) {
            clearTimeout(this.bulletDelayTimer);
            this.bulletDelayTimer = null;
        }

        if (this.state.currentState === 'Attack') {
            this.state.currentState = 'Idle';
        }
    }

}

export default HeroAttack;