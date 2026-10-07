# Hafta 05 / Week 05 — Address translation

## Türkçe

Python 3 dışında bağımlılık yoktur; internet gerekmez. Komutları `hafta05` klasöründe çalıştırın:

```sh
python3 lab/translation.py
python3 lab/translation.py --process P --va 0x0134
python3 lab/translation.py --process Q --va 0x0134
python3 lab/translation.py --va 0x0100 --mode write
python3 lab/translation.py --va 0x0200
python3 -m unittest discover -s lab -p 'test_*.py' -v
```

Beklenen sonuçlar: P için VPN=1, offset=52, frame=7, PA=1844; Q için aynı VA, frame=9, PA=2356. P sayfa 1'e yazma `protection`; sayfa 2 okuması `not_present` verir. Bu sonuçlarda fiziksel adres üretilmez. Varsayılan iz, iki girişli LRU TLB'nin süreç kimliğini anahtara katmasını gösterir.

Model: 16 bit VA, 256 bayt sayfa, 32 fiziksel frame. Sadece izinli, resident erişimler TLB'ye alınır. TLB miss, page fault demek değildir. Sayfa tablosu değişirse önbellek kaydı `invalidate(process)` ile geçersiz kılınmalıdır; test bunu gösterir. Gerçek CPU, çekirdek veya bellek değişmez.

Seri TLB=10 ns, RAM=100 ns, %90 hit, tek seviyeli tablo için EAT=120 ns; iki seviye için 130 ns. Bu model page fault ve yürüyüş önbelleklerini içermez. 32 bit VA, 4 KiB sayfa, 4 bayt PTE ile düz tablo 4 MiB; 10|10|12 bölünmesi ve iki yaprak tablo ile toplam 12 KiB'dir.

Altı test adres sınırlarını, süreç ayrımını, izinleri, LRU tahliyesini, geçersiz kılmayı ve sayısal modelleri doğrular. 7 Ekim 2026'da macOS üzerinde Python 3 ile çalıştırıldı. Ubuntu komutları aynıdır; gerçek donanım ölçümü yapılmaz.

## English

Requires only Python 3 and works offline. Run the commands above from `hafta05`.

Expected results: for P, VPN=1, offset=52, frame=7, PA=1844; for Q, the same VA maps to frame=9, PA=2356. Writing P's page 1 returns `protection`; reading page 2 returns `not_present`. Neither result produces a physical address. The default trace illustrates process-tagged entries in a two-entry LRU TLB.

The model uses 16-bit virtual addresses, 256-byte pages and 32 physical frames. It caches only permitted resident accesses. A TLB miss need not be a page fault. After changing a page-table mapping, call `invalidate(process)`; a test demonstrates the stale-entry hazard. No real CPU, kernel or memory is modified.

With serial TLB=10 ns, RAM=100 ns and a 90% hit ratio, EAT is 120 ns for one page-table level and 130 ns for two. Page faults and page-walk caches are excluded. A flat table for 32-bit VA, 4 KiB pages and 4-byte PTEs is 4 MiB; a 10|10|12 split with two leaf tables occupies 12 KiB.

Six tests cover address boundaries, process isolation, permissions, LRU eviction, invalidation and numerical models. Tested with Python 3 on macOS on 7 October 2026. The Ubuntu commands are identical; this is not a hardware benchmark.
