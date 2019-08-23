export class Analyze {
  private connex: Connex
  private tokens: string[]
  private address: string[]
  private monitorVet: boolean
  private transferFilters: Analyze.transferFilter[]
  private eventFilters: Analyze.eventFilter[] // Only one filter for now.

  constructor(opts: Analyze.options, connex: Connex) {
    this.tokens = (opts.filter.tokens && opts.filter.tokens.length)
      ? opts.filter.tokens.map(item => { return item.toLowerCase() })
      : []

    this.address = (opts.filter.address && opts.filter.address.length)
      ? opts.filter.address.map(item => { return item.toLowerCase() })
      : []

    this.monitorVet = opts.filter.vet
    this.connex = connex
    this.eventFilters = []
    this.transferFilters = []

    if (this.address.length) {
      this.transferFilters.push((item) => {
        return this.address.indexOf(item.recipient) >= 0 || this.address.indexOf(item.sender) >= 0
      })
    }
    if (this.tokens.length) {
      this.eventFilters.push((item) => {
        return this.tokens.indexOf(item.address) >= 0
      })
    }
  }

  public async block(blockId: string): Promise<Analyze.blockResult | null> {
    const blockVisitor = this.connex.thor.block(blockId)
    const block = await blockVisitor.get()
    let events: Analyze.txResult['events'] = []
    let transfers: Analyze.txResult['transfers'] = []
    if (!block) {
      return null
    }
    for (const tx of block.transactions) {
      const { events: eventList, transfers: transferList } = await this.tx(tx)
      events = [...events, ...eventList]
      transfers = [...transfers, ...transferList]
    }

    return {
      blockId: block.id,
      events,
      transfers
    }
  }

  public async tx(txId: string): Promise<Analyze.txResult> {
    const txVisitor = this.connex.thor.transaction(txId)
    const receipt = await txVisitor.getReceipt()
    let transferList: Connex.Thor.Transfer[] = []
    let eventList: Connex.Thor.Event[] = []
    if (receipt) {
      for (const item of receipt.outputs) {
        if (this.monitorVet) {
          transferList = [...item.transfers.filter(this.transferFilters[0]), ...transferList]
        }
        if (this.eventFilters.length) {
          eventList = [...item.events.filter(this.eventFilters[0]), ...eventList]
        }
      }
    }
    return {
      transfers: transferList.map(item => {
        return {
          ...item,
          txId: txId
        }
      }),
      events: eventList.map(item => {
        return {
          ...item,
          txId: txId
        }
      })
    }
  }
}


export namespace Analyze {
  export type options = {
    filter: {
      vet: boolean
      tokens?: string[]
      address?: string[]
    }
    // eventFilters?: eventFilter[]
  }

  export type txResult = {
    events: Array<Connex.Thor.Event & { txId: string }>,
    transfers: Array<Connex.Thor.Transfer & { txId: string }>
  }

  export type blockResult = {
    blockId: string
    events: Analyze.txResult['events'],
    transfers: Analyze.txResult['transfers']
  }

  export type eventFilter = (item: Connex.Thor.Event) => boolean
  export type transferFilter = (item: Connex.Thor.Transfer) => boolean
}
