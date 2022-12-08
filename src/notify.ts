import { reactive } from "vue";

type Notification = {
  type: "log" | "warn" | "error";
  message: string;
  details: any;
};

// TODO: Auto-clear
// TODO: Duplicate message counter
export const notifications: Notification[] = reactive([]);

function objToString(value: any) {
  if (typeof value === "string") {
    return value;
  } else {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return value + "";
    }
  }
}

export function notify(type: "log" | "warn" | "error", message: string, details: any) {
  const description = objToString(details);
  console[type](message, description);

  notifications.push({
    type,
    message,
    details: description,
  });
}

export function log(message: string, details: any) {
  notify("log", message, details);
}

export function warn(message: string, details: any) {
  notify("warn", message, details);
}

export function error(message: string, details: any) {
  notify("error", message, details);
}

export function clear() {
  notifications.splice(0, notifications.length);
}
