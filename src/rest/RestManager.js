const fetch = require("node-fetch").default
const Logger = require("../utils/Logger");

class RestManager {
  /**
   * @param {string} token
   */
  constructor(token) {
    this.token = token;
    this.baseURL = "https://discord.com/api/v10";
    this.globalRateLimitReset = 0;
    this.globalRateLimitRemaining = 1;
    this.globalRateLimitQueue = [];
    this._isProcessingGlobalQueue = false;
    this.bucketLimits = new Map();
  }

  /**
   * Sends a request to the Discord API.
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH).
   * @param {string} path - API endpoint path (e.g., /users/@me).
   * @param {object} [body=null] - Request body for POST/PUT requests.
   * @returns {Promise<object>} - Parsed JSON response from the API.
   */
  async request(method, path, body = null) {
    const url = `${this.baseURL}${path}`;
    const headers = {
      Authorization: `Bot ${this.token}`,
      "Content-Type": "application/json",
      "User-Agent": "DiscordBot (Cordix, 0.0.1)",
    };
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };
    // Global Rate Limit Handling
    await this._waitForGlobalRateLimit();
    const response = await fetch(url, options);
    // Handle Rate Limits
    const retryAfter =
      parseInt(response.headers.get("retry-after") || "0", 10) * 1000;
    if (response.status === 429) {
      Logger.warn(
        `[RestManager] Rate limited on ${method} ${path}. Retrying after ${retryAfter}ms.`
      );
      this.globalRateLimitReset = Date.now() + retryAfter;
      this.globalRateLimitRemaining = 0;
      await new Promise((r) => setTimeout(r, retryAfter));
      return this.request(method, path, body); // Retry after waiting
    }
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}
      Logger.error(
        `[RestManager] API Error ${response.status} on ${method} ${path}:`,
        errorData
      );
      throw new Error(
        `Discord API Error ${response.status}: ${JSON.stringify(errorData)}`
      );
    }
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async _waitForGlobalRateLimit() {
    if (
      this.globalRateLimitRemaining > 0 &&
      Date.now() < this.globalRateLimitReset
    ) {
      const delay = this.globalRateLimitReset - Date.now();
      Logger.debug(
        `[RestManager] Global rate limit active. Waiting ${delay}ms.`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
    this.globalRateLimitRemaining = 0;
  }

  get(path) {
    return this.request("GET", path);
  }

  post(path, body) {
    return this.request("POST", path, body);
  }

  put(path, body) {
    return this.request("PUT", path, body);
  }

  delete(path) {
    return this.request("DELETE", path);
  }

  patch(path, body) {
    return this.request("PATCH", path, body);
  }
}

module.exports = RestManager;
