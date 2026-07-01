/**
 * config.js — SO-101 RUI configuration
 *
 * Derived from so101_ros2_control.urdf.xacro
 * Edit only this file when adapting topics or joint limits.
 */

export const CONFIG = {
  // ── rosbridge ──────────────────────────────────────────────────────────────
  rosbridgeUrl: 'ws://localhost:9090',

  // ── ros2_control hardware component ───────────────────────────────────────
  // Matches <ros2_control name="..."> in so101_ros2_control.urdf.xacro
  hardwareComponentName: 'So101HardwareInterface',

  // ── Topics ────────────────────────────────────────────────────────────────
  topics: {
    // JointTrajectory → joint_trajectory_controller
    jointTrajectory: '/joint_trajectory_controller/joint_trajectory',
    // Actual joint feedback from joint_state_broadcaster
    jointStates:     '/joint_states',
  },

  // ── Services ──────────────────────────────────────────────────────────────
  services: {
    listHardwareComponents: '/controller_manager/list_hardware_components',
    setHardwareState:       '/controller_manager/set_hardware_component_state',
  },

  // ── Joints ────────────────────────────────────────────────────────────────
  // ros_name matches <joint name="..."> in the URDF exactly.
  // min/max in radians — adjust to your physical hard stops.
  joints: [
    { name: 'Shoulder pan',  ros_name: 'shoulder_pan',  min: -1.91986, max: 1.91986 },
    { name: 'Shoulder lift', ros_name: 'shoulder_lift', min: -1.74533, max: 1.74533 },
    { name: 'Elbow',         ros_name: 'elbow_flex',    min: -1.69,    max: 1.69    },
    { name: 'Wrist flex',    ros_name: 'wrist_flex',    min: -1.65806, max: 1.65806 },
    { name: 'Wrist roll',    ros_name: 'wrist_roll',    min: -2.74385, max: 2.84121 },
    { name: 'Gripper',       ros_name: 'gripper',       min: -0.17453, max: 1.74533 },
  ],

  // ── Trajectory timing ─────────────────────────────────────────────────────
  // time_from_start for each single-point trajectory sent by the sliders.
  // Lower = more responsive but may exceed servo acceleration limits.
  // 100_000_000 ns = 100 ms — tune up if servos feel jerky, down for snappier response.
  trajectoryTimeNs: 100_500_000,

  // ── Publish rate ──────────────────────────────────────────────────────────
  debounceMs: 40,
};
