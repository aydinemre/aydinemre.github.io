# Hafta 2 / Week 2 — Offline scheduler lab

## Türkçe

Bu lab bir **öğretim modeli**: Python3 standart kütüphanesi, network yok, tek mantıksal CPU, integer zaman, I/O yok. Gerçek Linux scheduler’ını çalıştırmaz. Önce tahminini yaz, sonra JSON output içindeki timeline ve metrics ile karşılaştır.

Hafta02 klasöründen:

```sh
python3 lab/scheduler.py --algorithm fcfs
python3 lab/scheduler.py --algorithm sjf
python3 lab/scheduler.py --algorithm srtf
python3 lab/scheduler.py --algorithm rr --quantum 2
python3 lab/scheduler.py --algorithm priority
python3 lab/scheduler.py --algorithm rr --quantum 2 --switch-cost 1
python3 lab/scheduler.py --algorithm rm --until 240
python3 lab/scheduler.py --algorithm edf --until 240
python3 lab/test_scheduler.py
```

Ortak veri kümesi `(id,arrival,burst,priority)`:

```text
P1,0,8,3
P2,1,4,1
P3,2,9,4
P4,3,5,2
```

Priority’de küçük sayı daha yüksek; örnek nonpreemptive. FCFS/SJF de nonpreemptive, SRTF ve RR preemptive. Selection ties arrival sonra input order; SRTF exact remaining tie’da current devam eder. RR endpoint’e kadar ve tam endpoint’te gelenler önce kuyruğa eklenir, ardından bitmeyen current requeue edilir. Quantum useful CPU süresidir. Aralıklar `[start,end)`.

Varsayılan overhead0. `--switch-cost` yalnız RR içindir; consecutive farklı task geçişini sayar. Initial dispatch, idle sonrası dispatch ve aynı task continuation cost0. Dispatch’te seçilen job rezerve kalır; o sürede arrivals tail’e eklenir. Bu belirli maliyet modeli bütün gerçek context-switch maliyetlerini temsil etmez.

Beklenen ortalamalar:

| Algorithm | Waiting | Turnaround | First-service response |
|---|---:|---:|---:|
| FCFS | 8.75 | 15.25 | 8.75 |
| SJF | 7.75 | 14.25 | 7.75 |
| SRTF | 6.5 | 13 | 4.25 |
| RR q2,cost0 | 12.75 | 19.25 | 2 |
| Priority nonpreemptive | 7.75 | 14.25 | 7.75 |
| RR q2,cost1 | 22.25 | 28.75 | 3.75 |

RR cost1 modelinde toplam useful26 + switch12 = elapsed38. Cost0’da hepsi elapsed26’da tamamlanır. Response `first_start−arrival`; turnaround `completion−arrival`; waiting `turnaround−burst`, çünkü I/O yok.

Kendi tek-burst veri kümen:

```sh
python3 lab/scheduler.py --algorithm rr --quantum 2 --jobs '[["A",0,4,1],["B",2,1,1]]'
```

Beklenen trace: A0–2, B2–3, A3–5. Bu küçük case endpoint arrival’ın requeue’dan önce olduğunu sınar. İsimler tekil string, arrival/burst/priority integer; arrival≥0, burst>0.

RT CLI sabit Example B kullanır: P1(C25,T=D50), P2(C35,T=D80), ms; first release0, full preemption, independent tasks, zero blocking/jitter/overhead. RM kısa period; EDF erken absolute deadline. Equal key’de current korunur, sonra release/input order. Miss edilen job drop edilmez. `until` horizon’da bitmemiş job’ın deadline’ı geçmişse missed işaretlenir; deadline horizon dışında ise karar verilmez. Deadline’da tam completion zamanındadır.

0–240 trace’inde RM P2@0’ı deadline80 yerine85’te tamamlar; EDF hiç miss göstermez. **Finite trace tüm zaman schedulability proof değildir.** İçerikteki theorem yalnız ilgili D=T/single-CPU varsayımları altında guarantee verir. Algoritmada RT response metric hesaplanmıyor; source’daki response-time analysis release-to-completion kavramıdır.

