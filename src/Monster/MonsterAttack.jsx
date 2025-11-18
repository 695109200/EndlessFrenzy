import { useGameStore } from '../Store/StoreManage';
class MonsterAttack {
    constructor() {
        this.setData = useGameStore.getState().setData;
        this.getState = useGameStore.getState;
        this.init()
    }

    init() {

    }
}
export default MonsterAttack;
