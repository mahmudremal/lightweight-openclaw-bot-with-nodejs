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
        axios
          .get(`${this.binEndpoint}/summary.json`)
          .then(async () => {
            if (!this.online) {
              this.online = true;
              logger.info("NETWORK", "Internet connection established.");
              await this.updatePublicIp();
            }
            events.emit("internet:online", { online: true, ip: this.ip });
            resolve();
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
          });
      };

      const interval = setInterval(check, 1000 * 10);
      check();

      process.on("SIGINT", () => {
        clearInterval(interval);
      });
    });
  }

  waitUntilOnline() {
    return new Promise((resolve) => {
      const check = () => this.online && resolve(true);
      const interval = setInterval(check, 1000);
      check();
    });
  }
}

const network = new Network();
export default network;
