const EventEmitter = require("events");
const path = require("path");
const fs = require("fs");
const Logger = require("../utils/Logger");
const Client = require("../client/Client");

class EventManager extends EventEmitter {
  /**
   * @param {Client} client
   */
  constructor(client) {
    super();
    this.client = client;
    this.events = new Map();
    this.loadEvents();
  }

  loadEvents() {
    const handlersPath = path.join(__dirname, "handlers");
    if (!fs.existsSync(handlersPath)) {
      Logger.warn("[EventManager] Event handlers folder not found.");
      return;
    }
    // Support both .ts and .js for dev/prod
    const files = fs
      .readdirSync(handlersPath)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
    for (const file of files) {
      try {
        // Use dynamic import for .ts/.js compatibility
        const event =
          require(path.join(handlersPath, file)).default ||
          require(path.join(handlersPath, file));
        if (!event.name) {
          Logger.warn(
            `[EventManager] Event file ${file} missing 'name' export.`
          );
          continue;
        }
        this.events.set(event.name, event);
        Logger.debug(`[EventManager] Loaded event handler: ${event.name}`);
      } catch (err) {
        Logger.error(
          `[EventManager] Failed to load event handler ${file}:`,
          err
        );
      }
    }
  }

  /**
   * @param {number} shardId
   * @param {object} payload
   */
  handleGatewayPayload(shardId, payload) {
    const { t: eventName, d: data } = payload;
    if (!eventName) return;
    const eventHandler = this.events.get(eventName);
    const transformedData =
      eventHandler && eventHandler.transform
        ? (() => {
            try {
              return eventHandler.transform(this.client, data);
            } catch (err) {
              Logger.error(
                `[EventManager] Error transforming event ${eventName}:`,
                err
              );
              return data;
            }
          })()
        : data;
    if (eventHandler && eventHandler.handler) {
      try {
        eventHandler.handler(this.client, transformedData, shardId);
      } catch (err) {
        Logger.error(
          `[EventManager] Error in event handler ${eventName}:`,
          err
        );
      }
    }
    if (eventHandler && eventHandler.alias) {
      this.client.emit(eventHandler.alias, transformedData);
    }
    this.client.emit(eventName, transformedData);
    if (!eventHandler) {
      this.client.emit(eventName.toLowerCase(), data);
    }
  }
}

module.exports = EventManager;
