import axios from "axios";
import logger from "./logger.js";
import events from "./events.js";

class Network {
  ip = null;
  online = false;
  binEndpoint = "https://www.githubstatus.com/api/v2";
  jsonBinUrl = "https://api.jsonbin.io/v3/b";
  targetBinId = "69639ff0d0ea881f4063fff1";

  constructor() {
    this.untilOnline();
  }

  untilOnline() {
    return new Promise((resolve) => {
      const check = async () => {
        fetch(`${this.binEndpoint}/summary.json`)
          .then(async (res) => {
            if (!res.ok) {
              throw new Error("Network response was not ok");
            }
            if (!this.online) {
              this.online = true;
              logger.info("NETWORK", "Internet connection established.");
            }
            events.emit("internet:online", { online: true, ip: this.ip });
            resolve(true);
          })
          .catch((error) => {
            if (this.online !== false) {
              logger.warn(
                "NETWORK",
                "Internet connection offline or unreachable.",
                { error: error.message },
              );
            }
            this.online = false;
            events.emit("internet:offline", {
              online: false,
              ip: this.ip,
            });
            setTimeout(check, 1000 * 10); // Retry after 10 seconds
          });
      };
      check();
    });
  }

  waitUntilOnline() {
    return new Promise((resolve) => {
      const check = () => this.online && resolve(true);
      const interval = setInterval(check, 1000);
      check();
    });
  }

  isOnline() {
    return this.online;
  }
}

const network = new Network();
export default network;
