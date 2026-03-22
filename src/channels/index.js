import config from "../config/index.js";
import logger from "../utils/logger.js";
import whatsapp from "./whatsapp.js";
import telegram from "./telegram.js";
import web from "./web.js";
import events from "../utils/events.js";

class Channels {
  constructor() {
    this.channels = {
      whatsapp,
      telegram,
      web,
    };
  }

  async init() {
    this.launchChannels(true);
    events.on("internet:online", this.launchChannels.bind(this));
    events.on("internet:offline", this.stopAll.bind(this));

    // events.on("config:invalidated", () => {
    //   // Maybe restart channels if config changed?
    //   // For now just logging
    //   logger.info(
    //     "CHANNELS",
    //     "Config invalidated, checking for channel updates...",
    //   );
    //   this.launchChannels();
    // });
  }

  async launchChannels(offline = false) {
    logger.info("CHANNELS", "Initializing enabled channels...");
    const activeConfig = await config.getActiveConfig();
    const channelConfigs = activeConfig.channels || {};

    for (const [name, { enabled }] of Object.entries(channelConfigs)) {
      if (enabled && this.channels?.[name]) {
        logger.info("CHANNELS", `Starting channel: ${name}`);
        try {
          if (offline) {
            if (!this.channels[name]?.needConnection) {
              await this.channels[name].init();
            }
          } else {
            await this.channels[name].init();
          }
        } catch (err) {
          logger.error(
            "CHANNELS",
            `Failed to start channel ${name}: ${err.message}`,
          );
        }
      }
    }
  }

  async availableChannels() {
    const activeConfig = await config.getActiveConfig();
    return Object.entries(activeConfig.channels || {})
      .filter(([_, { enabled }]) => enabled)
      .map(([name]) => name);
  }

  getChannel(name) {
    return this.channels[name];
  }

  async stopAll() {
    logger.info("CHANNELS", "Stopping all channels...");
    for (const [name, channel] of Object.entries(this.channels)) {
      if (channel.stop) {
        try {
          await channel.stop();
          logger.info("CHANNELS", `Stopped channel: ${name}`);
        } catch (err) {
          logger.error(
            "CHANNELS",
            `Failed to stop channel ${name}: ${err.message}`,
          );
        }
      }
    }
  }
}

const channels = new Channels();
export default channels;
