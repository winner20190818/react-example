export class Locker {
  private readers: number = 0
  private writer: boolean = false
  private readQueue: (() => void)[] = []
  private writeQueue: (() => void)[] = []

  async readLock(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.writer || this.writeQueue.length > 0) {
        this.readQueue.push(resolve)
      } else {
        this.readers++
        resolve()
      }
    })
  }

  async readUnlock(): Promise<void> {
    this.readers--
    this.processQueues()
  }

  async writeLock(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.writer || this.readers > 0) {
        this.writeQueue.push(resolve)
      } else {
        this.writer = true
        resolve()
      }
    })
  }

  async writeUnlock(): Promise<void> {
    this.writer = false
    this.processQueues()
  }

  private processQueues(): void {
    if (!this.writer && this.writeQueue.length > 0) {
      // If there are waiting writers and no one is writing, process the first writer
      this.writer = true
      const resolve = this.writeQueue.shift()
      if (resolve) resolve()
    } else if (
      !this.writer &&
      this.readers === 0 &&
      this.readQueue.length > 0
    ) {
      // If no one is writing and there are waiting readers, process all readers
      while (this.readQueue.length > 0) {
        const resolve = this.readQueue.shift()
        if (resolve) resolve()
        this.readers++
      }
    }
  }
}
