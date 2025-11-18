class HeroBasics {
    static state = {
        currentState: 'Idle',
        isAlive: true,
        level: 0,
        health: 5,
        damage: 1,
        attackSpeed: 3.0,
        experience: 0,
        experienceScope: 2,
        buff: [],
        debuff: [],
        skill: []
    };

    constructor() {
        this.state = HeroBasics.state;
    }
}
export default HeroBasics;
