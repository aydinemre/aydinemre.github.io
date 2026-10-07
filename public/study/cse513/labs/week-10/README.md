# Hafta 10 / Lecture set 09 — Retry ve olay sırası

Python 3 standart kütüphanesiyle çevrimdışı çalışır. Gerçek ağ, sunucu, ödeme veya dış servis çağrısı yoktur. Kod yalnız bellekte finite öğretim izlerini üretir. Komutları lab klasöründe çalıştır.

## Önce tahmin: ilk cevap kayboldu

```sh
python3 rpc_retry.py --mode naive
python3 rpc_retry.py --mode dedupe
python3 rpc_retry.py --mode reset
```

Başlangıç counter=0. t0 client op-7(amount1) gönderir; t4 server uygular, reply kayıp; t8 timeout; t10 aynı operation ID tekrar gönderilir; t11 server retry'ı işler; t16 client cevap görür. Zamanlar model birimleridir.

| Mode | Final counter | Neden? |
|---|---|---|
| naive | 2 | İki delivery iki application |
| dedupe | 1 | Aynı ID/payload için korunmuş sonuç kaydı |
| reset | 2 | t9 kayıt kaybolur; counter korunur; retry yeni uygulama sayılır |

Timeout ilk işlemin yapılmadığını kanıtlamaz. dedupe gerçek network exactly-once garantisi değildir. Kayıt ömrü, scope, kalıcılık ve state update ile atomiklik bu örneğin gerçek tasarıma taşınmasında önemlidir. Lab sequential transition içinde etki ve kaydı birlikte tutar; aralarındaki crash penceresini implement etmez. reset kasıtlı bir karşı örnektir.

Aynı ID farklı amount ile gelirse dedupe server ValueError verir ve counter değiştirmez. ID uniqueness/client scope veya authentication protokolü bu lab'ın dışında. Gerçek sistem concurrent duplicate, durable state, external side effects ve retention sınırlarını ayrıca ele almalıdır.

## Sonra ordering: clock küçükse neden olmak zorunda mı?

```sh
python3 lamport_trace.py
```

Clock'lar sıfırdan başlar. A local1, A send2, B independent local1, B receive3, B local4. Receive kuralı max(local, received)+1.

A send→B receive kanıtlı message edge'dir. B independent local clock1, A send clock2 olmasına rağmen B local→A send sonucu çıkmaz; iki event concurrent'tir. Satır sırası simülatörün sırasıdır, global causal sıra değildir.

## Sınırları doğrula

```sh
python3 rpc_retry.py --self-test
python3 lamport_trace.py --self-test
```

İki PASS satırı beklenir. RPC testleri naive/dedupe/reset, identical duplicate sonucu, farklı payload reddi ve invalid input/state preservation kontrollerini içerir. Clock testleri receive/max hesabı, local/send artışı, causal edge sırası, transitivity ve converse counterexample içerir.

Çalışma defteri: her sonuç için koşulu yaz; ardından bir koşulu değiştirip beklentini belirt. “Timeout=failed” veya “clock order=causality” eşitliği kurma.

Kaynak kapsamı: [Lecture09 / Week10](https://mehmetgokturk.com/cse513/lecture-09.html). Kaynak sayfada PDF hazırlanıyor; özgün slide numarası yok. Birincil okumalar: [OSTEP Distributed Systems](https://pages.cs.wisc.edu/~remzi/OSTEP/dist-intro.pdf), [Lamport Time, Clocks, and the Ordering of Events](https://lamport.azurewebsites.net/pubs/time-clocks.pdf). [Raft](https://raft.github.io/raft.pdf) yalnız isteğe bağlı ileri okuma; resmî paper ataması değildir. Kod ve sayılar bu paket için özgün öğretim modelleridir.
