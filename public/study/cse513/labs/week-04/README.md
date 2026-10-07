# Hafta 4 — Kaynak grafiği ve safe-state laboratuvarı

Bu iki deney çevrimdışı çalışır. Python 3 standart kütüphanesi yeterlidir. Gerçek thread başlatılmaz, sonsuz bekleyen program oluşturulmaz, veritabanına bağlanılmaz. Komutları bu lab klasöründe çalıştır.

## 1. Önce tahmin, sonra safety witness

```sh
python3 safe_state.py --case baseline
python3 safe_state.py --case safe-request
python3 safe_state.py --case unsafe-request
```

Başlangıç: Total=(4,3), Available=(1,1), vektör sırası (A,B).

| Process | Allocation | Max | Need |
|---|---|---|---|
| P0 | (1,0) | (3,2) | (2,2) |
| P1 | (1,1) | (2,1) | (1,0) |
| P2 | (1,1) | (2,2) | (1,1) |

Önce Work=(1,1) ile hangi process'in bitirilebileceğini yaz. Baseline için deterministic witness P1→P0→P2; Work=(1,1)→(2,2)→(3,2)→(4,3). Başka geçerli sequence olabilir. Bu scheduler'ın zorunlu gerçek yürütme sırası değildir.

safe-request, P1'in (1,0) talebini aynı baseline'dan inceler: grant-safe, Available=(0,1), P1 Need=(0,0). unsafe-request, P0'ın (1,1) talebini yine baseline'dan inceler: defer-unsafe, trial Available=(0,0), hiçbir kalan Need sığmaz. Trial gösterilir, başlangıç state'i değiştirilmez. İki talebi peş peşe uygulanmış sayma.

Unsafe mevcut deadlock demek değildir. Max ilan edilen üst sınırdır, bütün process'ler bu miktarı mutlaka talep etmeyebilir. Şu anda compute yapıp daha az kaynakla bitirebilirler. Model, kaynakların tür içinde birbirinin yerine geçtiğini ve kalan Need karşılanırsa işlerin sonlu sürede bitirip kaynakları bıraktığını varsayar.

## 2. Sonra mevcut wait-for graph

```sh
python3 wait_graph.py --case cycle
python3 wait_graph.py --case chain
python3 wait_graph.py --case dependent
```

A→B, A'nın B'nin tuttuğu single-instance exclusive kaynağı beklediğini gösterir. cycle ve dependent: A→B→A. chain: çevrim yok. dependent'te C→A da vardır; C çevrimin üyesi değildir, fakat deadlocked A'yı beklediği için etkilenebilir. Program yalnız bir çevrim bulur; etkilenen tüm task'leri veya tüm cycle'ları listelediğini iddia etmez.

Bu model multiple-instance havuzlar için deadlock detection yapmaz. Çok-instance resource-allocation grafiğinde çevrim tek başına yeterli değildir. Gerçek lock manager'da lock modes ve queue sırası gibi ayrıntılar gerekebilir.

## 3. Anlamlı sınır kontrolü

```sh
python3 safe_state.py --self-test
python3 wait_graph.py --self-test
```

Beklenen: iki PASS satırı. Safety testleri: baseline, safe/unsafe grant, unavailable vs Max ihlali, conservation, hatalı vektör ve caller state'inin değiştirilmemesi. Graph testleri: çevrim, self-loop, zincir, DAG, disconnected component ve yalnız holder olarak görünen düğüm.

Tahmin defteri: Sonucu yaz; hangi varsayım değişirse cevabın değişeceğini belirt. Daha sonra C'nin çevrime dahil olduğunu sanma ve unsafe=deadlocked eşitliğini kurma.

Kaynak kapsamı: [resmî Hafta 4](https://mehmetgokturk.com/cse513/lecture-04.html); PDF henüz yayımlanmamış olduğundan özgün PDF/slayt numarası yok. [OSTEP concurrency bugs](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf), [PostgreSQL explicit locking](https://www.postgresql.org/docs/18/explicit-locking.html). Sayısal örnek ve Python kodu bu öğrenme paketi için tasarlandı.
