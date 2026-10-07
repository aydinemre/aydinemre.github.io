# Hafta 9 · Görünürlük, yetki ve bütçe modeli

Dönem haftası 9, ders seti 08. PDF henüz yayımlanmadığından bu çalışma resmi kapsamın özgün öğretim uyarlamasıdır. 20–30 dakika ayır. Resmi ödev veya deadline değildir.

Gereken: Python 3. Komutlar **bu lab klasöründen** çalışır. Program gerçek VM/container, mount, cgroup, root, host secret erişimi veya host OOM oluşturmaz. Yalnız sözlükler ve sayılar üzerinden policy kararları üretir.

## Önce tahmin

A: local PID1 / host PID410. B: local PID1 / host PID520. Bunlar örnek kimliklerdir, gözlem değildir. İki scope da `/app/config` read-only ve `/app/data` read-write görünümüne sahiptir. `/host/secret` görünmez. Viewer yalnız read, editor read/write ister; görünür mount'un mode'u ayrıca denetlenir.

```sh
python3 isolation_budget.py --scope a --role viewer --path /app/config --action read
python3 isolation_budget.py --scope a --role viewer --path /app/data --action write
python3 isolation_budget.py --scope a --role editor --path /app/config --action write
python3 isolation_budget.py --scope a --role editor --path /host/secret --action read
```

Her çağrıda access decision tahminini yaz. HIDDEN sonucu şifreleme değil, model görünümünde path yok demektir. Aynı local PID başka object olabilir. Model mount listesi gerçek path açmaz.

## Kaynak bütçesini ayrı incele

```sh
python3 isolation_budget.py --quota 50 --demand 80
python3 isolation_budget.py --quota 100 --demand 80
python3 isolation_budget.py --memory-used 192 --memory-request 64
python3 isolation_budget.py --memory-used 192 --memory-request 80
python3 isolation_budget.py --self-test
```

Model period=100ms, tek CPU, quota50 ise demand80'in served50/unmet30 olur. Her çağrı yeni period için budget'i yeniler; backlog taşınmaz. Quota service ceiling'dir, minimum service veya request deadline garantisi değil.

Model memory capacity256MiB. 192+64 tam sınıra ulaşır; kabul edilir. 192+80 reddedilir ve used192 kalır. Gerçek Linux memory.max her request'i bu biçimde atomik reddetmez: reclaim/OOM/accounting yolları farklıdır. Bu sonuç gerçek OOM trace'i değildir.

Self-test 69 anlamlı kontrol içerir: namespace kimlik ayrımı; dört ayrı erişim kararı; 16 quota/demand çiftinde demand conservation ve budget; period yenileme; memory sınırı; invalid input reddi. Başarısızlık nonzero exit üretir.

## Gerekçeli sorular

1. Quota'yı100 yapmak viewer'a write verir mi?
2. Editor neden read-only config'i yazamaz?
3. Local PID1 iki scope arasında erişim hakkı yaratır mı?
4. Memory limit verinin gizliliğini kanıtlar mı?
5. HIDDEN sonucu gerçek Linux kernel isolation kanıtı mı?
6. Bu modele VM hypervisor vulnerability testi diyebilir miyiz?

<details><summary>Önce yanıtla; sonra anahtarı aç</summary>

1. Hayır: quota CPU, role action yetkisi ayrıdır.
2. Role yeterli olsa bile görünür mount mode'u write'ı dışlar.
3. Hayır: aynı local ad, farklı object/membership olabilir.
4. Hayır: resource policy availability boyutudur; data access farklıdır.
5. Hayır: modelin açık allowlist/mapping kararıdır.
6. Hayır: model hypervisor veya kernel çalıştırmaz, exploit resistance doğrulamaz.

Access sonuçları sırayla ALLOWED, DENIED_ROLE, DENIED_READ_ONLY, HIDDEN. CPU quota100/demand80 served80/unmet0; quota50 served50/unmet30.
</details>

Kaynaklar: [Linux namespaces](https://man7.org/linux/man-pages/man7/namespaces.7.html), [cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html), [Docker security](https://docs.docker.com/engine/security/), [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/). Model bu arayüzleri emüle etmez; görüş, yetki ve bütçe ayrımını öğretir.
