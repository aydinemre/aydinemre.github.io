# Hafta 3: paylaşımı kanıtlayarak incele

Bu pratik yaklaşık 20–30 dakika sürer. Resmî ödev, not veya teslim tarihi tanımlamaz. Gerekenler: Python 3 ve pthread destekli C11 derleyici. Ubuntu/Linux hedeflenir; hazırlık makinesinde macOS/Apple clang ile derleme ve çalıştırma doğrulandı. Ubuntu koşusu yapılmış gibi sunulmuyor. Platform ve çıktılar `../build/lab-validation.json` içinde.

Komutları **bu lab klasöründe** çalıştır. Derleyici çıktısı olmayınca başarılı olabilir; programın exit status'u da önemlidir.

## 1. Önce tahmin: altı sıralama

A ve B aynı 0 sayacını birer kez artırıyor. Her thread'in ilk adımı atomik read, ikinci adımı özel register + 1'i atomik write. Sequential consistency varsayılıyor. AABB, ABAB, ABBA, BAAB, BABA, BBAA için son değeri kâğıda yaz.

```sh
python3 interleavings.py --trace
```

Model altı izinli sıranın hepsini deterministik üretir, beklenen sonuçları denetler. Gerçek thread scheduler'ı, C data race veya undefined behavior simülasyonu değildir. Sıralar eşit olasılıklı sayılmaz.

Sorular: Hangisinde ikinci read, ilk write'dan önce geldi? Doğru sonucu veren iki iz neden algoritmanın doğruluğunu kanıtlamaz? Modelin atomik read ve write'ı tek increment yapar mı?

## 2. Queue protokolünü çalıştırmadan önce işaretle

`bounded_buffer.c` bir producer ve bir consumer içerir. `data/in/out/count/closed` aynı mutex ile korunur. Producer 1..10000 öğelerini ekler; consumer her öğenin FIFO sıra numarasını denetler. Consumer sonuç alanlarını yalnız consumer yazar; main join sonrası okur.

Şu dört satırı kendi sözlerinle yaz:

- Değişmez: `0 <= count <= CAPACITY`; indeksler kapasite aralığında.
- Producer beklemesi: `count == CAPACITY`; consumer remove ile değiştirir.
- Consumer beklemesi: `count == 0 && !closed`; producer insert/close ile değiştirir.
- Bitiş: producer bütün öğelerden sonra closed yapar; consumer kalanları boşaltır, ancak closed ve empty olunca çıkar.

```sh
cc -std=c11 -O2 -Wall -Wextra -Werror -pthread bounded_buffer.c -o /tmp/cse513-w3-buffer
/tmp/cse513-w3-buffer
cc -std=c11 -O2 -Wall -Wextra -Werror -pthread -DCAPACITY=1 bounded_buffer.c -o /tmp/cse513-w3-buffer-one
/tmp/cse513-w3-buffer-one
```

Kapasiteyi 1 yapmadan önce sonuç ile bekleme düzeninin hangisinin değişeceğini tahmin et. Platformunu `uname -a`, derleyicini `cc --version` ile kaydet. Her iki koşuda beklenen: `consumed=10000 sum=50005000 FIFO=OK closed=1 drained=1`; capacity alanı 4 veya 1 olur.

Bir hang olursa bağımlılık izi çıkar: hangi thread hangi predicate'i, hangi mutex'i ve hangi değiştirici operasyonu bekliyor? Kodda sleeps eklemek doğru protokolün yerine geçmez.

## 3. İnceleme soruları

1. `pthread_cond_wait` neden mutex'i bırakır ve geri alır?
2. Neden `if` değil `while` kullanılır?
3. Signal consumer için öğe ayırır mı? Semaphore post'tan farkı ne?
4. Closed olup count=3 ise consumer ne yapar?
5. Sum tek başına neden yeterli kontrol değil?
6. Main sonuç için neden ek queue lock'u almıyor?

<details><summary>Önce yanıtla; sonra cevap anahtarını aç</summary>

1. Peer predicate'i değiştirebilsin diye bırakır; ortak state'i tutarlı kontrol edebilmek için dönüşte geri alır.
2. Başka consumer öğeyi önce alabilir veya spurious wakeup olabilir; predicate yeniden denenir.
3. Hayır. Condition notification permit saklamaz. Semaphore başarılı wait ile tüketilecek permit'i saklar; bir semaphore queue mutex'ini otomatik bırakmaz.
4. Üç öğeyi drain eder ve ancak closed && empty iken çıkar.
5. Eksik bir öğe ile duplicate toplamda birbirini gizleyebilir. FIFO için her sıra numarası denetlenir.
6. Consumer bitmiştir ve join sıralama sağlar; sonuçları artık yazan thread yoktur.

Modelde AABB/BBAA sonucu 2, diğerleri 1'dir. 4/6 bir hata olasılığı iddiası değildir.
</details>

## Sınırlar ve gerekçe

Bu program cancellation, process crash, timeout veya production recovery tasarlamaz. Pthread hatasında tüm process'i hata ile bitirir. Mutex/condition return code'ları kontrol edilir; mutex sahibi ve canlı nesne ömrü bellidir. Çok producer eklemek son producer kapanış accounting'i gerektirir. Closure broadcast'i tüketicileri yeniden predicate kontrolüne davet eder; fairness garantisi değildir.

Güvenlik argümanı: bütün queue geçişleri aynı mutex altında, uygun predicate kontrolünden sonra yapılır. İlerleme argümanı: condition wait lock'u bırakır; worker'lar schedule edilir ve işlerini sonlandırır varsayımıyla peer gerekli state değişimini yapabilir. Completion: producer finite iş sonrası kapanır, consumer drain edip sonlanır. Çalıştırma yalnız gözlenen koşuları denetler; bu argümanların yerini almaz.

Kaynaklar: [özgün hafta 3 PDF](https://mehmetgokturk.com/cse513/materials/lecture03/CSE513-Lecture03.pdf), [POSIX condition wait](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html), [OSTEP condition variables](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf).
