import { element } from "../utils/dom.js";
import { CONFIG } from "../config.js";

// ── Joint teleoperation panel ─────────────────────────────────────────────────
export class JointTeleopPanel {
  constructor(containerId, ros, logger) {
    this.container = element(containerId);
    this.ros = ros;
    this.logger = logger;
    this.cmdValues = new Array(CONFIG.joints.length).fill(0.0);
    this.debounce = null;
    this.jointsSynced = false; // true after sliders are seeded from /joint_states
  }

  build(app) {
    CONFIG.joints.forEach((joint, i) => {
      const minDeg = Math.round((joint.min * 180) / Math.PI);
      const maxDeg = Math.round((joint.max * 180) / Math.PI);

      const card = document.createElement("div");
      card.className = "joint-card";

      card.innerHTML = `
      <span class="joint-name">${joint.name}</span>
      <input type="range" min="${minDeg}" max="${maxDeg}" value="0" step="1" id="sl-${i}" />
      <span class="joint-cmd"    id="cmd-${i}">0.00 rad</span>
      <span class="joint-actual" id="act-${i}">—</span>
    `;

      // Find the slider inside this specific card and attach the listener directly
      const slider = card.querySelector(`#sl-${i}`);
      if (slider) {
        slider.addEventListener("input", (event) => {
          const degVal = parseFloat(event.target.value);

          // Call your app logic cleanly without touching 'window'
          app.joints?.onJointInput(i, degVal);
        });
      }
      this.container.appendChild(card);
    });
  }

  subscribeToJointStates() {
    this.ros.subscribe(
      CONFIG.topics.jointStates,
      "sensor_msgs/JointState",
      (msg) => this._handleJointState(msg),
    );
  }

  advertiseTrajectoryTopic() {
    this.ros.advertise(
      CONFIG.topics.jointTrajectory,
      "trajectory_msgs/JointTrajectory",
    );
  }

  onJointInput(i, degVal) {
    const rad = parseFloat(((parseInt(degVal) * Math.PI) / 180).toFixed(4));
    this.cmdValues[i] = rad;
    element("cmd-" + i).textContent = rad.toFixed(2) + " rad";
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.publish(), CONFIG.debounceMs);
  }

  // Publishes a single-point JointTrajectory to the JTC.
  // time_from_start controls how fast the controller moves to the target —
  // keep it short for teleop responsiveness but non-zero so the JTC accepts it.
  publish() {
    if (!this.ros.connected) return;

    const jointNames = CONFIG.joints.map((j) => j.ros_name);

    this.ros.send({
      op: "publish",
      topic: CONFIG.topics.jointTrajectory,
      msg: {
        joint_names: jointNames,
        points: [
          {
            positions: this.cmdValues,
            velocities: new Array(this.cmdValues.length).fill(0.0),
            accelerations: new Array(this.cmdValues.length).fill(0.0),
            time_from_start: { sec: 0, nanosec: CONFIG.trajectoryTimeNs },
          },
        ],
      },
    });
  }

  zeroAll() {
    CONFIG.joints.forEach((_, i) => {
      element("sl-" + i).value = 0;
      element("cmd-" + i).textContent = "0.00 rad";
      this.cmdValues[i] = 0.0;
    });
    this.publish();
    this.logger.log("All joints zeroed.");
  }

  resetSyncFlag() {
    this.jointsSynced = false;
  }

  _handleJointState(msg) {
    const names = msg.name || [];
    const positions = msg.position || [];

    // Seed sliders + cmdValues on first message so the robot doesn't jump
    // when you first move a slider after connecting.
    if (!this.jointsSynced) {
      this.jointsSynced = true;
      CONFIG.joints.forEach((joint, i) => {
        const idx = names.indexOf(joint.ros_name);
        if (idx === -1) return;
        const rad = positions[idx];
        const deg = Math.round((rad * 180) / Math.PI);
        this.cmdValues[i] = rad;
        const slider = element("sl-" + i);
        const cmd = element("cmd-" + i);
        if (slider) slider.value = deg;
        if (cmd) cmd.textContent = rad.toFixed(2) + " rad";
      });
      this.logger.log("Sliders synced to current joint positions.", "ok");
    }

    // Always update actual readouts
    CONFIG.joints.forEach((joint, i) => {
      const idx = names.indexOf(joint.ros_name);
      if (idx === -1) return;
      const act = element("act-" + i);
      if (act) act.textContent = positions[idx].toFixed(2) + " rad";
    });
  }
}
