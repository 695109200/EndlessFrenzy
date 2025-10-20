// 怪物AI控制器（每个怪物一个实例）
import { useGameStore, useDefaultSetting } from '../Store/StoreManage';

class MonsterAI {
    constructor(monsterMesh, heroManage) {
        this.monster = monsterMesh; // 单个怪物的Mesh/SkinnedMesh
        this.heroManage = heroManage; // 英雄管理器（用于获取英雄位置）
        this.speed = 1 + Math.random() * 0.5; // 每个怪物速度略有不同
        this.stopDistance = 1.5; // 停止距离
        this.rotationSpeed = 0.1; // 转向速度
        this.actions = {}
        this.stopDistance = 1.5;
        this.init()
    }

    init() {
        useGameStore.getState().addLoop((delta) => {
            this.update(delta);
        });
    }

    // 单个怪物的移动逻辑
    update(delta) {
        if (!this.heroManage?.hero) return;

        // 获取自身和英雄的世界坐标
        const monsterPos = new THREE.Vector3();
        const heroPos = new THREE.Vector3();
        this.monster.getWorldPosition(monsterPos);
        this.heroManage.hero.getWorldPosition(heroPos);

        // 计算方向向量（指向英雄）
        const direction = new THREE.Vector3()
            .subVectors(heroPos, monsterPos)
            .setY(0)
            .normalize();

        // 计算距离
        const distance = monsterPos.distanceTo(heroPos);

        // 转向英雄
        this.lookAtHero(direction);

        // 移动到英雄（距离足够时）
        if (distance > this.stopDistance) {
            this.moveTowards(direction, delta);
        }
    }

    // 转向英雄（独立计算朝向）
    lookAtHero(direction) {
        const targetRotationY = Math.atan2(direction.x, direction.z);
        const currentRotationY = this.monster.rotation.y;
        const rotationDiff = this.normalizeAngle(targetRotationY - currentRotationY);
        this.monster.rotation.y += rotationDiff * this.rotationSpeed;
    }

    // 向英雄移动（独立计算位移）
    moveTowards(direction, delta) {
        const moveStep = direction.multiplyScalar(this.speed * delta);
        this.monster.position.add(moveStep);
    }

    // 角度归一化（处理360度循环）
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

}

export default MonsterAI