# Hafta 8 · Crash consistency model laboratuvarı

Dönem haftası 8, ders seti 07. Özgün PDF henüz yayımlanmadığından bu çalışma yayımlanmış kapsama dayalı özgün öğretim uyarlamasıdır. 20–30 dakika ayır. Resmi ödev veya teslim tarihi tanımlamaz.

Python 3 yeterlidir. Komutları **bu lab klasöründe** çalıştır. Program yalnız in-memory model oluşturur; mount, format, root yetkisi, gerçek aygıt yazması veya host filesystem repair içermez.

## Tahmin ve çalıştır

Başlangıç: `allocated=[4]`, `inode=[4]`, block5 içeriği `STALE`. Hedef: `allocated=[4,5]`, `inode=[4,5]`, block5=`NEW`.

Naive adımlar: D=data5, B=bitmap allocation, I=inode mapping. Önce yalnız D ve D+B kalıcıysa crash sonrası durumu tahmin et.

```sh
python3 crash_consistency.py --mode naive --crash-after 1
python3 crash_consistency.py --mode naive --crash-after 2
python3 crash_consistency.py --mode naive --crash-after 3
```

Journal sırası: `payload → commit → D → B → I → clear`. Adım sayısı **tamamlanmış durable adım sayısıdır**. 0 ilk adım öncesi crash'tir. 2 payload+commit sonrasıdır. 4 payload+commit+D+B sonrasıdır.

```sh
python3 crash_consistency.py --mode journal --crash-after 1
python3 crash_consistency.py --mode journal --crash-after 2
python3 crash_consistency.py --mode journal --crash-after 4
python3 crash_consistency.py --self-test
```

Önce tahminini, sonra `before` ve `after` alanlarını yaz. Son komut 45 kontrolü doğrular: sekiz D/B/I subset, yedi journal prefix, tekrar recovery, recovery içindeki crash ve erken commit reddi. Başarısız kontrol nonzero exit ile sonuçlanır. Yanlış `--crash-after` aralığı parser error üretir.

## Modelin kuralları

Her model adımı atomik ve durable kabul edilir. RAM crash'te kaybolur. Payload tam ve geçerli olmadan commit yok; commit olmadan home installation yok; home tamamlanmadan journal clear yok. Redo hedef değerleri tekrar yazdığı için idempotent'tir.

Bu, gerçek filesystem/device emülatörü değildir: torn write, device reordering, checksum algoritması, concurrency, gerçek fsync/flush failure veya gerçek recovery code içermez. Journal payload'ın tek model adımı olması gerçek storage atomicity boyutu iddiası değildir. Full-data redo modeli, tüm filesystem journaling modlarının aynı olduğu anlamına gelmez.

## Gerekçeli sorular

1. D+B sonrası yeni byte var: neden yine kusur var?
2. I+B var ama D yoksa metadata doğru olması yeterli mi?
3. Commit öncesi crash neden OLD'e döner?
4. Commit sonrası home inode eskiyse hangi kaynak recovery'yi mümkün kılar?
5. Recovery D+B sonrası yeniden crash olursa sonraki recovery ne yapar?
6. `write` döndü bilgisi bu modelin durable commit'i ile aynı mı?

<details><summary>Cevaplardan önce gerekçeni yaz</summary>

1. Block5 allocated fakat inode referansı yok: allocation leak.
2. Hayır: metadata consistent ama block5 stale data gösterir.
3. Home değişiklikleri commit'ten sonra başlar; incomplete log yok sayılır.
4. Geçerli committed redo payload hedef state'i içerir.
5. Committed log yerinde kalır; idempotent D/B/I tekrar uygulanır, clear en son.
6. Hayır: API acknowledgment ve durable boundary ayrı sözleşmelerdir.

Naive after1=OLD, after2=ALLOCATION_LEAK, after3=NEW. Journal recovery after1=OLD; after2/4=NEW.
</details>

Kaynaklar: [OSTEP crash consistency](https://pages.cs.wisc.edu/~remzi/OSTEP/file-journaling.pdf), [Linux ext4 journal](https://docs.kernel.org/filesystems/ext4/journal.html), [Linux fsync](https://man7.org/linux/man-pages/man2/fsync.2.html). Bu model özgündür; kaynakların tam kodu/figürleri kopyalanmamıştır.
