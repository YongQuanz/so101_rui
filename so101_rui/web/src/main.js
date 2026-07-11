import { element } from "./utils/dom.js";
import { CONFIG } from "./config.js";
import { Logger } from "./components/Logger.js";
import { ConnectionStatusUI } from "./components/ConnectionStatusUI.js";
import { RosbridgeClient } from "./connection/RosbridgeClient.js";
import { MotorStatusUI } from "./components/MotorStatusUI.js";
import { HardwareController } from "./services/hardwareController.js";
import { JointTeleopPanel } from "./components/JointTeleopPanel.js";
import { setupUIEventListeners } from "./utils/dom.js";
import { MotorFeedbackPanel } from "./components/FeedbackStatusUI.js";

class Main {
  constructor() {
    this.logger = new Logger("log-box");
    this.connStatus = new ConnectionStatusUI();
    this.ros = new RosbridgeClient(this.logger);
    this.motoUI = new MotorStatusUI();
    this.joints = new JointTeleopPanel(
      "joints-container",
      this.ros,
      this.logger,
    );
    this.hardware = new HardwareController(
      this.ros,
      this.logger,
      this.motoUI,
      this.connStatus,
      () => this.joints.publish(),
    );
    this.MotorFeedback = new MotorFeedbackPanel(
      "motor-feedback-container",
      this.ros,
      this.logger,
    );

    this.connStatus.set("err", "disconnected"); // Set initial state to disconnected

    this.ros.onOpen = () => {
      this.connStatus.set("ok", "connected");
      element("btn-connect").textContent = "Disconnect";
      element("btn-connect").className = "btn btn-warning full-width";
      this.logger.log("Topics advertised & subscribed.", "ok");
      this.joints.advertiseTrajectoryTopic();
      this.joints.subscribeToJointStates();
      this.MotorFeedback.subscribe();
      this.hardware.syncState();
    };

    this.ros.onClose = () => {
      this.connStatus.set("err", "disconnected");
      element("btn-connect").textContent = "Connect";
      element("btn-connect").className = "btn btn-primary full-width";
      this.motoUI.set("disconnected");
      this.joints.resetSyncFlag();
      this.MotorFeedback.reset();
    };
  }

  init() {
    element("ws-url").value = CONFIG.rosbridgeUrl;
    this.joints.build(this);
    this.MotorFeedback.build();
    this.logger.log("SO-101 RUI ready -> connect to rosbridge to start.");
  }
}

const app = new Main();
app.init();

setupUIEventListeners(app);
