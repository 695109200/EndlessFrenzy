import { unwrapRad } from '../Utils/Utils';
import { useGameStore, useDefaultSetting } from '../Store/StoreManage';
import HeroBasics from './HeroBasics'
class HeroControl extends HeroBasics {
    constructor(model) {
        super()

        this.setData = useGameStore.getState().setData
        this.getState = useGameStore.getState
        this.model = model
        this.checkAttackTime = null
        this.lastSpeedCheck = null
        this.init()
    }

    init() {
        this.bindEvent()
        useGameStore.getState().addLoop((delta) => {
            this.update(delta);
        });
    }
    canAttack = () => {
        const now = performance.now();
        const attackInterval = 1 / this.attackSpeed; // 攻击间隔（秒）
        const coolDownMs = Math.floor(attackInterval * 1000); // 转换为整数毫秒（减少误差）

        if (this.lastAttackTime === 0) return true;

        // 允许 10ms 误差，避免因浮点计算导致冷却判断延迟
        return now - this.lastAttackTime >= coolDownMs - 10;
    };
    update = (delta) => {
        this.move(delta);
        // 每3秒打印一次实际攻击频率（调试用）
        if (!this.lastSpeedCheck || performance.now() - this.lastSpeedCheck > 3000) {
            const attackCount = this.attackCount || 0;
            const actualSpeed = attackCount / 3; // 3秒内的平均攻击次数 → 转换为每秒
            console.log(`预期攻击速度：${this.attackSpeed}次/秒，实际：${actualSpeed.toFixed(1)}次/秒`);
            this.attackCount = 0; // 重置计数
            this.lastSpeedCheck = performance.now();
        }
        // 旋转逻辑：旋转结束后触发攻击动画
        if (this.state.isRotating) {
            const reached = this.model.quaternion.rotateTowards(
                this.state.targetQuaternion,
                5 * delta
            );

            if (reached) {
                // 仅在非奔跑状态且攻击冷却结束时触发攻击
                if (this.state.current !== 'Run' && this.canAttack()) {
                    this.startAttack();
                } else {
                    this.state.isRotating = false;
                }
            }
        }
    };

    // 开始攻击（设置攻击状态）
    startAttack = () => {
        // 防止重复触发 + 检查冷却
        if (this.state.isAttacking || !this.canAttack()) return;

        // 记录本次攻击时间（关键：用于计算下次冷却）
        this.lastAttackTime = performance.now();

        this.state.isAttacking = true;
        this.state.current = 'Attack';
        console.log("开始攻击（攻击速度控制）");

        // 清除可能残留的旧检查器
        if (this.checkAttackTime) {
            cancelAnimationFrame(this.checkAttackTime);
            this.checkAttackTime = null;
        }

        // 帧循环检查动画结束
        // 在 startAttack 的 checkFinish 中优化
        const checkFinish = () => {
            const isFinished = this.getState().HeroManage.HeroAnimate.isAnimationFinished("Attack");
            if (isFinished) {
                // 动画结束后立即重置攻击状态（即使未到冷却时间）
                this.state.isAttacking = false;
                this.state.isRotating = false;
                console.log("攻击动画结束，等待冷却...");
                if (this.state.current === 'Attack') {
                    this.state.current = 'Idle';
                }
                this.checkAttackTime = null;
                return false;
            }
            // 若攻击被中断，也立即重置
            if (!this.state.isAttacking) {
                this.state.isRotating = false;
                this.checkAttackTime = null;
                return false;
            }
            this.checkAttackTime = requestAnimationFrame(checkFinish);
            return true;
        };

        checkFinish();
    };


    attackTarget = () => {


        const monsterArr = this.getState().MonsterManage.monsterGroup.children;
        if (monsterArr.length === 0) return;

        // 1. 找到最近的怪物
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

        if (nearestMonster) {
            // 2. 计算指向怪物的方向向量（锁定Y轴）
            const targetDir = new THREE.Vector3()
                .subVectors(nearestMonster.position, heroPos)
                .normalize();
            targetDir.y = 0;

            // 3. 计算目标旋转四元数
            const targetQuat = new THREE.Quaternion();
            targetQuat.setFromUnitVectors(
                new THREE.Vector3(0, 0, 1), // 模型初始朝前方向（Z轴）
                targetDir
            );

            // 4. 关键：修正目标四元数，确保最短路径（替代 multiplyScalar(-1)）
            const currentQuat = this.model.quaternion; // 模型当前旋转
            const dotProduct = currentQuat.dot(targetQuat); // 计算点积

            if (dotProduct < 0) {
                // 取反四元数的所有分量（等价于旋转方向取反，实现最短路径）
                targetQuat.x = -targetQuat.x;
                targetQuat.y = -targetQuat.y;
                targetQuat.z = -targetQuat.z;
                targetQuat.w = -targetQuat.w;
            }

            // 5. 更新目标旋转（保持引用）
            this.state.targetQuaternion.copy(targetQuat);

            // 6. 开始旋转
            this.state.isRotating = true;
        }
    };

