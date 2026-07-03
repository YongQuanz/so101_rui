import { CONFIG } from "../config.js";

// ── Hardware controller ───────────────────────────────────────────────────────
// Enables/disables torque and keeps the motor UI + hardware state in sync.
export class HardwareController {
  constructor(ros, logger, motorUI, onEnabled) {
    this.ros = ros;
    this.logger = logger;
    this.motorUI = motorUI;
    this.onEnabled = onEnabled; // callback fired right after torque is enabled
  }

  async syncState() {
    this.logger.log("Checking hardware state…");
    try {
      const res = await this.ros.callService(
        "/controller_manager/list_hardware_components",
        "controller_manager_msgs/srv/ListHardwareComponents",
        {},
      );

      const component = (res.component || []).find(
        (c) => c.name === CONFIG.hardwareComponentName,
      );
      if (!component) {
        this.logger.log(
          `'${CONFIG.hardwareComponentName}' not found — is the hardware interface running?`,
          "warn",
        );
        return;
      }

      const label = component.state.label;
      this.logger.log(`Hardware state: ${label}`, "ok");
      this.motorUI.set(label === "active" ? "active" : "inactive");
    } catch (e) {
      this.logger.log("Could not read hardware state: " + e.message, "warn");
    }
  }

  async setEnabled(enable) {
    this.logger.log((enable ? "Enabling" : "Disabling") + " torque…");
    try {
      await this.ros.callService(
        CONFIG.services.setHardwareState,
        "controller_manager_msgs/srv/SetHardwareComponentState",
        {
          name: CONFIG.hardwareComponentName,
          target_state: {
            id: enable ? 3 : 2,
            label: enable ? "active" : "inactive",
          },
        },
      );
      this.logger.log(
        "Torque " + (enable ? "enabled." : "disabled."),
        enable ? "ok" : "warn",
      );
      this.motorUI.set(enable ? "active" : "inactive");

      // Immediately publish a hold-position trajectory after enable so the JTC
      // doesn't replay its last stale goal and snap the arm to a different pose.
      if (enable && this.onEnabled) {
        this.onEnabled();
        this.logger.log("Hold-position trajectory sent.", "ok");
      }
    } catch (e) {
      this.logger.log("Failed: " + e.message, "err");
    }
  }
}
