class Memory {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      keyPoints: [],
      claims: [],
      usedKeywords: [],
      toneState: "",
      narrativeState: ""
    };
  }

  update(newState) {
    this.state = { ...this.state, ...newState };
  }

  get() {
    return this.state;
  }
}

export default new Memory();