    handleKeyDown = (event) => {
        clearTimeout(this.attackingTime)
        this.state.isAttacking = false; // 标记为攻击中
        this.state.isRotating = false
        const key = this.state.key;

        switch (event.code) {
            case 'ArrowUp': case 'KeyW': case 'KeyZ': key[0] = -1; break;
            case 'ArrowDown': case 'KeyS': key[0] = 1; break;
            case 'ArrowLeft': case 'KeyA': case 'KeyQ': key[1] = -1; break;
            case 'ArrowRight': case 'KeyD': key[1] = 1; break;
            case 'ShiftLeft': case 'ShiftRight': key[2] = 1; break;
        }
        this.state.current = key[0] !== 0 || key[1] !== 0 ? 'Run' : 'Idle';
    };

    handleKeyUp = (event) => {
        const key = this.state.key;
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': case 'KeyZ': key[0] = key[0] < 0 ? 0 : key[0]; break;
            case 'ArrowDown': case 'KeyS': key[0] = key[0] > 0 ? 0 : key[0]; break;
            case 'ArrowLeft': case 'KeyA': case 'KeyQ': key[1] = key[1] < 0 ? 0 : key[1]; break;
            case 'ArrowRight': case 'KeyD': key[1] = key[1] > 0 ? 0 : key[1]; break;
            case 'ShiftLeft': case 'ShiftRight': key[2] = 0; break;
        }

        this.state.current = key[0] !== 0 || key[1] !== 0 ? 'Run' : 'Idle';
    };

    bindEvent = () => {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    move = (delta) => {
        const { orbitControls, camera, followGroup } = this.getState();
        const { current, runVelocity, walkVelocity, rotateSpeed } = this.state;

        // 2. 计算移动速度（Idle时速度为0，而非完全禁用逻辑）
        let velocity = 0;
        if (current === 'Run') {
            velocity = runVelocity;
        } else if (current === 'Walk') {
            velocity = walkVelocity;
        }

        // 3. 移动方向计算（即使速度为0，仍需执行以保持状态同步）
        this.state.ease.set(this.state.key[1], 0, this.state.key[0])
            .multiplyScalar(velocity * delta);

        const azimuth = orbitControls.controls.getAzimuthalAngle();
        const angle = unwrapRad(
            Math.atan2(this.state.ease.x, this.state.ease.z) + azimuth
        );
        this.state.rotate.setFromAxisAngle(this.state.up, angle);
        this.state.ease.applyAxisAngle(this.state.up, azimuth);

        // 4. 更新位置（速度为0时，ease为0，位置不变）
        this.state.position.add(this.state.ease);
        // 相机位置同步：使用平滑插值替代直接相加，避免跳变
        camera.position.add(this.state.ease); // 相机位置同步移动（保持相对距离）

        orbitControls.controls.target.copy(this.state.position).add({ x: 0, y: 1, z: 0 });
        this.model.position.copy(this.state.position);

        // 5. 旋转控制：仅在移动状态（Run/Walk）时执行，Attack时让攻击旋转逻辑生效
        if (current === 'Run' || current === 'Walk') {
            this.model.quaternion.rotateTowards(this.state.rotate, rotateSpeed);
        }

        followGroup.position.copy(this.state.position);

        // 6. 地板移动逻辑保持不变
        const floor = this.getState().floor;
        const dx = this.state.position.x - floor.plane.position.x;
        const dz = this.state.position.z - floor.plane.position.z;
        if (Math.abs(dx) > floor.floorDecal) floor.plane.position.x += dx;
        if (Math.abs(dz) > floor.floorDecal) floor.plane.position.z += dz;
    };

    dead = () => {
        if (this.checkAttackTime) {
            clearInterval(this.checkAttackTime);
            cancelAnimationFrame(this.checkAttackTime);
            this.checkAttackTime = null;
        }
    }

}
export default HeroControl;
