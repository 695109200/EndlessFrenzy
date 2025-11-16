import { useGameStore, useDefaultSetting } from '../Store/StoreManage';
import HeroBasics from './HeroBasics';
import * as THREE from 'three';

class HeroControl extends HeroBasics {
    constructor(model) {
        super();
        this.setData = useGameStore.getState().setData;
        this.heroAnimate = useGameStore.getState().HeroManage.HeroAnimate;
        this.getState = useGameStore.getState;
        this.model = model;
        this.rotateSmoothness = 50.0;
        this.minRotateAngle = 0.001;
        this.runVelocity = 6.8;
        this.position = new THREE.Vector3();
        this.up = new THREE.Vector3(0, 1, 0);
        this.ease = new THREE.Vector3();
        this.key = [0, 0, 0];
        this.updateFn = null
        this.init();
    }

    init() {
        this.updateFn = (delta) => {
            this.update(delta);
        };
        useGameStore.getState().addLoop(this.updateFn);
        this.bindEvent();
    }

    update = (delta) => {
        this.move(delta);
    };

    handleKeyDown = (event) => {
        const heroAttack = this.getState().HeroManage.HeroAttack;
        heroAttack?.interruptAttack();

        const key = this.key;
        switch (event.code) {
            case 'ArrowUp': case 'KeyW':
                key[0] = -1;
                break;
            case 'ArrowDown': case 'KeyS':
                key[0] = 1;
                break;
            case 'ArrowLeft': case 'KeyA':
                key[1] = -1;
                break;
            case 'ArrowRight': case 'KeyD':
                key[1] = 1;
                break;
            default: return;
        }
        this.state.currentState = (key[0] !== 0 || key[1] !== 0) ? 'Run' : 'Idle';
    };

    handleKeyUp = (event) => {
        const key = this.key;
        switch (event.code) {
            case 'ArrowUp': case 'KeyW':
                key[0] = key[0] < 0 ? 0 : key[0];
                break;
            case 'ArrowDown': case 'KeyS':
                key[0] = key[0] > 0 ? 0 : key[0];
                break;
            case 'ArrowLeft': case 'KeyA':
                key[1] = key[1] < 0 ? 0 : key[1];
                break;
            case 'ArrowRight': case 'KeyD':
                key[1] = key[1] > 0 ? 0 : key[1];
                break;
            default: return;
        }
        this.state.currentState = (key[0] !== 0 || key[1] !== 0) ? 'Run' : 'Idle';
    };

    bindEvent = () => {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', () => {

        });
    };

    move = (delta) => {
        const { orbitControls, camera, followGroup } = this.getState();

        const moveDir = new THREE.Vector3(
            this.key[1],
            0,
            this.key[0]
        );

        if (moveDir.lengthSq() > 0.001) {
            moveDir.normalize();
        }

        const moveDistance = this.runVelocity * delta;
        this.ease.copy(moveDir).multiplyScalar(moveDistance);

        const azimuth = orbitControls.controls.getAzimuthalAngle();
        this.ease.applyAxisAngle(this.up, azimuth);

        this.calculate360Rotation(moveDir, azimuth);

        this.position.add(this.ease);
        camera.position.add(this.ease);
        orbitControls.controls.target.copy(this.position).add({ x: 0, y: 1, z: 0 });
        this.model.position.copy(this.position);

        if (this.state.currentState === 'Run' || this.state.currentState === 'Walk') {
            this.smoothRotate(delta);
        }

        followGroup.position.copy(this.position);

        const floor = this.getState().floor;
        const dx = this.position.x - floor.plane.position.x;
        const dz = this.position.z - floor.plane.position.z;
        if (Math.abs(dx) > floor.floorDecal) floor.plane.position.x += dx;
        if (Math.abs(dz) > floor.floorDecal) floor.plane.position.z += dz;
    };

    calculate360Rotation = (moveDir, azimuth) => {
        const worldDir = moveDir.clone().applyAxisAngle(this.up, azimuth);

        const targetQuat = new THREE.Quaternion();
        targetQuat.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            worldDir
        );

        const currentQuat = this.model.quaternion;
        if (currentQuat.dot(targetQuat) < 0) {
            targetQuat.x = -targetQuat.x;
            targetQuat.y = -targetQuat.y;
            targetQuat.z = -targetQuat.z;
            targetQuat.w = -targetQuat.w;
        }

        this.state.targetRotation = targetQuat;
    };

    smoothRotate = (delta) => {
        const { targetRotation } = this.state;
        if (!targetRotation) return;

        const angleDiff = this.model.quaternion.angleTo(targetRotation);
        if (angleDiff < this.minRotateAngle) {
            this.model.quaternion.copy(targetRotation);
            return;
        }

        const rotateStep = this.rotateSmoothness * delta * (angleDiff / Math.PI);
        this.model.quaternion.rotateTowards(targetRotation, rotateStep);
    };

    dispose() {
        this.updateFn = null
    }
}

export default HeroControl;