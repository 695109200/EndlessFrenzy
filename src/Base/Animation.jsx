import * as THREE from 'three';
import { useGameStore } from '../Store/StoreManage';
import { updateMixer } from '../Utils/Utils';
import { gsap } from 'gsap';

class Animation {
    constructor(mesh, animations, AnimationStates, state, defaultState) {
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.mesh = mesh;
        this.animations = animations;
        this.mixer = new THREE.AnimationMixer(this.mesh);
        this.actions = {};
        this.AnimationStates = AnimationStates
        this.state = state
        this.defaultState = defaultState
        this.lastState = null;
        this.fadeing = false;
        this.playingDeathAnima = false
        this.init();
    }

    init() {
        this.setAnimate();
        this.bindEvent()
        useGameStore.getState().addLoop((delta) => {
            this.update(delta);
        });
    }

    setAnimate = () => {
        Object.keys(this.AnimationStates).forEach(state => {
            const { clip: clipName, isSingle } = this.AnimationStates[state];
            const clip = this.animations.find(anim => anim.name.includes(clipName));
            if (!clip) {
                return;
            }
            const action = this.mixer.clipAction(clip);
            action.loop = isSingle ? THREE.LoopOnce : THREE.LoopRepeat;
            action.clampWhenFinished = isSingle;
            action.setEffectiveTimeScale(1);
            action.stop();
            this.actions[state] = action;
        });

        this.actions.Idle.play();
        this.state.currentState = this.defaultState;
        this.lastState = this.defaultState;
    };

    bindEvent() {
        this.mixer.addEventListener('finished', (e) => {
            const finishedActionName = Object.keys(this.actions).find(key => this.actions[key] === e.action);
        });

        this.mixer.addEventListener('loop', (e) => {
            const finishedActionName = Object.keys(this.actions).find(key => this.actions[key] === e.action);
            if (finishedActionName == 'Attack') {
                const heroAttack = this.getState().HeroManage.HeroAttack;
                if (heroAttack) {
                    heroAttack.isAttacking = false;
                }
            }
        });
    }

    update = (delta) => {
        this.switchState(this.state.currentState);
        updateMixer(this.mixer, delta);
    };

    switchState(targetState, fadeDuration = 0.2) {
        if (!this.AnimationStates[targetState]) {
            targetState = 'Idle';
        }

        const currentState = this.lastState;

        if (currentState === targetState) {
            this.actions[currentState]?.play();
            return;
        }

        const oldAction = this.actions[currentState];
        const newAction = this.actions[targetState];

        let timeScale = 1;
        if (targetState === 'Attack') {
            timeScale = this.state.attackSpeed;
        }

        if (!this.AnimationStates[targetState].from.includes(currentState)) {
            if (oldAction) oldAction.stop();
            newAction?.reset().play();
            this.lastState = targetState;
            return;
        }

        if (oldAction) {
            oldAction.setEffectiveTimeScale(1);
            oldAction.fadeOut(fadeDuration);
        }

        newAction.setEffectiveTimeScale(timeScale)
            .reset()
            .fadeIn(fadeDuration)
            .play();

        this.lastState = targetState;
    }

    heroDeathAnimate() {
        if (this.playingDeathAnima) return;
        this.playingDeathAnima = true;
        const duration = 2.5;
        gsap.to(this.mesh.position, {
            y: this.mesh.position.y - 2,
            duration,
            ease: "power2.out",
        });
        setTimeout(() => {
            this.mesh.visible = false
        }, 1000)
    }

    dispose() {
        const { removeLoop } = useGameStore.getState();
        if (this.updateFn && removeLoop) removeLoop(this.updateFn);
        this.updateFn = null;
        this.mixer = null
    }
}

export default Animation;