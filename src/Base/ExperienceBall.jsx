import * as THREE from 'three';
import { useGameStore } from '../Store/StoreManage';
import { gsap } from 'gsap';

class ExperienceBall {
    constructor(Experience, position) {
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.scene = this.getState().scene;
        this.floorPlane = this.getState().floor.plane;
        this.heroMesh = this.getState().HeroManage.hero;
        this.collisionManager = this.getState().CollisionManager;

        this.id = THREE.MathUtils.generateUUID();
        this.tag = 'experience_ball';
        this.ball = null;
        this.coreBall = null;
        this.glowLayer = null;

        this.Experience = Experience; // 经验值
        this.initialPosition = position;
        this.radius = 0.2;

        this.isLanded = false;
        this.isFollowing = false;
        this.updateFn = null

        this.BASE_FOLLOW_SPEED = 1;
        this.ACCELERATION = 6.0; //加速度
        this.currentFollowSpeed = this.BASE_FOLLOW_SPEED;

        this.init();
    }

    init() {
        this.updateFn = (delta) => {
            this.update(delta);
        };
        useGameStore.getState().addLoop(this.updateFn);
        this.createMesh();
        this.dropAnimation().then(() => {
            this.isLanded = true;
            this.breathingAnimation();
            this.initCollision();
        });
    }

    createMesh() {
        const ballGroup = new THREE.Group();
        const coreGeometry = new THREE.SphereGeometry(this.radius, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x66ff66,
            emissive: 0x66ff66,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9,
        });
        this.coreBall = new THREE.Mesh(coreGeometry, coreMaterial);
        this.coreBall.castShadow = true;
        this.coreBall.receiveShadow = true;
        ballGroup.add(this.coreBall);

        const glowGeometry = new THREE.SphereGeometry(this.radius * 1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x66ff66,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
        });
        this.glowLayer = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowLayer.castShadow = true;
        this.glowLayer.receiveShadow = true;

        ballGroup.add(this.glowLayer);

        ballGroup.position.copy(this.initialPosition);
        ballGroup.position.y += 1.5;

        this.ball = ballGroup;

        this.scene.add(this.ball);
    }

    dropAnimation() {
        const groundY = this.floorPlane.position.y + this.radius;

        return new Promise(resolve => {
            const tl = gsap.timeline({
                onComplete: resolve
            });

            tl.to(this.ball.position, {
                y: groundY,
                duration: 1.6,
                ease: "bounce.out"
            }, 0);

            tl.to(this.ball.position, {
                x: this.initialPosition.x + (Math.random() - 0.5) * 5,
                z: this.initialPosition.z + (Math.random() - 0.5) * 5,
                duration: 1.6,
                ease: "power2.out"
            }, 0);
        });
    }

    breathingAnimation() {
        gsap.to(this.ball.scale, {
            x: 1.15,
            y: 1.15,
            z: 1.15,
            duration: 1.0,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });

        gsap.to(this.glowLayer.material, {
            opacity: 0.4,
            duration: 0.5,
            yoyo: true,
            repeat: -1,
            ease: "power1.inOut"
        });
    }

    startFollowHero() {
        if (this.isFollowing) return

        this.isFollowing = true;
        this.currentFollowSpeed = this.BASE_FOLLOW_SPEED;

        gsap.killTweensOf(this.ball.scale);
        gsap.killTweensOf(this.glowLayer.material);
    }

    update(deltaTime) {
        if (!this.isLanded || !this.heroMesh || !this.ball) return;

        if (this.isFollowing) {

            this.currentFollowSpeed += this.ACCELERATION * deltaTime;

            const targetPosition = this.heroMesh.position.clone();
            const ballPosition = this.ball.position;

            targetPosition.y += this.radius;

            const direction = targetPosition.clone().sub(ballPosition);

            direction.normalize();

            const moveDistance = this.currentFollowSpeed * deltaTime;
            this.ball.position.add(direction.multiplyScalar(moveDistance));
        }
    }

    initCollision() {
        this.collisionManager.register({
            id: this.id,
            mesh: this.ball,
            tag: this.tag,
            onCollision: this.handleCollision.bind(this)
        });
    }

    handleCollision(otherObject) {
        if (otherObject.tag === "hero_pickup_range") {
            this.startFollowHero();
        }

        if (otherObject.tag === 'hero') {
            this.getState().HeroManage.addExperience(this.Experience);
            gsap.killTweensOf(this.ball.position);
            gsap.killTweensOf(this.ball.scale);
            if (this.glowLayer) {
                gsap.killTweensOf(this.glowLayer.material);
            }

            this.dispose();
        }
    }

    dispose() {
        const { removeLoop } = useGameStore.getState();
        if (this.updateFn && removeLoop) {
            removeLoop(this.updateFn);
        }

        if (this.collisionManager) {
            this.collisionManager.unregister(this.id);
        }

        if (this.ball) {
            this.scene.remove(this.ball);

            if (this.coreBall) {
                this.coreBall.geometry.dispose();
                this.coreBall.material.dispose();
            }

            if (this.glowLayer) {
                this.glowLayer.geometry.dispose();
                this.glowLayer.material.dispose();
            }

            this.ball = null;
        }
    }
}

export default ExperienceBall;