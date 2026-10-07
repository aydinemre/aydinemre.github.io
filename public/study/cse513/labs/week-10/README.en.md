# Week 10 / Lecture set 09 — Retries and event order

Works offline with the Python 3 standard library. There are no real network, server, payment, or external-service calls. The code produces finite in-memory teaching traces. Run commands from this lab directory.

## Predict first: the first reply was lost

```sh
python3 rpc_retry.py --mode naive
python3 rpc_retry.py --mode dedupe
python3 rpc_retry.py --mode reset
```

Initially counter=0. At t0 the client sends op-7(amount1); at t4 the server applies it and the reply is lost; at t8 the client times out; at t10 it retries with the same operation ID; at t11 the server handles the retry; at t16 the client sees a reply. Times are model units.

| Mode | Final counter | Why? |
|---|---|---|
| naive | 2 | Two deliveries cause two applications |
| dedupe | 1 | A result record for the same ID/payload is retained |
| reset | 2 | Records disappear at t9 while the counter remains; retry applies again |

Timeout does not establish that the first operation never happened. dedupe is not an exactly-once network guarantee. Record lifetime, scope, durability, and atomicity with the state update matter in a real design. The lab models effect and record in one sequential transition; it does not implement a crash window between them. reset is an intentional counterexample.

For one ID with a different amount, the deduplicating server raises ValueError without changing the counter. ID uniqueness/client scope and authentication are outside this lab. A real system must also handle concurrent duplicates, durable state, external effects, and retention limits.

## Then examine ordering: does a smaller clock imply cause?

```sh
python3 lamport_trace.py
```

Clocks start at zero: A local1, A send2, B independent local1, B receive3, B local4. Receive uses max(local, received)+1.

A send→B receive is an established message edge. Although B's independent local clock is1 and A's send clock is2, B local→A send does not follow; the events are concurrent. Row order is simulator order, not global causal order.

## Check the boundaries

```sh
python3 rpc_retry.py --self-test
python3 lamport_trace.py --self-test
```

Expect two PASS lines. RPC checks cover naive/dedupe/reset, identical-duplicate results, mismatched payload rejection, invalid input, and unchanged state on errors. Clock checks cover receive/max calculations, local/send increments, causal-edge order, transitivity, and a converse counterexample.

Learning log: state a condition for each result, then change one condition and predict again. Do not equate timeout with failed execution or clock order with causality.

Scope: [Lecture09 / Week10](https://mehmetgokturk.com/cse513/lecture-09.html). The source page says the PDF is being prepared; no original slide numbers are given. Primary reading: [OSTEP Distributed Systems](https://pages.cs.wisc.edu/~remzi/OSTEP/dist-intro.pdf), [Lamport Time, Clocks, and the Ordering of Events](https://lamport.azurewebsites.net/pubs/time-clocks.pdf). [Raft](https://raft.github.io/raft.pdf) is optional further reading, not an official paper assignment. Code and numbers are original teaching models for this package.