Yedi test bilinen completion/metric değerlerini, endpoint ordering, current tie, dispatch reservation, idle/same-task cost0 ve finite-horizon deadline semantics’ini kontrol eder. Seed513 ile40 rastgele workload için demand conservation, no execution before arrival, timeline continuity ve nonnegative metrics de kontrol edilir. Testler yerel macOS Python3’te 7 Ekim2026’da geçti. Ubuntu scheduling observation bu testlere dahil değildir.

Ubuntu’da isteğe bağlı **read-only** gözlem:

```sh
uname -r
lscpu
ps -o pid,cls,ni,psr,comm -p "$$"
chrt -p "$$"
taskset -pc "$$"
```

PSR sample’dır; affinity rezervasyon değil allowed-placement restriction. Simülatör çıktısı gerçek kernel measurement’ı veya deadline guarantee değildir. Bu lab resmî notlandırma/teslim tarihi tanımlamaz.

## English

This lab is a **teaching model** using standard Python3 only: offline, one logical CPU, integer time, and no I/O. It does not run Linux’s scheduler. Predict first, then inspect the JSON timeline and metrics. Run the commands above from the week02 directory.

The shared workload is `(id,arrival,burst,priority)`: P1(0,8,3), P2(1,4,1), P3(2,9,4), P4(3,5,2). Smaller numbers mean higher priority. FCFS, SJF, and priority are nonpreemptive; SRTF and RR are preemptive. Selection ties follow arrival then input order, except SRTF retains the current job on an exact remaining-time tie. RR enqueues all arrivals through the slice endpoint before requeueing the unfinished current job. Quantum counts useful CPU time. Intervals are `[start,end)`.

Default overhead is zero. `--switch-cost` is available only for RR and charges transitions between different consecutive jobs. Initial dispatch, dispatch after idle, and continuing the same task cost zero. A selected job remains reserved during dispatch; new arrivals join the queue tail. This is a specified cost model, not a comprehensive model of actual context switches.

The expected means are shown in the table above. With RR q2,cost1, useful service26 plus switching12 gives elapsed38. All zero-cost traces finish at26. First-service response is `first_start−arrival`; turnaround is `completion−arrival`; waiting is `turnaround−burst` in this no-I/O model.

The custom `--jobs` example above produces A0–2,B2–3,A3–5 and checks endpoint ordering. Job names must be unique strings; arrival, burst, and priority are integers; arrival≥0 and burst>0.

The real-time CLI uses fixed Example B: P1(C25,T=D50), P2(C35,T=D80), in milliseconds. It assumes releases starting at0, full preemption, independent tasks, and zero blocking, jitter, and overhead. RM selects the shortest period; EDF selects the earliest absolute job deadline. Exact-key ties retain current work, then use release/input order. Missed jobs continue rather than being dropped. An unfinished job with deadline at or before the horizon is marked missed; later deadlines remain unjudged. Completion exactly at the deadline is on time.

Over0–240, RM completes P2@0 at85 after deadline80; EDF has no observed miss. **A finite trace is not an all-time schedulability proof.** The theorem in the lesson supplies a guarantee only under the stated single-CPU,D=T model. The RT simulator does not calculate a response metric; response-time analysis in the source means release-to-completion, unlike first-service response in the ordinary workload.

Seven tests check known completions/means, RR endpoint ordering, current-job ties, dispatch reservation, zero idle/same-job costs, and finite-horizon deadlines. Forty deterministic random workloads (seed513) check conserved demand, no service before arrival, continuous nonoverlapping timeline segments, and nonnegative metrics. Tests passed locally with Python3 on macOS on7 October2026. Ubuntu scheduling observations were not run as part of these checks.

Optional read-only Ubuntu commands are listed above. PSR is a sample; affinity restricts placement without reserving a CPU. Simulator output is not a kernel measurement or a deployed deadline guarantee. This practice defines no official grading or submission deadline.

## References / Kaynaklar

- [CSE513 Week2 source lecture](https://mehmetgokturk.com/cse513/materials/lecture02/CSE513-Lecture02.pdf)
- [OSTEP: Scheduling Introduction](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf)
- [Linux EEVDF documentation](https://docs.kernel.org/scheduler/sched-eevdf.html)
- [Linux scheduling interfaces](https://man7.org/linux/man-pages/man7/sched.7.html)
