# Hafta 1: tahmin → gözlem → açıklama

Bu örnekler resmî ödev veya teslim tarihi tanımlamaz. Her çalıştırmadan önce beklediğin çıktıyı yaz; sonra farkın teknik nedenini açıkla. Kaynaklar POSIX C içindir. Dersin hedef ortamı Ubuntu/Linux’tur.

## Ubuntu’da derleme

Bu klasörde terminal aç. GCC veya Clang gerekir. GCC ile:

```sh
gcc -std=c11 -Wall -Wextra -Werror -pedantic fork_memory.c -o fork_memory
gcc -std=c11 -Wall -Wextra -Werror -pedantic launch.c -o launch
gcc -std=c11 -Wall -Wextra -Werror -pedantic -pthread thread_join.c -o thread_join
gcc -std=c11 -Wall -Wextra -Werror -pedantic pipe_eof.c -o pipe_eof
```

Clang kullanıyorsan aynı komutlarda `gcc` yerine `clang` yaz. Thread örneğindeki `-pthread` derleme ve bağlama seçeneğini koru.

## 1. fork belleği birleştirmez

```sh
./fork_memory
```

Beklenen başarılı çıktı:

```text
child: x = 20
parent: x = 10
```

Başlangıçta `x = 10`. Child kendi özel değişkenini 20 yapar; parent çocuğun tamamlanmasını bekler ve kendi 10 değerini okur. Child `dprintf` ile doğrudan stdout’a yazar, sonra `_exit` çağırır. Böylece bekleme sonrası çıktı sırası stdio tamponunda saklı bir child mesajına bağlı kalmaz. `waitpid` kesilirse EINTR için tekrar denenir; exit status yorumlanmadan başarı kabul edilmez.

Tahmin sorusu: wait, parent’ın x değerini 20 yapabilir mi? Hayır; beklemek bitiş sırasını kurar, adres alanlarını birleştirmez. Açık shared memory bu örnekte yoktur. COW optimizasyonu özel bellek semantiğini değiştirmez.

## 2. fork oluşturur, exec değiştirir, wait toplar

```sh
./launch
```

Beklenen başarılı çıktı:

```text
child
parent: child exit status = 0
```

Child `/bin/echo` programını yürütür. Başarılı exec aynı PID içinde eski program image’ını değiştirir ve eski execl satırından sonraki koda dönmez. Parent’ın raporu child’ın sonlanmasını topladıktan sonra basılır.

Başarısız program başlatmayı da gözle:

```sh
./launch /cse513-deliberately-missing-executable
printf 'launch programının çıkış kodu: %s\n' "$?"
```

Path gerçekten yoksa stderr’da `execl: ...` hata mesajı görünür; mesajın dili sisteme bağlıdır. Stdout:

```text
parent: child exit status = 127
launch programının çıkış kodu: 1
```

127 child’ın bu örnekte seçtiği başarısız exec kodudur. Parent sonucu toplar ve başarısızlığı kendi çıkış kodu 1 ile bildirir. Exec’in başarısız olması waitpid’nin başarısız olması değildir. Child signal ile sonlanırsa parent bunu ayrıca bildirir. Örnekler tek thread’li process’ten fork eder; çok thread’li fork sonrası güvenli işlev kısıtları burada çalışılmıyor.

## 3. Ortak nesne, doğru sıra ve canlı ömür

```sh
./thread_join
```

Beklenen çıktı:

```text
result = 49
```

Main `input = 7` nesnesini oluşturur. Worker aynı process’in adres alanındaki bu nesneye sonucu yazar. Main sonucu başarılı join’den sonra okur. Nesne worker bitene kadar canlı kalır. Pthread işlevleri hata numarasını dönüş değeriyle verir; kod `strerror` ile bu değeri açıklamaktadır.

Bu örnekte iki aktif thread aynı sonucu eşzamanlı güncellemez. Join genel bir mutex değildir. Join başarısız olursa program process’i sonlandırır; worker hâlâ nesneyi kullanırken main scope’unu normal biçimde terk etmeyi denemez. Argümanı silip, scope dışına çıkarıp veya sonucu join öncesi okuyarak güvenli örneği bir C data race deneyine çevirmeyin; kavramsal lost update tablosunu kullanın.

## 4. İsteğe bağlı: boş kanal EOF değildir

```sh
./pipe_eof
```

Beklenen çıktı:

```text
empty pipe + writer open: EAGAIN (EOF değil)
empty pipe + all writers closed: EOF (read = 0)
```

Bu kısa ek deney tek process’te iki pipe ucunu tutar. Read ucuna `O_NONBLOCK` koyarak yazma ucu açıkken sonsuza dek beklemeyi önler. Boş ve writer açıkken `read` -1 döner, errno EAGAIN/EWOULDBLOCK olur. Tek writer referansı kapatılınca boş kanaldan read 0 döner: EOF. Blocking read modelinde ilk durum bekleyebilir; bu örnekte beklemenin yerine nonblocking gözlem kullanılıyor. Kod byte aktarmayı veya iki process’i göstermiyor; yalnız açık writer referansının EOF etkisini izole ediyor.

## Ubuntu’da süreç gözlemi

```sh
sleep 20 &
demo_pid=$!
ps -o pid,ppid,stat,comm -p "$demo_pid"
wait "$demo_pid"
```

PID ve durum sabit beklenen çıktılar değildir. Linux’ta R, running veya runnable olabilir. S/sleeping etiketi eksik olayın ne olduğunu tek başına anlatmaz. Snapshot bütün yürütme izi değildir. Sleep gözlemden önce biterse satır görünmeyebilir. Bu komut ve Linux STAT yorumları Ubuntu hedeflidir; macOS çıktısı ile bire bir eşit sayılmamalı.

Pipe komutu:

```sh
printf 'alpha\nbeta\n' | wc -l
```

Beklenen sonuç 2; çevresindeki whitespace değişebilir. `wc -l` newline sayar. Son newline’ı kaldırırsan sonuç 1 olur. Shell builtin nedeniyle iki komut metni iki yeni external process sayısını garanti etmez.

## Doğrulama kaydı

Kaynaklar 7 Ekim 2026 tarihinde yerel **macOS/Darwin arm64** ortamında Clang ile `-std=c11 -Wall -Wextra -Werror -pedantic` kullanılarak derlendi; thread örneğinde ayrıca `-pthread` kullanıldı. Dört başarılı çıktı ve launch’ın eksik executable hata yolu, çıkış kodlarıyla birlikte kontrol edildi ve geçti. Çalıştırmalar 5 saniyelik dış timeout ile sınırlandı. **Ubuntu’da çalıştırıldığı iddia edilmiyor; Linux ps deneyi yerel macOS doğrulamasına dahil edilmedi.** Ubuntu komutları hedef ortamda yapılacak gözlemdir.

## Kaynaklar

- [fork(2): özel adres alanları, inherited descriptors ve COW](https://man7.org/linux/man-pages/man2/fork.2.html)
- [execve(2): program image değişimi](https://man7.org/linux/man-pages/man2/execve.2.html)
- [wait(2): child durumunun toplanması](https://man7.org/linux/man-pages/man2/waitpid.2.html)
- [pthread_join(3): thread’in tamamlanmasını beklemek](https://man7.org/linux/man-pages/man3/pthread_join.3.html)
- [pipe(7): EOF, blocking ve nonblocking akış](https://man7.org/linux/man-pages/man7/pipe.7.html)
