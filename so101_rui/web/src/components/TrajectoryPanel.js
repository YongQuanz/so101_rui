import { CONFIG } from "../config.js";

// ── Trajectory panel ──────────────────────────────────────────────────────────
// Records joint positions while torque is disabled (reading from
// JointTeleopPanel's cached /joint_states), then plays them back by
// publishing a multi-point trajectory to the same topic teleop uses.
export class TrajectoryPanel {
  constructor(ros, logger, hardware, joints) {
    this.ros = ros;
    this.logger = logger;
    this.hardware = hardware; // HardwareController instance
    this.joints = joints;     // JointTeleopPanel instance (source of live joint state)

    this.recording = false;
    this.buffer = [];
    this.recordHz = 20;
    this._timer = null;
  }

  async startRecording() {
    if (this.recording || !this.ros.connected) return;
    this.buffer = [];
    this.joints.setInputsDisabled(true); // teleop can't fight the recording
    await this.hardware.setEnabled(false); // torque off, arm goes limp
    this.recording = true;
    this._timer = setInterval(() => this._tick(), 1000 / this.recordHz);
    this.logger.log("Recording started — move the arm by hand.", "ok");
  }

  stopRecording() {
    if (!this.recording) return;
    clearInterval(this._timer);
    this.recording = false;
    this.joints.setInputsDisabled(false); // teleop usable again
    this.logger.log(
      `Recording stopped — ${this.buffer.length} points captured.`,
      "ok",
    );
  }

  _tick() {
    const msg = this.joints.lastJointState;
    if (!msg) return;
    const names = msg.name || [];
    const positions = msg.position || [];
    const ordered = CONFIG.joints.map((j) => {
      const idx = names.indexOf(j.ros_name);
      return idx === -1 ? null : positions[idx];
    });
    if (ordered.includes(null)) return; // wait until all joints are present
    this.buffer.push({ t: performance.now(), positions: ordered });
  }

  async play() {
    if (this.buffer.length === 0) {
      this.logger.log("No recorded trajectory to play.", "warn");
      return;
    }
    if (!this.ros.connected) {
      this.logger.log("Not connected.", "warn");
      return;
    }

    this.joints.setInputsDisabled(true); // prevent slider/playback race

    // Sync cmdValues to the arm's real current pose before re-enabling
    // torque, so HardwareController's hold-position publish doesn't snap
    // the arm to stale slider values from before it was moved by hand.
    this.joints.syncToCurrentPosition();
    await this.hardware.setEnabled(true); // fires onEnabled -> hold-position first
    await new Promise((r) => setTimeout(r, 300)); // let hold-position land

    const jointNames = CONFIG.joints.map((j) => j.ros_name);
    const t0 = this.buffer[0].t;
    const points = this.buffer.map(({ t, positions }) => {
      const dt = (t - t0) / 1000;
      return {
        positions,
        velocities: new Array(positions.length).fill(0.0),
        accelerations: new Array(positions.length).fill(0.0),
        time_from_start: {
          sec: Math.floor(dt),
          nanosec: Math.round((dt % 1) * 1e9),
        },
      };
    });

    this.ros.send({
      op: "publish",
      topic: CONFIG.topics.jointTrajectory,
      msg: { joint_names: jointNames, points },
    });

    this.logger.log(`Playing back ${points.length} points…`, "ok");

    // No action feedback available (we're publishing raw, not using an
    // action client), so re-enable teleop after the trajectory's total
    // duration has elapsed, with a small margin for controller lag.
    const last = points[points.length - 1].time_from_start;
    const totalMs = last.sec * 1000 + last.nanosec / 1e6;
    setTimeout(() => {
      this.joints.setInputsDisabled(false);
      this.logger.log("Playback finished.", "ok");
    }, totalMs + 300);
  }
}
