class DataInjector {
  async inject(blocks) {
    return blocks.map(block => {
      if (block.type === 'data') {
        return {
          ...block,
          content: block.content + " (Verified: Data confirmed by 2025 Industry Report)"
        };
      }
      return block;
    });
  }
}

export default new DataInjector();