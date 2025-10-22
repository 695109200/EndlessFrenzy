import { useGameStore } from '../Store/StoreManage';
import HeroBasics from './HeroBasics';
import Bullet from '../Skill/Bullet'
import * as THREE from 'three';

class HeroAutoAttack extends HeroBasics {
    constructor(model) {
        super();
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.model = model;

        this.init();
    }

    init() {
        this.state.attackSpeed = this.state.attackSpeed || 2.0;
        this.state.targetQuaternion = new THREE.Quaternion();
        this.startAttackLoop();
        useGameStore.getState().addLoop((delta) => {
            this.update(delta);
        });
    }

    // 启动攻击循环（控制攻击频率）
    startAttackLoop() {
        if (this.state.attackTimer) clearInterval(this.state.attackTimer);
        const intervalMs = (1 / this.state.attackSpeed) * 1000;
        this.state.attackTimer = setInterval(() => this.tryInitiateAttack(), intervalMs);
    }

    // 尝试发起攻击（先检查目标再转向）
    tryInitiateAttack() {
        // 过滤无效状态
        if (this.state.isMoving || this.state.isRotatingToTarget) return;
        const monsters = this.getState().MonsterManage.monsterGroup.children;
        if (monsters.length === 0){
            this.state.isAttacking = false;
            this.state.isMoving = false;
            this.state.key = [0, 0, 0]
            return;

        } 

        let nearestMonster = this.findMonster();
        nearestMonster && this.attackTarget(nearestMonster)
        new Bullet(
            this.model, // 角色模型
            nearestMonster, // 怪物模型
            this.state.attackSpeed, // 攻击速度（关联子弹飞行速度）
            (hitInfo) => {
                console.log(hitInfo)
                this.getState().MonsterManage.removeMonster(hitInfo.target.monsterAI)
            }
        );
        this.state.isRotatingToTarget = true; // 标记转向状态
    }

    // 每帧更新转向逻辑（需在主循环中调用）
    update(delta) {
        if (this.state.isRotatingToTarget) {
            this.rotateTowardsTarget(delta);
        }
    }

    // 缓慢转向目标（核心转向逻辑）
    rotateTowardsTarget(delta) {
        // 获取当前旋转和目标旋转
        const currentQuat = this.model.quaternion;
        const targetQuat = this.state.targetQuaternion;

        // 计算当前旋转与目标旋转的角度差
        const angleDiff = currentQuat.angleTo(targetQuat);

        // 若角度差小于阈值，视为转向完成
        if (angleDiff < this.state.rotationThreshold) {
            this.model.quaternion.copy(targetQuat); // 强制对齐目标
            this.state.isRotatingToTarget = false;
            this.executeAttackAfterRotation(); // 转向完成后攻击
            return;
        }

        // 逐步转向目标（使用rotateTowards实现平滑旋转）
        currentQuat.rotateTowards(targetQuat, this.state.rotateSpeed * delta);
        this.model.quaternion.copy(currentQuat);
    }

    // 转向完成后执行攻击
    executeAttackAfterRotation() {
        // console.log('转向完成，开始攻击');
        this.state.isAttacking = true;

        // 通知动画系统播放攻击动画
        const heroAnimate = this.getState().HeroManage.HeroAnimate;
        if (heroAnimate) {
            heroAnimate.state.isAttacking = true;
            heroAnimate.switchState('Attack');
        }

        // 等待攻击动画结束
        this.waitForAttackEnd();
    }

    // 等待攻击动画结束并重置状态
    waitForAttackEnd() {
        const heroAnimate = this.getState().HeroManage.HeroAnimate;
        if (!heroAnimate) return;

        const checkFinish = () => {
            if (!this.state.isAttacking) return;

            const attackAction = heroAnimate.actions.Attack;
            if (attackAction.time >= attackAction.getClip().duration) {
                // 攻击结束，重置状态
                this.state.isAttacking = false;
                if (heroAnimate) {
                    heroAnimate.state.isAttacking = false;
                }
                // console.log('攻击结束');
                return;
            }
            requestAnimationFrame(checkFinish);
        };

        checkFinish();
    }

    // 动态更新攻击速度
    updateAttackSpeed(newSpeed) {
        this.state.attackSpeed = newSpeed;
        this.startAttackLoop();
    }

    findMonster = () => {
        const monsterArr = this.getState().MonsterManage.monsterGroup.children;
        if (monsterArr.length === 0) return;

        // 找到最近的怪物
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
        return nearestMonster
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
        // 修正最短旋转路径
        const currentQuat = this.model.quaternion;
        const dotProduct = currentQuat.dot(targetQuat);
        if (dotProduct < 0) {
            targetQuat.x = -targetQuat.x;
            targetQuat.y = -targetQuat.y;
            targetQuat.z = -targetQuat.z;
            targetQuat.w = -targetQuat.w;
        }

        this.state.targetQuaternion.copy(targetQuat);
    };

}

export default HeroAutoAttack;