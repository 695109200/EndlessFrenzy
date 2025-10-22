import * as THREE from 'three';

class HeroBasics {
    static state = {
        current: 'Idle',
        key: [0, 0, 0],
        ease: new THREE.Vector3(),
        rotate: new THREE.Quaternion(),
        fadeDuration: 0.5,
        runVelocity: 1.8,
        rotateSpeed: 15,
        rotationThreshold: 0.01,
        up: new THREE.Vector3(0, 1, 0),
        position: new THREE.Vector3(),
        targetQuaternion: new THREE.Quaternion(),

        // 角色动画
        isAttacking: false,
        isMoving: false,
        isRotatingToTarget: false,

        // 角色生命状态
        isAlive: true,
        level: 0,
        health: 5,

        // 角色攻击状态
        lastAttackTime: 0,
        attackTimer: null,
        attack: 10,
        attackSpeed: 2.0     //每秒攻击多少次
    };

    constructor() {
        this.state = HeroBasics.state;
    }
}
export default HeroBasics;
