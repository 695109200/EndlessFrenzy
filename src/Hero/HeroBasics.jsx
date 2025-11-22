class HeroBasics {
    static state = {
        currentState: 'Idle',
        isAlive: true,
        level: 0,   //等级
        health: 5,
        damage: 2, //攻击力
        attackSpeed: 3.0,//攻击速度
        experience: 0, //当前经验
        experienceScope: 2, //吸附范围
        buff: [],
        debuff: [],
        skill: ["NormalBullet"]
    };

    constructor() {
        this.state = HeroBasics.state;
    }
}
export default HeroBasics;
