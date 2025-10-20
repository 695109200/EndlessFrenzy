import React, { useRef, useEffect } from 'react';

import ActionManage from '../Action/ActionManage';

import { createMainCamera } from './Camera';
import Controls from './Controls';
import Light from './Light';
import Floor from './Floor';

import { useGameStore, useDefaultSetting } from '../Store/StoreManage';

class GameScene {
    constructor(container) {
        this.setData = useGameStore.getState().setData
        this.getState = useGameStore.getState
        this.container = container
        this.init()
    }

    init = async () => {
        this.setData('container', this.container);
        this.initCore();
        this.update()
        await this.initModules();
    }

    // 初始化核心资源（场景、相机、渲染器、时钟等）
    async initCore() {
        const { setData } = useGameStore.getState();
        const container = useGameStore.getState().container;

        // 场景
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x5e5d5d);
        scene.fog = new THREE.Fog(0x5e5d5d, 2, 40);
        setData('scene', scene);

        // 相机
        const camera = createMainCamera();
        setData('camera', camera);

        // 渲染器
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.5;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        setData('renderer', renderer);

        // 跟随组（用于相机/角色跟随）
        const followGroup = new THREE.Group();
        scene.add(followGroup);
        setData('followGroup', followGroup);

        this.addEventListeners();
    }

    // 初始化子模块（灯光、角色、地板等）
    async initModules() {
        const { scene, camera, renderer, followGroup, setData } = useGameStore.getState();

        setData('orbitControls', new Controls(camera, renderer.domElement));

        setData('light', new Light(scene, followGroup));

        setData('floor', new Floor(scene, renderer));

        setData('ActionManage', new ActionManage());
    }

    update = () => {
        const { scene, renderer, camera, LoopArr, FPS } = useGameStore.getState();
        const minFrameInterval = 1000 / FPS;

        if (!this.lastFrameTime) {
            this.lastFrameTime = performance.now();
        }

        const currentTime = performance.now();
        const frameInterval = currentTime - this.lastFrameTime;

        if (frameInterval >= minFrameInterval) {
            const delta = frameInterval / 1000;
            renderer.render(scene, camera);
            LoopArr.forEach(fn => fn(delta));
            this.lastFrameTime = currentTime;
        }

        requestAnimationFrame(() => this.update());
    };

    // 事件监听（窗口大小变化）
    addEventListeners() {
        const handleResize = () => {
            const { container, camera, renderer } = useGameStore.getState();
            if (!container || !camera || !renderer) return;

            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };

        window.addEventListener('resize', handleResize);
        // 保存清理函数到状态，便于组件卸载时调用
        useGameStore.getState().setData('resizeHandler', handleResize);
    }

    // 销毁场景（释放所有资源）
    dispose() {
        const {
            container, scene, renderer, orbitControls,
            HeroManage, MonsterManage, light, floor,
            animationId, resizeHandler, setData
        } = useGameStore.getState();

        // 停止动画循环
        if (animationId) cancelAnimationFrame(animationId);

        // 移除事件监听
        if (resizeHandler) window.removeEventListener('resize', resizeHandler);

        // 销毁子模块
        // HeroManage?.dispose();
        // MonsterManage?.dispose();
        // light?.dispose();
        // floor?.dispose();
        // orbitControls?.dispose();

        // 清理渲染器
        if (container && renderer?.domElement) {
            container.removeChild(renderer.domElement);
            renderer.dispose();
        }

        // 清空场景
        scene?.clear();

        // 重置全局状态
        setData('scene', null);
        setData('renderer', null);
        setData('camera', null);
        setData('orbitControls', null);
        setData('clock', null);
        setData('container', null);
    }
}

const CharacterController = () => {
    // DOM 容器引用（渲染器挂载点）
    const containerRef = useRef(null);
    // 游戏场景实例引用（避免重复创建）
    const sceneInstanceRef = useRef(null);

    // 初始化场景（组件挂载时）
    useEffect(() => {
        if (!containerRef.current) return;

        // 创建游戏场景实例（传入 DOM 容器）
        sceneInstanceRef.current = new GameScene(containerRef.current);

        // 组件卸载时销毁场景
        return () => {
            sceneInstanceRef.current?.dispose();
            sceneInstanceRef.current = null;
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
            }}
        />
    );
};

export default CharacterController;