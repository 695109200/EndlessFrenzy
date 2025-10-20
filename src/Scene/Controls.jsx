// src/components/Controls.jsx
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useGameStore, useDefaultSetting } from '../Store/StoreManage';

class Controls {
    constructor(camera, domElement) {
        this.camera = camera
        this.domElement = domElement
        this.controls = null
        this.init()
    }

    init() {
        this.controls = new OrbitControls(this.camera, this.domElement);
        this.controls.target.set(0, 1, 0);
        this.controls.enableDamping = true;
        this.controls.enablePan = false;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
        this.update();
        useGameStore.getState().addLoop(() => {
            this.update();
        });
    }
    update() {
        this.controls.update(); // 阻尼效果需要每帧调用
    }
}

export default Controls