// src/utils/eventBus.js
const eventBus = {
  callbacks: {},
  on(event, cb) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(cb);
  },
  emit(event, payload) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((cb) => cb(payload));
    }
  },
};

export default eventBus;
