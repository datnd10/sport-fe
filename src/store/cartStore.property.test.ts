import fc from 'fast-check'
import { describe, it } from 'vitest'

// Trivial fast-check property to confirm the PBT library is wired up and
// runnable via Vitest. Real cart-total properties (Property 10) are added
// in task 26.3 once the cart logic exists.
describe('fast-check smoke test', () => {
  it('addition is commutative for any two integers', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a),
    )
  })
})
