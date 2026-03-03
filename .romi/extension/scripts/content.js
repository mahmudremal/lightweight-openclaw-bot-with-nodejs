class RomiContent {
  constructor() {
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  handleMessage(message, sender, sendResponse) {
    if (message.type === "keepAlive") {
      console.log("Romi: Service worker is still active.");
      sendResponse({ success: true });
    }
    return true;
  }
}

new RomiContent();
