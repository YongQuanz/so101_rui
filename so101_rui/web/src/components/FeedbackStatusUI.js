import { element } from "../utils/dom.js";
import { CONFIG } from "../config.js";

// ── Motor feedback panel ──────────────────────────────────────────────────────
// Right-side panel: Displays all motor feedbacks simultaneously inside a 
// multi-column grid matrix without requiring individual tab switching.
export class MotorFeedbackPanel {
  constructor(containerId, ros, logger) {
    this.container   = element(containerId);
    this.ros         = ros;
    this.logger      = logger;
    this.telemetry   = new Map(); // servo id -> latest telemetry object
    this.bodyEl      = null;
  }

  build() {
    this.container.innerHTML = '';

    // Create the master grid container for all motor cards
    const body = document.createElement('div');
    body.className = 'motor-feedback-body';
    body.id = 'motor-feedback-grid';
    this.bodyEl = body;

    this.container.appendChild(body);
    this._render();
  }

  subscribe() {
    this.ros.subscribe(
      CONFIG.topics.servoTelemetry,
      CONFIG.servoTelemetryType,
      (msg) => this._handleTelemetry(msg)
    );
  }

  // Called on rosbridge disconnect so stale readings don't linger on screen.
  reset() {
    this.telemetry.clear();
    this._render();
  }

  _handleTelemetry(msg) {
    (msg.servos || []).forEach((s) => this.telemetry.set(s.id, s));
    // Always trigger a re-render so live data flows seamlessly into all cards
    this._render();
  }

  _render() {
    // Ensure we keep pointing to the live container element if the DOM structure updates
    const targetBodyEl = this.container.querySelector('#motor-feedback-grid') || this.bodyEl;
    if (!targetBodyEl) return;

    let cardsHTML = '';

    // Loop from 1 up to CONFIG.motorCount to display all blocks inline
    for (let id = 1; id <= CONFIG.motorCount; id++) {
      const s = this.telemetry.get(id);

      if (!s) {
        cardsHTML += `
          <div class="motor-card">
            <div class="motor-card-header">
              <h3>M${id}</h3>
            </div>
            <div class="motor-card-body">
              <p class="feedback-empty">No data yet</p>
            </div>
          </div>
        `;
        continue;
      }

      const errorFlags = [
        ['Voltage',     s.error_voltage],
        ['Sensor',      s.error_sensor],
        ['Temperature', s.error_temperature],
        ['Current',     s.error_current],
        ['Angle',       s.error_angle],
        ['Overload',    s.error_overload],
      ];
      const activeErrors = errorFlags.filter(([, active]) => active).map(([name]) => name);

      cardsHTML += `
        <div class="motor-card">
          <div class="motor-card-header">
            <h3>M${id}</h3>
            <span class="motor-status-dot ${activeErrors.length ? 'status-err' : 'status-ok'}">●</span>
          </div>
          <div class="motor-card-body">
            <div class="feedback-row"><span>Position</span><strong>${s.position_deg.toFixed(1)}°</strong></div>
            <div class="feedback-row"><span>Speed</span><strong>${s.speed_steps_per_sec.toFixed(0)} steps/s</strong></div>
            <div class="feedback-row"><span>Load</span><strong>${s.load_percent.toFixed(0)}%</strong></div>
            <div class="feedback-row"><span>Voltage</span><strong>${s.voltage.toFixed(1)} V</strong></div>
            <div class="feedback-row"><span>Current</span><strong>${s.current_ma.toFixed(0)} mA</strong></div>
            <div class="feedback-row"><span>Temperature</span><strong>${s.temperature_c}°C</strong></div>
            <div class="feedback-row"><span>Moving</span><strong>${s.moving ? 'Yes' : 'No'}</strong></div>
            <div class="feedback-row feedback-status">
              <span>Status</span>
              <strong class="${activeErrors.length ? 'status-err' : 'status-ok'}">
                ${activeErrors.length ? activeErrors.join(', ') : 'OK'}
              </strong>
            </div>
          </div>
        </div>
      `;
    }

    targetBodyEl.innerHTML = cardsHTML;
  }
}