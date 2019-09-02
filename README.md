# thor-tracer

A simple tracer depends on Connex; analyzing block/tx, filter events/transfers by address(contract address) or you custom condition/filter.

## Usage

```typescript
import { Tracer, Analyze } from 'thor-tracer'

const opts: Analyze.options = {
  filter: {}
}
const tracer = new Tracer(opts, connex)
tracer.on('caught', (result: Analyze.blockResult) => {
  // your logic
})

tracer.start()
```

```typescript
const analyze = new Analyze(opts, connex)
const blockResult: Analyze.blockResult = await analyze.block(blockId)
const txResult: Analyze.txResult = await analyze.tx(txId)
```

## Options

```typescript
{
  filter: {
    transfer?: boolean
    event?: boolean
    contracts?: string[]
    address?: string[]
  }

  // advanced
  transferFilter?: Analyze.transferFilter
  eventFilter?: Analyze.eventFilter
}
```

## Functions

```typescript
tracer.start()

tracer.stop()

tracer.setCheckNum(12)
```

## Events

```typescript
tracer.events.on('start', (status: Connex.Thor.Status['head']) => {})

tracer.events.on('stop', (status: Connex.Thor.Status['head']) => {})

tracer.events.on('caught', (result: Analyze.blockResult | null) => {})

tracer.events.on('confirm', (blocks: Tracer.confirmed[] => {})
```
