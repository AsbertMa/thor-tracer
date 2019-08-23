export class Analyze {
  private connex: Connex
  // base opts
  private contracts: string[]
  private address: string[]
  private monitorVet: boolean
  private monitorEvent: boolean
  // advanced opts
  private transferFilter?: Analyze.transferFilter | null
  private eventFilter?: Analyze.eventFilter | null

  constructor(opts: Analyze.options, connex: Connex) {
    this.connex = connex

    this.contracts = (opts.filter.contracts && opts.filter.contracts.length)
      ? opts.filter.contracts.map(item => { return item.toLowerCase() })
      : []
    this.address = (opts.filter.address && opts.filter.address.length)
      ? opts.filter.address.map(item => { return item.toLowerCase() })
      : []

    this.monitorVet = opts.filter.transfer === undefined ? true : opts.filter.transfer
    this.monitorEvent = opts.filter.event === undefined ? true : opts.filter.event

    this.transferFilter = this.address.length ? (item) => {
      return this.address.indexOf(item.sender) >= 0
        || this.address.indexOf(item.recipient) >= 0
    } : null

    this.eventFilter = this.contracts.length ? (item) => {
      return this.contracts.indexOf(item.address) >= 0
    } : null
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
          transferList = [
            ...(
              this.transferFilter
                ? item.transfers.filter(this.transferFilter)
                : item.transfers
            ),
            ...transferList
          ]
        }

        if (this.monitorEvent) {
          eventList = [
            ...(
              this.eventFilter
                ? item.events.filter(this.eventFilter)
                : item.events
            ),
            ...eventList
          ]
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
      transfer?: boolean
      event?: boolean
      contracts?: string[]
      address?: string[]
    }
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
