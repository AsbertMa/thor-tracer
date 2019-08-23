import { Analyze } from './analyze'
import { EventEmitter } from 'eventemitter3'

export class Tracer {
  private anal: Analyze
  private connex: Connex
  private isStop: boolean = false
  public events: any

  constructor(opts: Analyze.options, connex: Connex) {
    this.anal = new Analyze(opts, connex)
    this.connex = connex
    this.events = new EventEmitter()
  }

  public async start() {
    this.events.emit('start', this.connex.thor.status.head)

    const ticker = this.connex.thor.ticker()
    for (; ;) {
      const head = await ticker.next()
      if (head) {
        const result = await this.anal.block(head.id)
        if (result && (result.events.length || result.transfers.length)) {
          this.events.emit('caught', result)
        }
      }
      if (this.isStop) {
        this.events.emit('stop', head)
        break
      }
    }
  }

  public stop() {
    this.isStop = true
  }
}


