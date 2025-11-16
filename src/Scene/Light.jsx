import * as THREE from 'three'; // 确保导入 THREE
import { loadHDRTexture } from '../Utils/Utils';
class Light {
    constructor(scene, followGroup) {
        this.dirLight = null
        this.scene = scene
        this.followGroup = followGroup
        this.init()
    }

    init() {
        this.dirLight = new THREE.DirectionalLight(0xffffff, 8);
        this.dirLight.position.set(-2, 5, -3);
        this.dirLight.castShadow = true;

        const shadowCam = this.dirLight.shadow.camera;

        const shadowSize = 30;
        shadowCam.top = shadowSize;
        shadowCam.right = shadowSize;
        shadowCam.bottom = -shadowSize;
        shadowCam.left = -shadowSize;

        shadowCam.near = 0.5;
        shadowCam.far = 15;
        this.dirLight.shadow.mapSize.set(2048, 2048);
        this.dirLight.shadow.radius = 4.0
        // const helper = new THREE.CameraHelper(shadowCam);
        // this.scene.add(helper);

        this.followGroup.add(this.dirLight);
        this.followGroup.add(this.dirLight.target);
        this.loadHDR()
    }


    async loadHDR() {
        const hdrTexture = await loadHDRTexture('/textures/lobe.hdr');
        this.scene.environment = hdrTexture;
        this.scene.environmentIntensity = 1.5;
    }
}

export default Light;