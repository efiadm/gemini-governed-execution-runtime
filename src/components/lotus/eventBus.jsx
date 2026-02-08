// Mode-agnostic event bus for tracking all runtime operations
const eventListeners = {};

export const EventTypes = {
  RUN_STARTED: 'RUN_STARTED',
  MODEL_CALLED: 'MODEL_CALLED',
  MODEL_RESULT: 'MODEL_RESULT',
  LOCAL_STEP: 'LOCAL_STEP',
  VALIDATION_RESULT: 'VALIDATION_RESULT',
  REPAIR_ATTEMPT: 'REPAIR_ATTEMPT',
  ARTIFACT_EMITTED: 'ARTIFACT_EMITTED',
  RUN_COMPLETED: 'RUN_COMPLETED',
};

export function emitEvent(type, payload) {
  const listeners = eventListeners[type] || [];
  listeners.forEach(callback => callback(payload));
  
  // Also log for debugging
  if (typeof window !== 'undefined' && window.LOTUS_DEBUG) {
    console.log(`[EventBus] ${type}`, payload);
  }
}

export function onEvent(type, callback) {
  if (!eventListeners[type]) {
    eventListeners[type] = [];
  }
  eventListeners[type].push(callback);
  
  return () => {
    const index = eventListeners[type].indexOf(callback);
    if (index > -1) eventListeners[type].splice(index, 1);
  };
}