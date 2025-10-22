import { updateMixer } from '../Utils/Utils';
import { useGameStore } from '../Store/StoreManage';
import * as THREE from 'three';

class Bullet {
    constructor(hero, monster, attackSpeed, onHitCallback) {
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;

        // 核心引用
        this.hero = hero; // 发射者（角色模型）
        this.monster = monster; // 目标（怪物模型）
        this.onHitCallback = onHitCallback; // 击中回调（必传）

        // 子弹属性
        this.speed = attackSpeed * 5; // 飞行速度（与攻击速度关联，可调整倍率）
        this.radius = 0.2; // 碰撞检测半径
        this.isFlying = false; // 飞行状态标记
        this.isHit = false; // 击中标记

        // 初始化子弹精灵和场景
        this.scene = this.getState().scene; // 从全局状态获取场景
        this.bulletSprite = this.createBulletSprite(); // 创建精灵子弹

        this.init();
    }

    init() {
        this.shotTarget()
        // 注册帧更新（控制飞行和碰撞）
        useGameStore.getState().addLoop((delta) => {
            if (this.isFlying && !this.isHit) {
                this.update(delta);
            }
        });
    }

    // 创建精灵子弹（使用精灵贴图）
    createBulletSprite() {
        // 1. 加载精灵贴图（这里用基础纹理示例，实际需替换为子弹贴图路径）
        const textureLoader = new THREE.TextureLoader();
        const bulletTexture = textureLoader.load('/Textures/bullet.png', (texture) => {
            // 贴图加载完成后设置精灵材质
            spriteMaterial.map = texture;
            spriteMaterial.needsUpdate = true;
        });

        // 2. 创建精灵材质（半透明、 additive 混合增强发光效果）
        const spriteMaterial = new THREE.SpriteMaterial({
            color: 0xffff00, // 子弹颜色（黄色，可根据需求调整）
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending // 叠加混合，适合发光效果
        });

        // 3. 创建精灵对象（大小可调整）
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.5, 0.5, 1); // 子弹大小（根据场景比例调整）
        sprite.visible = false; // 初始隐藏

        this.scene.add(sprite);
        return sprite;
    }

    shotTarget() {
        if (!this.hero || !this.monster || this.isFlying) return;

        const heroPos = new THREE.Vector3();
        this.hero.getWorldPosition(heroPos); 
        const heroForward = new THREE.Vector3(0, 0, 1);
        heroForward.applyQuaternion(this.hero.quaternion); 
        const startPos = heroPos.addScaledVector(heroForward, 1);

        const targetPos = new THREE.Vector3();
        this.monster.getWorldPosition(targetPos);
        targetPos.y += 0.5; 

        this.bulletSprite.position.copy(startPos);
        this.bulletSprite.visible = true;
        this.isFlying = true;
        this.isHit = false;

        this.targetPos = targetPos;
        this.direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize(); 
        this.totalDistance = startPos.distanceTo(targetPos);
    }

    // 帧更新：控制飞行和碰撞检测
    update = (delta) => {
        // 1. 计算当前帧飞行距离
        const moveDistance = this.speed * delta;
        const currentPos = this.bulletSprite.position.clone();

        // 2. 检查是否即将超过目标（避免子弹穿透）
        const distanceToTarget = currentPos.distanceTo(this.targetPos);
        if (distanceToTarget <= moveDistance || distanceToTarget < this.radius) {
            this.onHit(); // 触发击中逻辑
            return;
        }

        // 3. 移动子弹
        this.bulletSprite.position.addScaledVector(this.direction, moveDistance);

        // 4. 碰撞检测（可选：检测子弹是否中途碰撞其他物体）
        this.checkCollision();
    };

    checkCollision() {
        const monsterPos = new THREE.Vector3();
        this.monster.getWorldPosition(monsterPos);
        const bulletPos = this.bulletSprite.position;

        const distance = bulletPos.distanceTo(monsterPos);
        if (distance < this.radius + 0.5 && !this.isHit) {
            this.onHit();
        }
    }

    // 击中目标后的处理
    onHit() {
        if (this.isHit) return;

        this.isHit = true;
        this.isFlying = false;
        this.bulletSprite.visible = false; // 隐藏子弹

        this.playHitEffect();

        if (typeof this.onHitCallback === 'function') {
            this.onHitCallback({
                bullet: this,
                attacker: this.hero,
                target: this.monster
            });
        }

        setTimeout(() => {
            this.destroy();
        }, 300);
    }

    // 播放击中特效（精灵闪烁示例）
    playHitEffect() {
        const hitTexture = new THREE.TextureLoader().load('/Textures/hit_effect.png');
        const hitMaterial = new THREE.SpriteMaterial({
            map: hitTexture,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const hitSprite = new THREE.Sprite(hitMaterial);
        hitSprite.position.copy(this.targetPos);
        hitSprite.scale.set(1, 1, 1);
        this.scene.add(hitSprite);

        // 特效淡出动画
        let opacity = 1;
        const fadeTimer = setInterval(() => {
            opacity -= 0.1;
            hitSprite.material.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fadeTimer);
                this.scene.remove(hitSprite);
                hitMaterial.dispose();
                hitTexture.dispose();
            }
        }, 30);
    }

    // 销毁子弹（清理资源）
    destroy() {
        // 从场景移除子弹
        if (this.scene && this.bulletSprite) {
            this.scene.remove(this.bulletSprite);
        }

        // 释放材质和纹理资源（避免内存泄漏）
        if (this.bulletSprite?.material) {
            this.bulletSprite.material.dispose();
            if (this.bulletSprite.material.map) {
                this.bulletSprite.material.map.dispose();
            }
        }

        // 清空引用
        this.hero = null;
        this.monster = null;
        this.onHitCallback = null;
    }
}

export default Bullet;