# Hafta 06 / Week 06 — Page replacement

## Türkçe

Python 3 yeterlidir; internet ve paket kurulumu gerekmez. Komutları `hafta06` klasöründe çalıştırın:

```sh
python3 lab/replacement.py --policy fifo
python3 lab/replacement.py --policy lru
python3 lab/replacement.py --policy opt
python3 lab/replacement.py --belady --frames 3
python3 lab/replacement.py --belady --frames 4
python3 lab/replacement.py --dirty --frames 2
python3 lab/replacement.py --references '[1,2,3,1,2,3]' --frames 2 --policy lru
python3 -m unittest discover -s lab -p 'test_*.py' -v
```

Ana iz `7,0,1,2,0,3,0,4,2,3,0,3,2`, üç başlangıçta boş frame: FIFO=10 fault/3 hit, LRU=9/4, OPT=7/6. Belady izi `1,2,3,4,1,2,5,1,2,3,4,5`: FIFO üç frame ile 9, dört frame ile 10 fault üretir. Dirty örneği iki frame ile 3 fault, 1 hit, 1 writeback üretir. Son LRU komutu altı erişimin hepsinde fault verir.

Varsayımlar: soğuk başlangıç, sabit frame sayısı, sıralı tek süreç referansları, önceden getirme yok. FIFO hit'te yüklenme yaşını değiştirmez; LRU her erişimi kullanır. OPT geleceği bilir ve yalnız karşılaştırma sınırıdır; eşit uzaklıkta en küçük slotu seçer. Dirty bit okumada temizlenmez. Writeback yalnız dirty tahliyede sayılır; program sonundaki dirty sayfalar için flush sayılmaz, I/O süresi ve kalıcılık modellenmez. Varsayılan working-set penceresi son dört referanstır, dört milisaniye değildir. Sayfa hatası sayısı tek başına thrashing teşhisi değildir.

Sekiz test bilinen sonuçları, Belady örneğini, hit yaşını, dirty yazmayı, working set'i ve geçersiz girdileri doğrular. Ayrıca seed=513 ile 50 rastgele izde resident-slot özellikleri ve LRU'nun kapasiteyle azalmayan başarımı kontrol edilir; kısa OPT izi bağımsız kapsamlı aramayla karşılaştırılır. 7 Ekim 2026'da macOS üzerinde Python 3 ile çalıştırıldı. Ubuntu komutları aynıdır. Gerçek işletim sistemi page fault'ları ölçülmez.

## English

Requires only Python 3 and works offline. Run the commands above from `hafta06`.

For the main trace `7,0,1,2,0,3,0,4,2,3,0,3,2` and three initially empty frames: FIFO has 10 faults/3 hits, LRU 9/4 and OPT 7/6. For the Belady trace `1,2,3,4,1,2,5,1,2,3,4,5`, FIFO has 9 faults with three frames and 10 with four. The two-frame dirty example has 3 faults, 1 hit and 1 writeback. The final LRU command faults on all six accesses.

Assumptions: cold start, fixed frame count, sequential references from one process, no prefetch. FIFO hits do not refresh loading age; LRU uses every access. OPT knows future references and is a comparison bound, with ties resolved by the lowest slot. Reads do not clear dirty bits. Writebacks count only dirty evictions; there is no final flush, I/O-duration model or durability guarantee. The default working-set window is four references, not four milliseconds. Fault counts alone do not establish thrashing.

Eight tests check known counts, Belady's anomaly, hit ages, dirty eviction, working sets and invalid inputs. Fifty random traces with seed 513 additionally check resident-slot properties and the nonincreasing LRU fault count as capacity grows. A short OPT result is checked against an independent exhaustive search. Tested with Python 3 on macOS on 7 October 2026. Ubuntu commands are identical. This does not measure actual operating-system page faults.
