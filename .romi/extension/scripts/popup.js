class RomiPopup {
  constructor() {
    this.statusDot = document.getElementById("statusDot");
    this.statusText = document.getElementById("statusText");
    this.init();
  }

  init() {
    this.updateStatus();
    setInterval(() => this.updateStatus(), 1000);
  }

  async updateStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: "getStatus" });
      if (response && response.connected) {
        this.statusDot.classList.add("connected");
        this.statusText.textContent = "Connected";
        this.statusText.style.color = "#10b981";
      } else {
        this.statusDot.classList.remove("connected");
        this.statusText.textContent = "Disconnected";
        this.statusText.style.color = "#ef4444";
      }
    } catch (err) {
      this.statusDot.classList.remove("connected");
      this.statusText.textContent = "Disconnected";
      this.statusText.style.color = "#ef4444";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new RomiPopup();
});
