# Week 3: reason about safe sharing

Allow 20–30 minutes. This practice sets no official assignment, grade, or deadline. Requirements: Python 3 and a C11 compiler with pthread support. Ubuntu/Linux is the target; compilation and execution were verified on the preparation machine using macOS/Apple clang. No Ubuntu run is claimed. Platform and outputs are recorded in `../build/lab-validation.json`.

Run commands **from this lab folder**. A compiler can succeed silently; also inspect the program exit status.

## 1. Predict first: six orders

A and B each increment the same initial counter 0. Each thread's first step is an atomic read; its second is an atomic write of private register + 1. Assume sequential consistency. Predict the final value for AABB, ABAB, ABBA, BAAB, BABA, BBAA on paper.

```sh
python3 interleavings.py --trace
```

The model deterministically enumerates all six allowed orders and verifies known outcomes. It is not a simulation of a real scheduler, a C data race, or undefined behavior. The schedules are not assumed equally probable.

Questions: In which traces does the second read precede the first write? Why do two successful traces not prove algorithm correctness? Do individually atomic reads and writes make the whole increment atomic?

## 2. Annotate the queue protocol before running

`bounded_buffer.c` has one producer and one consumer. One mutex protects `data/in/out/count/closed`. The producer inserts values 1..10000; the consumer checks every FIFO sequence number. Only the consumer writes its result fields; main reads them after join.

Write these four lines in your own words:

- Invariant: `0 <= count <= CAPACITY`; indices remain within capacity.
- Producer waits while `count == CAPACITY`; consumer removal changes this.
- Consumer waits while `count == 0 && !closed`; producer insertion/closure changes this.
- Completion: the producer closes after all insertions; the consumer drains remaining work and exits only when closed and empty.

```sh
cc -std=c11 -O2 -Wall -Wextra -Werror -pthread bounded_buffer.c -o /tmp/cse513-w3-buffer
/tmp/cse513-w3-buffer
cc -std=c11 -O2 -Wall -Wextra -Werror -pthread -DCAPACITY=1 bounded_buffer.c -o /tmp/cse513-w3-buffer-one
/tmp/cse513-w3-buffer-one
```

Before changing capacity to 1, predict which changes: the result or the waiting pattern? Record your platform using `uname -a` and compiler using `cc --version`. Both runs should report `consumed=10000 sum=50005000 FIFO=OK closed=1 drained=1`; capacity is 4 or 1.

For a hang, draw a dependency trace: which thread waits for which predicate, mutex, and enabling operation? Adding sleeps does not replace a correct protocol.

## 3. Review questions

1. Why does `pthread_cond_wait` release and reacquire the mutex?
2. Why use `while` rather than `if`?
3. Does signal reserve an item for a consumer? How does it differ from semaphore post?
4. What if closed is true and count is 3?
5. Why is checking only the sum insufficient?
6. Why does main not take an extra queue lock to read the results?

<details><summary>Answer first; then open the answer key</summary>

1. Releasing lets the peer change the predicate; reacquiring permits a consistent check of shared state.
2. Another consumer may remove the item first, or a spurious wakeup can occur; recheck the predicate.
3. No. A condition notification stores no permit. A semaphore stores permits consumed by successful waits; a semaphore wait does not automatically release the queue mutex.
4. Drain the three items, then exit when closed && empty.
5. A missing item and duplicate can conceal each other in an aggregate. Every sequence number is checked for FIFO.
6. The consumer has terminated and join establishes ordering; no thread continues writing the results.

In the model, AABB/BBAA finish at 2 and the others at 1. This is not a 4/6 failure-probability claim.
</details>

## Limits and argument

The program does not implement cancellation, crash recovery, timeouts, or production recovery. A pthread error terminates the entire process with failure. Return codes are checked; mutex ownership and object lifetime are clear. Multiple producers would require last-producer completion accounting. Closure broadcast invites consumers to recheck; it does not guarantee fairness.

Safety: every queue transition uses the same mutex after checking the required predicate. Progress: condition waits release the mutex; assuming workers are scheduled and their work terminates, peers can make enabling state changes. Completion: the finite producer closes, and the consumer drains then exits. Execution checks observed runs; it does not replace these arguments.

References: [original week 3 PDF](https://mehmetgokturk.com/cse513/materials/lecture03/CSE513-Lecture03.pdf), [POSIX condition wait](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html), [OSTEP condition variables](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf).
