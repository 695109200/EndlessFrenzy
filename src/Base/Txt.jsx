import * as THREE from 'three';
import { useGameStore } from '../Store/StoreManage';
import { gsap } from 'gsap';

class Txt {
    constructor(targetMesh) {
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.scene = this.getState().scene;
        this.targetMesh = targetMesh;
        this.offset = 3
        this.pixelRatio = window.devicePixelRatio || 1;
        this.textGroup = new THREE.Group();
        this.color = '#FFF'
        this.scene.add(this.textGroup)
        this.updateFn = null
        this.init()
    }

    init() {
        this.updateFn = (delta) => {
            this.update(delta);
        };
        useGameStore.getState().addLoop(this.updateFn);
    }

    update(delta) {
        if (!this.targetMesh) return;
        const pos = new THREE.Vector3();
        this.targetMesh.getWorldPosition(pos);
        this.textGroup.position.copy(pos).add(new THREE.Vector3(0, this.offset, 0));
    }

    createCanvasTexture(text) {

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const logicFontSize = 8;
        const padding = 20;

        context.font = `${logicFontSize}px Arial`;
        const metrics = context.measureText(text);
        const logicTextWidth = metrics.width;

        const logicWidth = logicTextWidth + padding;
        const logicHeight = logicFontSize + padding;

        canvas.width = logicWidth * this.pixelRatio;
        canvas.height = logicHeight * this.pixelRatio;

        canvas.style.width = `${logicWidth}px`;
        canvas.style.height = `${logicHeight}px`;

        context.scale(this.pixelRatio, this.pixelRatio);

        context.font = `${logicFontSize}px Arial`;

        context.fillStyle = 'rgba(0, 0, 0, 0.0)';
        context.fillRect(0, 0, logicWidth, logicHeight);

        context.textAlign = 'center';
        context.textBaseline = 'middle';
        console.log(this.color)
        context.fillStyle = this.color;

        context.fillText(text, logicWidth / 2, logicHeight / 2 + 2); // 调整 +2 略微修正基线

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        return texture;
    }

    showTxt(txt, offset, color) {
        this.offset = offset
        this.color = color
        const text = String(txt);
        const texture = this.createCanvasTexture(text);

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            depthTest: false,
            depthWrite: false,
        });

        const sprite = new THREE.Sprite(material);

        const aspect = texture.image.width / texture.image.height;
        const spriteHeight = 1.5;
        sprite.scale.set(spriteHeight * aspect, spriteHeight, 1);

        sprite.position.set(0, 0, 0);

        this.textGroup.add(sprite);

        const duration = 1.5;
        const travelHeight = 2;

        gsap.timeline({
            onComplete: () => {
                this.textGroup.remove(sprite);
                material.dispose();
                texture.dispose();
            }
        })
            .to(sprite.position, {
                duration: duration,
                y: `+=${travelHeight}`,
                ease: "power2.out"
            }, 0)

            .to(material, {
                duration: duration * 0.75,
                opacity: 0
            }, duration * 0.25);
    }

    dispose() {
        const { removeLoop } = useGameStore.getState();
        if (this.updateFn && removeLoop) {
            removeLoop(this.updateFn);
        }

        gsap.killTweensOf(this.textGroup.children);

        this.textGroup.traverse((child) => {
            if (child.isSprite) {
                child.material.dispose();
                if (child.material.map) child.material.map.dispose();
            }
        });
        if (this.scene) this.scene.remove(this.textGroup);
    }
}

export default Txt;