import { element } from "../utils/dom";

// ── Motor status UI ───────────────────────────────────────────
export class MotorStatusUI {
  static STATES = {
    disconnected: { dotClass: '',     labelText: '—',        en: false, dis: false },
    active:       { dotClass: 'ok',   labelText: 'active',   en: false, dis: true  },
    inactive:     { dotClass: 'warn', labelText: 'inactive', en: true,  dis: false },
  };
 
  constructor(dotId = 'motor-dot', labelId = 'motor-label', enableId = 'btn-enable', disableId = 'btn-disable') {
    this.dot = el(dotId);
    this.lbl = el(labelId);
    this.en  = el(enableId);
    this.dis = el(disableId);
  }
 
  set(state) {
    const s = MotorStatusUI.STATES[state] || MotorStatusUI.STATES.disconnected;
    if (this.dot) this.dot.className   = 'dot' + (s.dotClass ? ' ' + s.dotClass : '');
    if (this.lbl) this.lbl.textContent = s.labelText;
    if (this.en)  this.en.disabled     = !s.en;
    if (this.dis) this.dis.disabled    = !s.dis;
  }
}