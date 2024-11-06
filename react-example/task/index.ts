interface Callback {
  (): void;
  displayName?: string;
}

interface syncItem {
  priority: number;
  callback: Callback;
}
type EventType = "changeLocale" | "start" | "exit" | "login" | "logout" | "changeTheme";

class proccess {
  private name: string;
  private syncCallbacks: syncItem[] = [];
  private asyncCallbacks: Callback[] = [];

  constructor(name?: string) {
    this.name = name || "";
  }

  register(callback: Callback, priority?: number) {
    if (priority) {
      this.syncCallbacks.push({ priority, callback });
    } else {
      this.asyncCallbacks.push(callback);
    }
  }

  async execute() {
    const syncCallbacks = this.syncCallbacks
      .sort((a, b) => a.priority - b.priority)
      .map((item) => item.callback);

    const fnps = [];
    for (const fn of syncCallbacks) {
      try {
        const fnp = fn();
        fnps.push(fnp);
        // console.log("task.exec('" + fn.displayName + "') - start");
      } catch (error) {
        console.error(this.name + "Callback execution error:", error);
        fnps.push(Promise.resolve(0));
      }
    }

    await Promise.allSettled(fnps);

    this.asyncCallbacks.forEach(async (fn) => {
      try {
        await fn();
      } catch (error) {
        console.error(this.name + "Callback execution error:", error);
      }
    });
  }
}

const eventProccess: Partial<Record<EventType, proccess>> = {};

const executedEventMap: Partial<Record<EventType, boolean>> = {};

const task = {
  on: (e: EventType, ...args: Parameters<proccess["register"]>) => {
    const [cb, ...ops] = args;
    if (!eventProccess[e]) {
      eventProccess[e] = new proccess(e);
    }
    eventProccess[e]?.register(cb, ...ops);
    if (executedEventMap[e]) {
      cb();
    }
  },
  exec: async (e: EventType) => {
    if (executedEventMap[e]) {
      return;
    }
    const isSuccess = status === "success";
    executedEventMap[e] = isSuccess;

    switch (e) {
      case "exit":
        executedEventMap["start"] = isSuccess;
        break;
      case "start":
        executedEventMap["exit"] = isSuccess;
        break;
      case "login":
        executedEventMap["logout"] = isSuccess;
        break;
      case "logout":
        executedEventMap["login"] = isSuccess;
        break;
    }
    await eventProccess[e]?.execute();
    switch (e) {
      case "changeLocale":
        executedEventMap["changeLocale"] = false;
        break;
      case "changeTheme":
        executedEventMap["changeTheme"] = false;
        break;
      case "login":
        executedEventMap["logout"] = false;
        break;
      case "logout":
        executedEventMap["login"] = false;
        break;
      case "exit":
        executedEventMap["start"] = false;
        break;
      case "start":
        executedEventMap["exit"] = false;
    }
  },
};

export default task;
