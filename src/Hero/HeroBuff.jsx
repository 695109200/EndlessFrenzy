import { useGameStore } from '../Store/StoreManage';
import HeroBasics from './HeroBasics';

class HeroBuff extends HeroBasics {
    constructor(hero) {
        super();
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.collisionManager = this.getState().CollisionManager;
        this.hero = hero;
        this.init();
    }

    init() {
    }
    addBuff() {

    }

    removeBuff() {

    }
    dispose() {

    }
}
export default HeroBuff;