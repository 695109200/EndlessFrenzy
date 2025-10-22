// src/components/SceneElements.jsx
import { useGameStore, useDefaultSetting } from '../Store/StoreManage';
import HeroManage from '../Hero/HeroManage';
import MonsterManage from '../Monster/MonsterManage';

class ActionManage {
    constructor() {
        this.setData = useGameStore.getState().setData
        this.getState = useGameStore.getState
        this.init()

    }

    async init() {

        await this.initGame()
        useGameStore.getState().addLoop((delta) => {
            this.update(delta);
        });
    }

    initGame = async () => {
        const { scene, camera, renderer, followGroup, setData } = useGameStore.getState();

        const heroManage = new HeroManage(scene, followGroup, camera, useDefaultSetting.getState().defaultHero);
        setData('HeroManage', heroManage);
        await heroManage.waitForLoad();

        const monsterManage = new MonsterManage(scene);
        setData('MonsterManage', monsterManage);
        await monsterManage.waitForLoad();

        setInterval(() => {
            monsterManage.addMonsters();
        }, 1000)
    }

    // 游戏主循环
    update(delta) {
        // const { HeroManage } = useGameStore.getState();
        // HeroManage.attack()

    }
}

export default ActionManage