import { create } from 'zustand';
import * as THREE from 'three';

// 模型加载路径字典
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
    defaultHero: '女警',  // 默认角色
    setData: (key, value) => set((state) => ({ [key]: value }))
}));

// 游戏数据
export const useGameStore = create((set, get) => ({
    container: null,
    scene: null,
    renderer: null,
    camera: null,
    orbitControls: null,
    clock: new THREE.Clock(),
    light: null,
    HeroManage: null,
    MonsterManage: null,
    ActionManage: null,
    LoopArr: [],
    FPS: 60,
    floor: null,
    followGroup: null,
    setData: (key, value) => set((state) => ({ [key]: value })),
    addLoop: (fn) => set((state) => {
        // 检查函数是否已存在，不存在才添加
        if (!state.LoopArr.includes(fn)) {
            return { LoopArr: [...state.LoopArr, fn] };
        }
        return state; // 已存在则不更新
    })
}));

if (import.meta.env.DEV) {
    window.game = useGameStore;
}