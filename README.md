# thor-tracer
Depends on Connex; analyzing block, base on address (contract address) of filter by you custom condition.

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
