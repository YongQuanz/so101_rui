import { element } from "./utils/dom.js";
import { CONFIG } from "./config.js";
import { Logger } from "./components/Logger.js";
import { ConnectionStatusUI } from "./components/ConnectionStatusUI.js";
import { RosbridgeClient } from "./connection/RosbridgeClient.js";

class Main {
  constructor() {
    this.logger = new Logger("log-box");
    this.connStatus = new ConnectionStatusUI();
    this.ros = new RosbridgeClient(this.logger);

    this.connStatus.set("err", "disconnected"); // Set initial state to disconnected

    this.ros.onOpen = () => {
      this.connStatus.set("ok", "connected");
      element("btn-connect").textContent = "Disconnect";
      element("btn-connect").className = "btn btn-warning full-width";
      this.logger.log("Topics advertised & subscribed.", "ok");
    };

    this.ros.onClose = () => {
      this.connStatus.set("err", "disconnected");
      element("btn-connect").textContent = "Connect";
      element("btn-connect").className = "btn btn-primary full-width";
    };
  }

  init() {
    element("ws-url").value = CONFIG.rosbridgeUrl;
    this.logger.log("SO-101 RUI ready -> connect to rosbridge to start.");
  }

  toggleConnect() {
    this.ros.connected ? this.disconnect() : this.connect();
  }

  connect() {
    const url = element("ws-url").value.trim();
    this.connStatus.set("", "connecting...");
    try {
      this.ros.connect(url);
    } catch (_) {
      this.connStatus.set("err", "error");
    }
  }

  disconnect() {
    this.ros.disconnect();
  }
}

const app = new Main();
app.init();

window.toggleConnect = () => app.toggleConnect();
