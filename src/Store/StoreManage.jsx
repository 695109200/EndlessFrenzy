import { create } from 'zustand';
import * as THREE from 'three';

// 怪物字典
export const monsterDict = {
    "normalMonster": {
        stopDistance: 3,
        damage: 2,
        deathExperience: 2,
        attackSpeed: 1.0,
        attackAnimateTime: 0.2,  // 在攻击动画的什么时间开始触发攻击函数
        maxHealth: 10,
        AnimationStates: {
            Run: {
                from: ['Attack'],
                clip: 'Run'
            },
            Attack: {
                from: ['Run'],
                clip: 'Attack2',
                isSingle: false
            },
            Win: {
                from: ['Attack', 'Run'],
                clip: 'Win1'
            },
            Idle: {
                from: ['Attack', 'Run'],
                clip: 'Idle1'
            },
            Death: {
                from: ['Attack', 'Run'],
                clip: 'minion_melee_death3.anm',
                isSingle: true
            }
        },
        modelPath: "/Model/Monster/melee_minion_-_chaos.glb"
    },
    "rangedMonster": {
        stopDistance: 15,
        damage: 1,
        deathExperience: 1,
        maxHealth: 5,
        attackSpeed: 1.0,
        attackAnimateTime: 0.7,
        AnimationStates: {
            Run: {
                from: ['Attack'],
                clip: 'Run'
            },
            Attack: {
                from: ['Run'],
                clip: 'Attack2',
                isSingle: false
            },
            Win: {
                from: ['Attack', 'Run'],
                clip: 'Win1'
            },
            Idle: {
                from: ['Attack', 'Run'],
                clip: 'Idle1'
            },
            Death: {
                from: ['Attack', 'Run'],
                clip: 'minion_caster_chaos_death.anm',
                isSingle: true
            }
        },
        modelPath: "/Model/Monster/ranged_minion_-_chaos.glb"
    }
}

// 子弹模型加载路径字典
export const useBulletModelDict = create((set) => ({
    'NormalBullet': '/Model/Bullet/bullet.glb',
    'MagicProjectile': '/Model/Bullet/bullet.glb'
}));


// 角色模型加载路径字典
export const useHeroModelDict = create((set) => ({
    '女警': '/Model/Hero/pulsefire_caitlyn.glb'
}));

// 游戏默认设置
export const useDefaultSetting = create((set) => ({
    defaultCameraPos: {
        "x": -6.519497596566737,
        "y": 6.688921816040412,
        "z": -9.482592008647357
    },
    defaultHero: '女警',
    setData: (key, value) => set((state) => ({ [key]: value }))
}));

// 游戏数据
export const useGameStore = create((set, get) => ({
    // 渲染数据
    container: null,
    scene: null,
    renderer: null,
    camera: null,
    orbitControls: null,
    clock: new THREE.Clock(),
    light: null,
    floor: null,
    followGroup: null,
    LoopArr: [],
    FPS: 120,

    // 组件
    HeroManage: null,
    MonsterManage: null,
    ActionManage: null,
    SkillManage: null,
    CollisionManager: null,
    UIManage: null,

    setData: (key, value) => set((state) => ({ [key]: value })),
    addLoop: (fn) => set((state) => {
        if (!state.LoopArr.includes(fn)) {
            return { LoopArr: [...state.LoopArr, fn] };
        }
        return state;
    }),
    removeLoop: (fn) => set((state) => ({
        LoopArr: state.LoopArr.filter(loopFn => loopFn !== fn)
    }))
}));

if (import.meta.env.DEV) {
    window.game = useGameStore;
}