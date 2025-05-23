export default class GoldenCavalry {
  private position;
  private bonus: number[] = [0, 10, 20, 30, 40, 50, 60];

  constructor(initialPosition: number = 0) {
    this.position = initialPosition;
  }

  nextPosition() {
    this.position = this.position + 1;
    return this.position;
  }

  currentPosition() {
    return this.position;
  }

  getBonusTroops() {
    const bonusTroops = this.bonus[this.position];
    return bonusTroops;
  }

  getBonus() {
    return this.bonus;
  }
}
