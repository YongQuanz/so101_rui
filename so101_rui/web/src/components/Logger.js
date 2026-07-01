import { element } from "../utils/dom.js";

// ── Logger ────────────────────────────────────────────────────────────────────
export class Logger {
  #box;

  constructor(boxId) {
    this.#box = element(boxId);
  }

  log(msg, type = "info") {
    if (!this.#box) return;
    const ts = new Date().toLocaleTimeString("en-SG");
    const div = document.createElement("div");
    div.className = "log-" + type;
    div.textContent = `[${ts}]  ${msg}`;
    this.#box.appendChild(div);
    this.#box.scrollTop = this.#box.scrollHeight;
  }
}
