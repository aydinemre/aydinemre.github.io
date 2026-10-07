# Week 4 — Resource graphs and safe-state lab

Both experiments work offline using the Python 3 standard library. They create no real threads or indefinitely blocked programs and connect to no database. Run the commands from this lab directory.

## 1. Predict, then inspect the safety witness

```sh
python3 safe_state.py --case baseline
python3 safe_state.py --case safe-request
python3 safe_state.py --case unsafe-request
```

Baseline: Total=(4,3), Available=(1,1). Vector order is (A,B).

| Process | Allocation | Max | Need |
|---|---|---|---|
| P0 | (1,0) | (3,2) | (2,2) |
| P1 | (1,1) | (2,1) | (1,0) |
| P2 | (1,1) | (2,2) | (1,1) |

First write which process can finish with Work=(1,1). The deterministic baseline witness is P1→P0→P2; Work=(1,1)→(2,2)→(3,2)→(4,3). Other sequences may be valid. This is not a mandatory schedule for real execution.

safe-request examines P1 requesting (1,0) from baseline: grant-safe, Available=(0,1), P1 Need=(0,0). unsafe-request examines P0 requesting (1,1), independently from baseline: defer-unsafe, trial Available=(0,0), and no remaining Need fits. The trial is shown without modifying the baseline. Do not apply the two trials consecutively.

Unsafe does not mean currently deadlocked. Max is a declared upper bound; processes need not request it all. They may still compute and finish using fewer resources. The model assumes interchangeable instances within each type and that a process can finish in finite time and release its resources if its remaining Need is met.

## 2. Inspect a current wait-for graph

```sh
python3 wait_graph.py --case cycle
python3 wait_graph.py --case chain
python3 wait_graph.py --case dependent
```

A→B means A waits for a single-instance exclusive resource held by B. cycle and dependent yield A→B→A. chain has no cycle. dependent also contains C→A: C is not on the cycle but may be affected because it waits for deadlocked A. The program finds one cycle; it does not enumerate every cycle or all affected tasks.

This model does not detect deadlock in multiple-instance pools. A cycle alone is insufficient in a multiple-instance resource-allocation graph. A real lock manager may need details such as lock modes and queue order.

## 3. Check meaningful boundaries

```sh
python3 safe_state.py --self-test
python3 wait_graph.py --self-test
```

Expect two PASS lines. Safety tests cover the baseline, safe/unsafe grants, availability versus Max violations, conservation, invalid vectors, and not mutating the caller's state. Graph tests cover a cycle, self-loop, chain, DAG, disconnected component, and holder-only node.

Prediction log: state the result and which changed assumption would change your answer. Do not assume C belongs to the cycle or equate unsafe with deadlocked.

Scope: [official Week 4](https://mehmetgokturk.com/cse513/lecture-04.html); the PDF has not been published, so there are no original PDF/slide numbers. Further reading: [OSTEP concurrency bugs](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf), [PostgreSQL explicit locking](https://www.postgresql.org/docs/18/explicit-locking.html). The numerical example and Python code were designed for this learning package.
