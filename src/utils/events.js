import { EventEmitter } from "events";
import logger from "./logger.js";

class Events extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this.on("error", (err) => {
      logger.error("EVENT_SERVICE", "An error occurred in the event emitter.", {
        error: err,
      });
    });
  }

  emit(event, ...args) {
    logger.debug("EVENT_SERVICE", `Emitting event: ${event}`, { args });
    return super.emit(event, ...args);
  }

  on(event, listener) {
    logger.debug("EVENT_SERVICE", `Registering listener for event: ${event}`);
    return super.on(event, listener);
  }
}

const eventService = new Events();
export default eventService;
