// ── DOM helper ────────────────────────────────────────────────────────────────
export const element = (id) => document.getElementById(id);

export const setupUIEventListeners = (app) => {
    const connectBtn = element('btn-connect');
    const motorEnableBtn = element('btn-enable');
    const motorDisableBtn = element('btn-disable');

    if (connectBtn) {
        connectBtn.addEventListener('click', () => app.hardware.toggleConnect());
    }
    
    if (motorEnableBtn) {
        motorEnableBtn.addEventListener('click', () => app.hardware.setEnabled(true));
    }

    if (motorDisableBtn) {
        motorDisableBtn.addEventListener('click', () => app.hardware.setEnabled(false));
    }
}