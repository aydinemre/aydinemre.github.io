# Week 8 · Crash-consistency model lab

Semester week 8, lecture set 07. The original PDF is forthcoming; this original educational adaptation follows the published scope. Allow 20–30 minutes. No official assignment or deadline is set.

Python 3 is sufficient. Run commands **from this lab folder**. The program constructs an in-memory model only; it performs no mounts, formatting, root operations, device writes, or host-filesystem repairs.

## Predict, then run

Initially `allocated=[4]`, `inode=[4]`, block5=`STALE`. Target: `allocated=[4,5]`, `inode=[4,5]`, block5=`NEW`.

Naive steps: D=data5, B=bitmap allocation, I=inode mapping. Predict the crash state with only D, then with D+B durable.

```sh
python3 crash_consistency.py --mode naive --crash-after 1
python3 crash_consistency.py --mode naive --crash-after 2
python3 crash_consistency.py --mode naive --crash-after 3
```

Journal order: `payload → commit → D → B → I → clear`. The number means **completed durable steps**. 0 crashes before the first step. 2 follows payload+commit. 4 follows payload+commit+D+B.

```sh
python3 crash_consistency.py --mode journal --crash-after 1
python3 crash_consistency.py --mode journal --crash-after 2
python3 crash_consistency.py --mode journal --crash-after 4
python3 crash_consistency.py --self-test
```

Record your prediction, then the `before` and `after` fields. The final command runs 45 checks: eight D/B/I subsets, seven journal prefixes, repeated recovery, crashes during recovery, and invalid early-commit rejection. Failed checks exit nonzero. An invalid `--crash-after` range produces a parser error.

## Model rules

Each model step is assumed atomic and durable. RAM is lost on a crash. Commit requires a complete valid payload; home installation starts after commit; journal clearing follows complete installation. Redo writes target values, making repetition idempotent.

This is not a filesystem/device emulator: torn writes, device reordering, checksum algorithms, concurrency, actual fsync/flush failures, and real recovery code are omitted. One model step for the payload does not assert any actual storage atomic-write size. Full-data redo does not imply that all filesystem journaling modes behave alike.

## Reasoning questions

1. D+B contains new bytes: why is there still a defect?
2. With I+B but no D, is consistent metadata enough?
3. Why does a pre-commit crash recover OLD?
4. After commit, what enables recovery when the home inode is still old?
5. What if recovery crashes again after D+B?
6. Does a returned `write` imply this model's durable commit?

<details><summary>Write your reasoning before opening the answers</summary>

1. Block5 is allocated but has no inode reference: an allocation leak.
2. No: metadata agrees but block5 exposes stale data.
3. Home writes start only after commit; the incomplete log is ignored.
4. The valid committed redo payload contains the target state.
5. The committed log remains; idempotent D/B/I replay again, with clear last.
6. No: API acknowledgment and durable boundaries have separate contracts.

Naive after1=OLD, after2=ALLOCATION_LEAK, after3=NEW. Journal recovery after1=OLD; after2/4=NEW.
</details>

References: [OSTEP crash consistency](https://pages.cs.wisc.edu/~remzi/OSTEP/file-journaling.pdf), [Linux ext4 journal](https://docs.kernel.org/filesystems/ext4/journal.html), [Linux fsync](https://man7.org/linux/man-pages/man2/fsync.2.html). The model is original; no complete source code or figures are redistributed.
