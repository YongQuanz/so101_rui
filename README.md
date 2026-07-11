# SO-101 Robot User Interface (RUI) 🤖

⚠️ **Status: Work In Progress**  
*This repository is under development.*

---

## 🏗️ Current Development Focus
*   [X] Display telemetry data (Motor Feedback's)
*   [X] Teleoperation using slider's
*   [ ] Joint recording: arm to specific pose -> sample joint values -> save coordinates sequence.
*   [ ] Playback: recorded coordinates for repeatability 

---

## 🚀 Getting Started & Setup

Follow these steps to set up your ROS 2 workspace, resolve dependencies using `rosdep`, and launch the User Interface.

### 1. Prerequisites
Ensure you have a working ROS 2 installation (e.g., Humble, Iron, or Jazzy) and a sourced environment. (I used Jazzy)

### 2. Clone the Repositories
Create or navigate to your ROS 2 workspace `src` folder, then clone both the hardware interface and the RUI repositories:

```bash
# Navigate to your workspace src folder (adjust path if your workspace name is different)
cd ~/ros2_ws/src

# Clone the Hardware Interface
git clone [https://github.com/YongQuanz/so101_hardware_interface.git](https://github.com/YongQuanz/so101_hardware_interface.git)

# Clone the Robot User Interface (RUI)
git clone [https://github.com/YongQuanz/so101_rui.git](https://github.com/YongQuanz/so101_rui.git)
```

### 3. Install Dependencies with rosdep and build
```bash
# Navigate back to the root of your workspace
cd ~/ros2_ws

# Update rosdep databases
rosdep update

# Check and install all missing dependencies for the packages in your workspace
rosdep install --from-paths src --ignore-src -r -y

# Build the workspace
colcon build --symlink-install
```

### 4. Launch and enjoy
```bash
# Terminal 1: Launch the hardware interface bringup
ros2 launch so101_hardware_interface so101_bringup.launch.py

# Terminal 2: Open a new terminal, source the workspace, and launch the UI/Bridge
source install/setup.bash
ros2 launch so101_rui rui.launch.py
```

## 📱 Current User Interface
> High-level overview of the dashboard displaying real-time motor telemetry updates and joint controls.

![SO-101 User Interface Screenshot](so101_rui/web/src/assets/dashboard.png)

---