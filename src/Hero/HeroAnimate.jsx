import { updateMixer } from '../Utils/Utils';
import { useGameStore } from '../Store/StoreManage';
import HeroBasics from './HeroBasics';

class HeroAnimate extends HeroBasics {
    constructor(model, animations) {
        super();
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.model = model;
        this.animations = animations;

        this.mixer = null;
        this.actions = {};
        this.lastCurrent = null; // 记录上一个播放的动画，用于过渡

        this.init();
    }

    init() {
        this.setAnimate();
        useGameStore.getState().addLoop((delta) => {
            this.checkAnimate(delta);
        });
    }

    // 新增：获取攻击速度并同步动画播放速度
    // 在 HeroAnimate 的 syncAttackAnimWithSpeed 中增加强制限制
    syncAttackAnimWithSpeed = () => {
        const heroControl = this.getState().HeroManage.HeroControl;
        const attackSpeed = heroControl?.attackSpeed || 2;
        const attackInterval = 1 / attackSpeed; // 攻击间隔（秒）

        const attackAction = this.actions.Attack;
        if (!attackAction) return;

        const attackAnimDuration = attackAction.getClip().duration;
        // 计算理论播放倍率（让动画时长 = 攻击间隔）
        let timeScale = attackAnimDuration / attackInterval;

        // 强制：若动画原始时长 > 攻击间隔，倍率至少为 1.1（确保动画更快结束）
        if (attackAnimDuration > attackInterval) {
            timeScale = Math.max(timeScale, 1.1);
        }

        attackAction.setEffectiveTimeScale(timeScale);
        // 打印实际动画时长（方便验证）
    };


    setAnimate = () => {
        this.mixer = new THREE.AnimationMixer(this.model);
        // 初始化动画动作（确保与state.current的可能值对应）
        this.actions = {
            Idle: this.mixer.clipAction(this.animations.find(item => item.name.includes('Idle1'))),
            Run: this.mixer.clipAction(this.animations.find(item => item.name.includes('Run_Normal'))),
            Attack: this.mixer.clipAction(this.animations.find(item => item.name == 'caitlyn_skin11_attack1.anm')),
        };

        // 启用所有动作并初始化状态
        Object.values(this.actions).forEach(action => {
            action.enabled = true;
            action.setEffectiveTimeScale(1);
            action.stop(); // 初始全部停止，等待状态触发
        });

        this.syncAttackAnimWithSpeed()
        // 初始播放Idle动画
        this.actions.Idle.play();
        this.lastCurrent = 'Idle';
        this.state.current = 'Idle';
    };

    // 每帧检查并切换动画
    checkAnimate = (delta) => {
        const { current, fadeDuration } = this.state;

        if (current !== this.lastCurrent) {
            this.switchAnimation(this.lastCurrent, current, fadeDuration);
            this.lastCurrent = current; // 更新记录的状态
        }

        updateMixer(this.mixer, delta)
    };

    // 动画过渡核心逻辑：淡入新动画，淡出旧动画
    switchAnimation = (oldName, newName, fadeDuration) => {
        const newAction = this.actions[newName];
        const oldAction = this.actions[oldName];

        if (!newAction || !oldAction) {
            console.warn(`动画切换失败：${oldName} → ${newName}`);
            return;
        }

        // 若切换到攻击动画，再次确认速度同步（防止动态修改攻击速度后失效）
        if (newName === 'Attack') {
            this.syncAttackAnimWithSpeed();
        }

        // 重置新动画
        newAction.reset();
        newAction.weight = 1.0;
        newAction.stopFading();
        oldAction.stopFading();

        // 同步时间（仅非Idle动画）
        if (newName !== 'Idle') {
            const oldDuration = oldAction.getClip().duration || 1;
            const newDuration = newAction.getClip().duration || 1;
            newAction.time = oldAction.time * (newDuration / oldDuration);
        }

        // 关键：用公开API crossFadeFrom 替代 _scheduleFading
        newAction.crossFadeFrom(oldAction, fadeDuration, true); // 从旧动画淡入
        newAction.play();
    };

    isAnimationFinished = (clipName) => {
        const action = this.actions[clipName];
        if (!action) return true;
        return action.time >= action.getClip().duration * 0.99;
    };

}

export default HeroAnimate;