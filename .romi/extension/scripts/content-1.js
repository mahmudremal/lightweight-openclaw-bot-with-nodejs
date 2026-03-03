class RomiContent {
  constructor() {
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement("style");
    style.id = "romi-content-styles";
    style.textContent = `
      .extension-processing-state {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        display: none;
      }
      .extension-processing-state.active {
        display: block;
      }
      .state_container--processing {
        width: 12px;
        height: 12px;
        background: #6366f1;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
      }
    `;
    document.head.appendChild(style);

    const indicator = document.createElement("div");
    indicator.id = "romi-indicator";
    indicator.className = "extension-processing-state";
    indicator.innerHTML = '<div class="state_container--processing"></div>';
    document.body.appendChild(indicator);
  }

  handleMessage(request, sender, sendResponse) {
    if (request.type === "setProcessing") {
      const el = document.getElementById("romi-indicator");
      if (el) {
        if (request.value) el.classList.add("active");
        else el.classList.remove("active");
      }
      sendResponse({ success: true });
    }
    return true;
  }
}

new RomiContent();
