import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SceneContainer from './Scene/SceneManage'
import * as THREE from 'three';

import MemoryMonitor from './Utils/MemoryLeakMonitor';
const memoryMonitor = new MemoryMonitor();

memoryMonitor.start(2000);
window.addEventListener('beforeunload', () => {
  memoryMonitor.stop();
});

// 例如在 src/main.js 中
if (import.meta.hot) {
  // 当当前模块或依赖变化时，强制刷新页面
  import.meta.hot.accept((newModule) => {
    location.reload(); // 全页刷新
  });
}
// 全局挂载THREE（配合之前的Vite配置）
window.THREE = THREE;
createRoot(document.getElementById('root')).render(
  <SceneContainer />
)
