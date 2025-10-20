import * as THREE from 'three';

class HeroBasics {
    static state = {
        current: 'Idle', // 将 current 作为对象属性
        key: [0, 0, 0],
        ease: new THREE.Vector3(),
        rotate: new THREE.Quaternion(),
        fadeDuration: 0.5,
        runVelocity: 1.8,
        rotateSpeed: 0.15,
        up: new THREE.Vector3(0, 1, 0),
        position: new THREE.Vector3(),
        targetQuaternion: new THREE.Quaternion(), // 目标旋转（朝向最近怪物）
        isRotating: false, // 是否正在转向目标
        isAttacking: false
    };

    constructor() {
        this.level = 0
        this.health = 5
        this.attack = 10
        this.attackSpeed = 2     //每秒攻击多少次
        this.lastAttackTime = 0
        this.alive = true
        this.state = HeroBasics.state;
    }
}
export default HeroBasics;
