class RomiContent {
  constructor() {
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  handleMessage(message, sender, sendResponse) {
    return true;
  }
}

new RomiContent();
