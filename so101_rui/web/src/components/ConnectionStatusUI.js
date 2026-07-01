import { element } from "../utils/dom.js";

// ── Connection status UI ──────────────────────────────────────────────────────
export class ConnectionStatusUI {
  #dot;
  #label;
  #currentState = "";

  constructor(dotId = "conn-dot", labelId = "conn-label") {
    this.#dot = element(dotId);
    this.#label = element(labelId);
  }

  set(state, label) {
    if (this.#dot) {
      // 1. Remove the old state class if it exists
      if (this.#currentState) {
        this.#dot.classList.remove(this.#currentState);
      }
      // 2. Add the new state class (e.g., 'connected', 'disconnected', 'error')
      if (state) {
        this.#dot.classList.add(state);
      }
      // 3. Track the current state for the next update
      this.#currentState = state;
    }

    if (this.#label) {
      this.#label.textContent = label;
    }
  }
}
