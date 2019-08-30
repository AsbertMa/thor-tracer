import { Analyze } from './analyze'
import { EventEmitter } from 'eventemitter3'

export class Tracer {
  private anal: Analyze
  private connex: Connex
  private isStop: boolean = true
  private checkNum: number = 12
  private blocksQ: string[] = []

  public events: any

  constructor(opts: Analyze.options, connex: Connex) {
    this.anal = new Analyze(opts, connex)
    this.connex = connex
    this.events = new EventEmitter()
  }

  public setCheckNum(num: number) {
    this.checkNum = num
    return this
  }

  get CheckNum() {
    return this.checkNum
  }

  private async checkBlock(headNum: number) {
    const result: Tracer.confirmed[] = []
    for (const id of this.blocksQ) {
      const bv = this.connex.thor.block(id)
      const block = await bv.get()
      if (block) {
        result.push(
          {
            blockID: id,
            isTrunk: block!.isTrunk,
            confirm: headNum - block!.number
          }
        )
      }
    }

    const confirmedBlocks: string[] = result.filter((item: Tracer.confirmed) => {
      return item.confirm >= this.checkNum
    }).map((item: Tracer.confirmed) => {
      return item.blockID
    }) || []

    this.blocksQ = this.blocksQ.filter(item => {
      return confirmedBlocks.indexOf(item) === -1
    })

    this.events.emit('confirm', result)
  }

  public async start() {
    this.isStop = false
    this.events.emit('start', this.connex.thor.status.head)

    const ticker = this.connex.thor.ticker()
    for (; ;) {
      const head = await ticker.next()
      if (head) {
        const result = await this.anal.block(head.id)
        if (result && (result.events.length || result.transfers.length)) {
          this.events.emit('caught', result)
          this.blocksQ.push(result.blockId)
        }
        if (this.blocksQ.length) {
          await this.checkBlock(head.number)
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

export namespace Tracer {
  export type confirmed = {
    blockID: string
    isTrunk: boolean,
    confirm: number
  }
}
