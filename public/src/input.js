import { CONTROLS } from "./shared/constants.js";

const keyToAction = new Map();
for (const [action, keys] of Object.entries(CONTROLS)) {
  for (const key of keys) keyToAction.set(key, action);
}

export function createInputController(onChange) {
  const state = {
    left: false,
    right: false,
    jump: false,
    down: false,
    swing: false
  };
  const touchHolds = new Map();
  let lastSent = JSON.stringify(state);

  function setAction(action, value) {
    if (!(action in state)) return;
    if (state[action] === value) return;
    state[action] = value;
    emit();
  }

  function emit(force = false) {
    const packed = JSON.stringify(state);
    if (force || packed !== lastSent) {
      lastSent = packed;
      onChange({ ...state });
    }
  }

  function handleKey(event, value) {
    const action = keyToAction.get(event.code);
    if (!action) return;
    event.preventDefault();
    setAction(action, value);
  }

  window.addEventListener("keydown", (event) => handleKey(event, true), { passive: false });
  window.addEventListener("keyup", (event) => handleKey(event, false), { passive: false });

  window.addEventListener("blur", () => {
    for (const action of Object.keys(state)) state[action] = false;
    touchHolds.clear();
    emit(true);
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    const action = button.getAttribute("data-action");
    const onPress = (event) => {
      event.preventDefault();
      touchHolds.set(event.pointerId, action);
      button.setPointerCapture?.(event.pointerId);
      setAction(action, true);
    };
    const onRelease = (event) => {
      event.preventDefault();
      const held = touchHolds.get(event.pointerId);
      if (held) {
        touchHolds.delete(event.pointerId);
        const stillHeld = [...touchHolds.values()].includes(held);
        setAction(held, stillHeld);
      }
    };
    button.addEventListener("pointerdown", onPress);
    button.addEventListener("pointerup", onRelease);
    button.addEventListener("pointercancel", onRelease);
    button.addEventListener("pointerleave", onRelease);
  });

  const pulse = window.setInterval(() => emit(true), 70);

  return {
    getState: () => ({ ...state }),
    destroy: () => window.clearInterval(pulse)
  };
}
