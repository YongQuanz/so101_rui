// ── Rosbridge client ──────────────────────────────────────────────────────────
// Owns the WebSocket connection, topic pub/sub, and service calls.
export class RosbridgeClient {
  constructor(logger) {
    this.logger = logger;
    this.ws = null;
    this.connected = false;
    this.topicHandlers = new Map(); // topic -> handler(msg)

    // Lifecycle hooks the app can attach to.
    this.onOpen = null;
    this.onClose = null;
  }

  connect(url) {
    this.logger.log(`Connecting → ${url}`);
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connected = true;
        this.logger.log("rosbridge connected.", "ok");
        if (this.onOpen) this.onOpen();
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.topicHandlers.clear();
        this.logger.log("Connection closed.", "warn");
        if (this.onClose) this.onClose();
      };

      this.ws.onerror = () => {
        this.logger.log(
          "WebSocket error — is rosbridge running?  ros2 launch rosbridge_server rosbridge_websocket_launch.xml",
          "err",
        );
      };

      this.ws.onmessage = (ev) => this._dispatchTopicMessage(ev.data);
    } catch (e) {
      this.logger.log("Bad URL: " + e.message, "err");
      throw e;
    }
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }

  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN)
      this.ws.send(JSON.stringify(obj));
  }

  advertise(topic, type) {
    this.send({ op: "advertise", topic, type });
  }

  subscribe(topic, type, handler) {
    this.topicHandlers.set(topic, handler);
    this.send({ op: "subscribe", topic, type });
  }

  _dispatchTopicMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (_) {
      return;
    }
    if (!msg.topic) return;
    const handler = this.topicHandlers.get(msg.topic);
    if (handler) handler(msg.msg);
  }

  callService(service, type, args) {
    return new Promise((resolve, reject) => {
      const id = "call_" + Date.now();

      const handler = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.id === id && msg.op === "service_response") {
            this.ws.removeEventListener("message", handler);
            msg.result
              ? resolve(msg.values)
              : reject(new Error(msg.values?.message || "Service call failed"));
          }
        } catch (_) {}
      };

      this.ws.addEventListener("message", handler);
      this.send({ op: "call_service", id, service, type, args });
      setTimeout(() => {
        this.ws.removeEventListener("message", handler);
        reject(new Error("Service call timed out"));
      }, 5000);
    });
  }
}
