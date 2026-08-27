// ── DOM helper ────────────────────────────────────────────────────────────────
export const element = (id) => document.getElementById(id);

export const setupUIEventListeners = (app) => {
  const connectBtn = element('btn-connect');
  const motorEnableBtn = element('btn-enable');
  const motorDisableBtn = element('btn-disable');
  const recordBtn = element('btn-record');
  const playBtn = element('btn-play');

  if (connectBtn) {
    connectBtn.addEventListener('click', () => app.hardware.toggleConnect());
  }
  if (motorEnableBtn) {
    motorEnableBtn.addEventListener('click', () => {
      app.joints.syncToCurrentPosition(); // avoid snap if arm was moved by hand while disabled
      app.hardware.setEnabled(true);
    });
  }

  if (motorDisableBtn) {
    motorDisableBtn.addEventListener('click', () => app.hardware.setEnabled(false));
  }

  if (recordBtn) {
    recordBtn.addEventListener('click', async () => {
      if (!app.trajectory.recording) {
        await app.trajectory.startRecording();
        recordBtn.textContent = 'Stop';
        if (playBtn) playBtn.disabled = true;
      } else {
        app.trajectory.stopRecording();
        recordBtn.textContent = 'Record';
        if (playBtn) playBtn.disabled = app.trajectory.buffer.length === 0;
      }
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => app.trajectory.play());
  }
};
