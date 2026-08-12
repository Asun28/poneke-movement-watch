const SETUP_TASKS = ["source", "connection", "settings"];

export function setupTaskState({ saved = false, active = false } = {}) {
  if (saved) return "saved";
  return active ? "current" : "not_started";
}

export function nextSetupTask(current, intent = "save") {
  if (intent !== "continue") return current;
  const index = SETUP_TASKS.indexOf(current);
  if (index < 0 || index === SETUP_TASKS.length - 1) return current;
  return SETUP_TASKS[index + 1];
}

export function customIconUploadVisible(mode) {
  return mode === "custom";
}
