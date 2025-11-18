import * as THREE from 'three';
import { useGameStore } from '../Store/StoreManage';
import HeroBasics from './HeroBasics';

class HeroExperience extends HeroBasics {
    constructor(model) {
        super();
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.collisionManager = this.getState().CollisionManager; // 确保获取碰撞管理器

        this.hero = model;
        this.followGroup = this.getState().followGroup;

        this.experienceScopeRadius = this.state.experienceScope;

        this.experienceScopeMesh = null; // 经验吸取范围的 Mesh

        this.id = THREE.MathUtils.generateUUID();
        this.tag = 'hero_pickup_range';
        this.init();
    }

    init() {
        this.createExperienceScope();
        this.initCollision();
    }

    createExperienceScope() {
        const geometry = new THREE.CylinderGeometry(
            this.experienceScopeRadius, // 顶部半径
            this.experienceScopeRadius, // 底部半径
            50, // 高度
            32 // 分段数
        );

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // 绿色
            opacity: 0.0,
            transparent: true,
            wireframe: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.y = 25;

        this.experienceScopeMesh = mesh;

        this.followGroup.add(this.experienceScopeMesh);
    }

    initCollision() {
        this.collisionManager.register({
            id: this.id,
            mesh: this.experienceScopeMesh,
            tag: this.tag,
            onCollision: this.handleCollision.bind(this)
        });
    }

    handleCollision(otherObject) {

    }



    dispose() {
        if (this.collisionManager && this.experienceScopeMesh) {
            this.collisionManager.unregister(this.id);
        }

        if (this.experienceScopeMesh) {
            this.followGroup.remove(this.experienceScopeMesh);
            this.experienceScopeMesh.geometry.dispose();
            this.experienceScopeMesh.material.dispose();
            this.experienceScopeMesh = null;
        }
    }
}
export default HeroExperience;