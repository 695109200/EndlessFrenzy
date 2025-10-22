import { cloneGroupWithoutAnim, loadGLTFModel, updateMixer, unwrapRad, checkSphereCollision, createModelWithCollisionProxy } from '../Utils/Utils';
import React, { userefs, useEffect, useState } from 'react';
import { useGameStore } from '../Store/StoreManage';
import MonsterAI from './MonsterAI'

class MonsterManage {
    constructor(scene) {
        this.setData = useGameStore.getState().setData
        this.getState = useGameStore.getState
        this.scene = scene
        this.monsterGroup = new THREE.Group()
        this.monsterAIs = [];
        this.monsterCache = null;
        this.monsterAnimations = null;
        this.loadPromise = new Promise(async (resolve) => {
            await this.init();
            resolve();
        });
    }

    async init() {
        await this.loadMonsterModel()
        this.scene.add(this.monsterGroup);
    }

    waitForLoad() {
        return this.loadPromise;
    }

    // 加载怪物模型
    loadMonsterModel = async () => {
        const gltf = await loadGLTFModel('/Model/Monster/melee_minion_-_chaos.glb');
        const model = gltf.scene;

        // 1. 模型基础设置（缩放、阴影、材质）
        model.scale.set(0.005, 0.005, 0.005);
        model.traverse((object) => {
            if (object.isMesh || object.isSkinnedMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                // 克隆材质（避免共享材质导致修改时影响所有模型）
                object.material = object.material.clone();
                object.material.metalness = 1.0;
                object.material.roughness = 0.2;
                object.material.color.set(1, 1, 1);
                if (object.material.map) {
                    object.material.metalnessMap = object.material.map;
                }
            }
        });

        // 2. 缓存模型根节点和动画片段（关键：保留动画数据）
        this.monsterCache = model;
    };

    // 添加怪物
    async addMonsters() {
        const HeroManage = this.getState().HeroManage;
        // 检查缓存是否就绪（模型和动画都需存在）
        if (!this.monsterCache) {
            console.warn('怪物模型或动画未加载完成，无法添加怪物');
            return;
        }

        // 1. 克隆带完整动画的模型
        const monsterMesh = cloneGroupWithoutAnim(this.monsterCache);

        // 2. 设置随机位置（克隆体独立位置，不影响原始缓存）
        const randomPos = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            0,
            (Math.random() - 0.5) * 20
        );
        monsterMesh.position.copy(randomPos);
        // 重置旋转（避免继承原始模型的旋转）
        monsterMesh.rotation.set(0, Math.random() * Math.PI * 2, 0); // 随机初始朝向

        // 3. 添加到怪物组（层级管理）
        this.monsterGroup.add(monsterMesh);

        // 4. 创建独立 AI（传入带动画的克隆体，后续可控制动画切换）
        const monsterAI = new MonsterAI(monsterMesh, HeroManage);
        monsterMesh.monsterAI = monsterAI
        this.monsterAIs.push(monsterAI);

        // this.lifetimeTimer = setTimeout(() => {
        //     this.removeMonster(monsterAI);
        // }, 0.5 * 1000);

    }

    // 每帧更新所有怪物（调用各自的AI）
    moveToHero(delta) {
        this.monsterAIs.forEach(ai => ai.update(delta));
    }

    // 删除怪物
    removeMonster(monsterAI) {
        const { monster } = monsterAI;
        if (!monster) return;

        // 1. 清除计时器（避免计时未结束却已销毁的情况）
        if (monsterAI.lifetimeTimer) {
            clearTimeout(monsterAI.lifetimeTimer);
        }

        // 2. 从场景/怪物组中移除模型
        this.monsterGroup.remove(monster);
        monster.removeFromParent(); // 彻底移除父级引用

        // 3. 销毁模型的几何体、材质等资源（释放内存）
        this.dispose(monster);

        // 4. 从AI数组中清除引用
        const index = this.monsterAIs.indexOf(monsterAI);
        if (index !== -1) {
            this.monsterAIs.splice(index, 1);
        }

        // 5. 手动解除引用，帮助GC回收
        monsterAI.monster = null;
        monsterAI.heroManage = null;
    }

    // 销毁
    dispose(monster) {
        monster.traverse(child => {
            if (child.isMesh || child.isSkinnedMesh) {
                // 销毁几何体
                if (child.geometry) {
                    child.geometry.dispose();
                }
                // 销毁材质及纹理
                if (child.material) {
                    // 销毁纹理（如有）
                    if (child.material.map) child.material.map.dispose();
                    if (child.material.normalMap) child.material.normalMap.dispose();
                    // 销毁材质
                    child.material.dispose();
                }
            }
        });
    }
};

export default MonsterManage;
