export const chapters = [
  {
    "title": "Ders kapsamı ve temel kavramlar",
    "range": [
      1,
      5
    ],
    "type": "overview",
    "intro": "Bu bölüm işletim sisteminin CPU, bellek ve dosyaları nasıl yönettiğini açıklar. Önce program, process ve yürütme akışı (thread) kavramlarını ayıracağız; ardından bunların nasıl çalıştığını inceleyeceğiz.",
    "notes": [
      "Dersler 1–6 ve 8–10. haftalarda iki bölüm halinde; 7. hafta ara sınav, ders yok. 11–14. haftalarda İngilizce, 15 dakikalık makale sunumları var.",
      "Değerlendirme: ara sınav %30, final %40, sunum %15, ödev %15. Final sorularının yarısı sunumlardan. Yaklaşık iki haftada bir Ubuntu odaklı ödev; AI desteğine izin veriliyor, ayrıntılı yönergeler ayrıca açıklanacak.",
      "İlk yarı: OS hizmetleri, koruma, program, process, durum ve context. İkinci yarı: process oluşturma, thread ve iletişim."
    ],
    "steps": [
      [
        "Program",
        "Çalıştırılacak kod ve veri. Henüz bu örneğin yürütme durumu yok."
      ],
      [
        "Process",
        "Programın çalışan örneği; PID, adres alanı ve kaynakları var."
      ],
      [
        "Kernel",
        "CPU, bellek ve dosya erişimini yöneten işletim sistemi kodu."
      ],
      [
        "Thread",
        "Process içindeki yürütme akışı; PC, register ve stack ile izlenir."
      ],
      [
        "İletişim",
        "Ayrı process’ler örneğin pipe kullanarak veri aktarabilir."
      ]
    ],
    "extra": [
      "Terminale bir komut yazınca shell komutun nasıl çalıştırılacağını belirler. Harici bir program için tipik yol child process oluşturmak, programı yüklemek ve gerektiğinde sonlanmasını beklemektir. cd gibi bazı komutlar shell’in içinde çalışır; her komut mutlaka yeni process oluşturmaz.",
      "Bu notlardaki PID değerleri ve bellek yerleşimleri örnektir. Amaç gerçek makinedeki numaraları tahmin etmek değil, hangi bilginin ne zaman değiştiğini izlemektir."
    ],
    "study": {
      "question": "Terminalde cd yazınca neden shell’in kendi çalışma dizini değişmelidir?",
      "answer": "Child process yalnızca kendi çalışma dizinini değiştirse parent process shell’in dizini değişmez. Bu nedenle cd normalde shell içinde yürütülür.",
      "misconception": "Her komut yeni process oluşturur."
    }
  },
  {
    "title": "User mode, kernel mode ve sistem çağrıları",
    "range": [
      6,
      9
    ],
    "type": "kernel",
    "intro": "Normal uygulama kodu user mode’da çalışır. Dosya okuma gibi ayrıcalıklı bir işlem gerektiğinde sistem çağrısı yapar; CPU kernel mode’a geçer ve işletim sistemi isteği işler. Bu geçişte process kimliği değişmek zorunda değildir.",
    "notes": [
      "Process yürütme bağlamı, sanal bellek adres alanı, dosya ve socket veri/iletişim arayüzü sağlar. Shell user-space programıdır; kütüphaneler kernel’e girmeden iş yapabilir.",
      "Üç giriş nedeni: system call, exception (ör. page fault), device interrupt (ör. I/O tamamlanması). Interrupt her zaman process değiştirmez.",
      "Root kullanıcı kimliği ile CPU kernel mode’u farklı şeylerdir. Fonksiyon çağrısı mutlaka system call değildir; printf tamponlama sayesinde birden fazla çağrıyı tek write’a dönüştürebilir. Tracer’da görülen işlem adı API adıyla aynı olmayabilir."
    ],
    "steps": [
      [
        "P · user",
        "Kütüphane hesabı: kernel girişi yok"
      ],
      [
        "P · user",
        "P system call yapar"
      ],
      [
        "P · kernel",
        "Kernel isteği kontrol eder"
      ],
      [
        "P · kernel",
        "Hizmet hemen tamamlanır"
      ],
      [
        "P · user",
        "Aynı P geri döner; context switch gerekmez"
      ]
    ],
    "extra": [
      "Örnek: strlen bir metnin uzunluğunu uygulamanın belleğinde hesaplayabilir; dosyadan read ile veri almak ise işletim sistemi hizmeti ister. “Fonksiyon çağrısı” ve “sistem çağrısı” aynı kavram değildir.",
      "Sistem çağrısının iki ayrı sonucunu düşün: CPU yetki modu değişebilir; ayrıca istek beklemeye yol açarsa başka görev seçilebilir. İkinci sonuç birincisinin zorunlu devamı değildir."
    ],
    "study": {
      "question": "Bir process read çağırdı, veri hazırdı ve çağrı tamamlandı. Başka process mutlaka çalışmış mıdır?",
      "answer": "Hayır. Kernel hizmeti yerine getirip aynı process’i user mode’da sürdürebilir. Yetki modu geçişi ile context switch farklı olaylardır.",
      "misconception": "Kernel’e girince PID değişir."
    }
  },
  {
    "title": "Program, process ve adres alanı",
    "range": [
      10,
      15
    ],
    "type": "memory",
    "intro": "Program, çalıştırılacak kod ve veridir. Process, bu programın çalışan örneğidir: kendi kimliği, yürütme durumu ve sanal adres alanı vardır. Aynı programın iki process’i, sıradan değişkenlerini birbirinden bağımsız değiştirebilir.",
    "notes": [
      "Bir editör input beklerken diğeri dosya kaydedebilir. Salt okunur kodun fiziksel sayfaları paylaşılabilir; bu, sıradan yazılabilir değişkenleri ortak yapmaz. Birinin çökmesi normalde diğerini sonlandırmaz; ortak harici dosya/hizmet bağımlılıkları yine olabilir.",
      "Sanal adres alanı kavramsal olarak code, static data, heap ve stack içerir. Register ve program counter bellek bölgesi değil yürütme durumudur. Gerçek yerleşim; mappings, libraries ve guard regions içerir, büyüme yönleri evrensel değildir.",
      "Local değişkenin ömrü scope’a, dinamik nesneninki serbest bırakmaya ve dil kurallarına bağlıdır. Pointer adres değeridir; sahiplik, izin ya da nesne ömrünü uzatma garantisi vermez. Başka process’e pointer kopyalamak shared memory oluşturmaz.",
      "PCB; PID, ilişkiler, durum, scheduling, register/PC ve bellek/dosya referanslarını özetler. Context switch tüm belleği PCB’ye kopyalamaz. Gerçek kernel kayıtları bölünmüş olabilir; thread context’i ve process kaynakları ayrılmalıdır."
    ],
    "steps": [
      [
        "Program",
        "editor executable"
      ],
      [
        "P · PID 101",
        "code · data · heap · stack"
      ],
      [
        "Q · PID 202",
        "Aynı kod, ayrı yazılabilir alan"
      ],
      [
        "P: x = 20",
        "Q: x = 10 olarak kalır"
      ],
      [
        "PCB",
        "PC + register + kaynak referansları; bellek fotoğrafı değil"
      ]
    ],
    "extra": [
      "Sanal adres, bir process’in belleğe erişirken kullandığı adrestir. İki process’te aynı sayısal adres bulunması aynı fiziksel hücreye eriştiklerini kanıtlamaz; adres çevrimi process’in eşlemelerine bağlıdır.",
      "Bellek ile açık dosya aynı paylaşım kuralına sahip değildir. fork sonrasında sıradan yazılabilir değişkenler ayrıdır; miras alınan dosya tanımlayıcıları ise aynı açık dosya kaydına, dolayısıyla ortak dosya konumuna başvurabilir."
    ],
    "study": {
      "question": "P ve Q aynı sanal adresi yazdırıyor. P o adresteki sıradan değişkeni değiştirince Q da değişir mi?",
      "answer": "Adres değerlerinin eşitliği ortak fiziksel bellek kanıtı değildir. Ayrı adres alanlarında sıradan yazılabilir değişkenler bağımsızdır; bilinçli shared mapping ayrı bir durumdur.",
      "misconception": "Aynı pointer değeri aynı nesne demektir."
    }
  },
  {
    "title": "Running, ready ve waiting durumları",
    "range": [
      16,
      21
    ],
    "type": "states",
    "intro": "Running: CPU şu anda bu görevin talimatlarını yürütüyor. Ready: görev çalışabilir, fakat CPU sırasını bekliyor. Waiting: devam etmek için disk verisi veya ağ yanıtı gibi bir olayın gerçekleşmesi gerekiyor.",
    "notes": [
      "Running: CPU’da yürütülüyor. Ready: çalışabilir, seçilmeyi bekliyor. Waiting: olay/kaynak eksik. I/O tamamlanması waiting → ready yapar; anında running garantisi vermez. Gerçek sistemler daha fazla durum kullanabilir ve thread/task schedule edebilir.",
      "Tek CPU örneği: A disk beklemeye geçince B seçilir. A’nın I/O’su B çalışırken biterse A ready olur; B devam edebilir. B klavye beklerse A seçilebilir. Çalışabilirlik ve CPU sahipliği ayrı izlenir.",
      "Ready queue CPU rekabetini; wait queue olay/kaynak bağımlılığını temsil eder. CPU bursts ve I/O waits sırayla gelir. CPU-bound / I/O-bound, iş yüküne ve sisteme göre değişen niteliklerdir.",
      "Multiprogramming, bir iş beklerken diğer ready işe CPU verir; harici olayın kendisini hızlandırmaz. Scheduling politikaları ve mekanik/otomobil benzetmesi sonraki haftada işlenecek."
    ],
    "steps": [
      [
        "Ready",
        "P seçilmeyi bekliyor"
      ],
      [
        "Running",
        "Scheduler P’yi seçti"
      ],
      [
        "Waiting",
        "P gelmemiş input istedi"
      ],
      [
        "Ready",
        "Input geldi; CPU henüz verilmedi"
      ],
      [
        "Running → Ready",
        "P tekrar seçildi; time slice bitince ready olur"
      ]
    ],
    "extra": [
      "Ready ile waiting’i ayırmak için şunu sor: “Şimdi CPU verilse devam edebilir mi?” Evetse ready; diskten gereken veri henüz gelmediyse waiting. CPU’nun boş olması eksik veriyi oluşturmaz.",
      "I/O tamamlandığında görev çalışabilir hâle gelir. CPU’nun hemen ona verilmesi başka bir karardır; scheduler (zamanlayıcı) o sırada çalışan görevi sürdürmeyi seçebilir."
    ],
    "study": {
      "question": "A ağ yanıtını bekliyor, CPU boş. A neden çalıştırılamıyor?",
      "answer": "A’nın devam etmesi için yanıt gerekli. CPU tahsis etmek yanıtı üretmez. Yanıt geldiğinde A ready olur; running olması için ayrıca seçilmelidir.",
      "misconception": "Waiting sadece uzun bir CPU kuyruğudur."
    }
  },
  {
    "title": "Context switch: yürütme durumunu değiştirme",
    "range": [
      22,
      27
    ],
    "type": "context",
    "intro": "CPU P’den Q’ya geçirilecekse işletim sistemi P’nin kaldığı talimatı ve register değerlerini saklar, Q’nunkileri yükler. Buna context switch denir. Yalnızca kernel mode’a geçmek ise başka bir görevin çalıştırıldığı anlamına gelmez.",
    "notes": [
      "PC ve register’lar kaydedilir; farklı adres alanında ilgili mappings seçilir. Tüm bellek kopyalanmaz ve her cache zorunlu olarak temizlenmez; mimari/kernel ayrıntıları değişir.",
      "Save/restore doğrudan maliyet; cache ve translation etkileri dolaylı maliyettir. Scheduling, tepki süresi ve adaleti çok sık geçiş maliyetiyle dengeler.",
      "A: hemen biten hizmet → P geri dönebilir. B: bloklayan hizmet → Q seçilebilir. C: timer interrupt → scheduler P’yi tutabilir veya Q’yu seçebilir.",
      "Kontrol soruları: ağ yanıtı bekleyen işe boş CPU yetmez; hemen tamamlanan read görev değişimini zorunlu kılmaz; benzer bitiş zamanı paralellik kanıtı değildir."
    ],
    "steps": [
      [
        "P · CPU",
        "PC=24, R=7"
      ],
      [
        "P · kayıt",
        "P context’i saklanır"
      ],
      [
        "Q · yükle",
        "Q’nun PC ve register’ları geri yüklenir"
      ],
      [
        "Q · CPU",
        "Q kaldığı yerden devam eder"
      ],
      [
        "Maliyet",
        "Save/restore + cache/translation etkileri"
      ]
    ],
    "extra": [
      "Program counter (PC), yürütmenin hangi talimatta olduğunu gösterir. Register’lar CPU’nun işlem sırasında kullandığı küçük saklama alanlarıdır. Bunlar geri yüklenince görev kaldığı yerden sürdürülebilir.",
      "Aynı process’in iki thread’i arasında da context switch olabilir. Yürütme durumu değişir; ortak adres alanının başka bir process alanına çevrilmesi gerekmez."
    ],
    "study": {
      "question": "P’den aynı process’in başka thread’ine geçerken yürütme durumu saklanmalı mı?",
      "answer": "Evet. Thread’lerin PC ve register değerleri ayrıdır. Ortak adres alanı, yürütme durumlarının da aynı olduğu anlamına gelmez.",
      "misconception": "Ortak bellek varsa context switch gerekmez."
    }
  },
  {
    "title": "fork, exec ve wait: process oluşturma",
    "range": [
      28,
      37
    ],
    "type": "fork",
    "intro": "fork yeni bir child process oluşturur. exec, çağıran process’in programını değiştirir; yeni process oluşturmaz. wait veya waitpid, child process’in sonlanmasını bekleyebilir ve sonlanma bilgisini toplar.",
    "notes": [
      "Process tree parent process/child process ilişkisidir; CPU sahipliği, iletişim veya bitiş sırası değildir. PID’ler örnektir, ortamına göre değişir.",
      "Başarılı fork: parent pozitif child PID alır; child 0 alır. Başarısız fork −1 döndürür ve child process yaratılmaz. Hangisinin önce çalışacağı garanti değildir; sıra gerekiyorsa synchronization kur.",
      "Copy-on-write: ayrı mantıksal yazılabilir alanlar başlangıçta aynı fiziksel sayfaya eşlenebilir. Yazma gerektiğinde private copy oluşturulur. Child değişikliği parent’ın sıradan değişkenini değiştirmez.",
      "exec code/data/stack’i değiştirir, PID’yi korur. Başarıda eski programa dönmez; hata durumunda döner. File descriptors genellikle close-on-exec değilse kalır; shell pipe bağlantısını önce kurabilir, yanlış inheritance bug yaratabilir.",
      "Başarılı örnekte /bin/echo önce “child” yazar; waitpid sonrasında parent exit status 0 yazar. Tam kod fork hatası, EINTR retry ve WIFEXITED/WEXITSTATUS kontrolü içerir.",
      "Olmayan executable: exec hata verir, child _exit(127) yapar, parent başarılı wait ile 127 toplar. 127 bu örneğin convention’ıdır. _exit, bu tek thread örneğinde miras alınan stdio tamponunun tekrar flush edilmesini önler."
    ],
    "steps": [
      [
        "Parent PID 100",
        "x=10 · program=shell"
      ],
      [
        "fork",
        "Parent return=101 · Child return=0"
      ],
      [
        "Child PID 101",
        "x=20; parent x=10"
      ],
      [
        "exec /bin/echo",
        "Child PID 101 aynı; program yeni"
      ],
      [
        "waitpid(101)",
        "child → parent: child exit status = 0"
      ]
    ],
    "extra": [
      "fork bir kez çağrılır, başarılıysa iki process’te döner. Parent processdeki pozitif sonuç child process’in PID’sidir; child process’teki sonuç 0’dır. Kod bu dönüş değerine bakarak parent process ve child process işlerini ayırır.",
      "Örnekte child process x=20 yazar, sonra exec ile echo programına dönüşür. Parent process’in x değeri 10 kalır. waitpid child process’in bitişini bekler; child process’in değişkenini parent process’e kopyalamaz."
    ],
    "study": {
      "question": "fork öncesi x=10. Child process x=20 yapıyor. Parent process waitpid sonrası x’i okuyor: sonuç?",
      "answer": "10. Child process kendi adres alanını değiştirdi. waitpid sonlanmayı bekler ve status toplar; değişkenleri birleştirmez.",
      "misconception": "wait child process’in belleğini parent process’e aktarır."
    }
  },
  {
    "title": "Process sonlanması, zombie ve waitpid",
    "range": [
      38,
      41
    ],
    "type": "zombie",
    "intro": "Bir process sonlandığında artık talimat yürütmez. Olağan wait düzeninde parent process sonlanma bilgisini toplayana kadar kernel’de küçük bir kayıt kalır; bu duruma zombie denir. Zombie, hâlâ çalışan bir program değildir.",
    "notes": [
      "Parent child process çalışırken başka iş yapabilir. waitpid, belirli child bitene kadar bloklayabilir. Background çalışma, status collection sorumluluğunu ortadan kaldırmaz.",
      "Parent’ın önce sonlanması zombie’den farklıdır. Unix-like sistemler reparenting ve eventual reaping düzenler; sorumlu process ortama bağlıdır.",
      "Ubuntu deneyi: sleep 20 &; demo_pid=$!; ps -o pid,ppid,stat,comm -p \"$demo_pid\"; wait \"$demo_pid\". Gerçek makinede çalıştır ve gözlemlediğin çıktıyı kaydet.",
      "PID kimlik, PPID parent, STAT durum/flags, COMM komut adıdır. Linux R hem running hem runnable olabilir. Sleeping tek başına eksik olayı açıklamaz. Snapshot tüm trace değildir; sleep bitmişse kayıp satır launch hatası kanıtı değildir."
    ],
    "steps": [
      [
        "Child çalışıyor",
        "Parent başka iş yapabilir"
      ],
      [
        "Child sonlandı",
        "Program artık yürütülmüyor"
      ],
      [
        "Zombie",
        "Yalnız kimlik + exit status kaydı kaldı"
      ],
      [
        "Parent waitpid",
        "Exit status toplandı"
      ],
      [
        "Reaped",
        "Kernel kaydı temizlendi"
      ]
    ],
    "extra": [
      "Zombie ile orphan farklıdır: zombie sonlanmış fakat bilgisi henüz toplanmamış processtir; orphan, parent processi önce sonlanan processtir. Yetim process çalışmayı sürdürebilir ve sistem tarafından başka bir parent process’e bağlanır."
    ],
    "study": {
      "question": "Child process exit yaptı ama parent process henüz waitpid çağırmadı. Child process CPU tüketmeye devam eder mi?",
      "answer": "Hayır. Olağan zombie durumunda program yürütülmez; parent process’in toplayacağı sonlanma kaydı kalır. Zombie ile canlı fakat parent processi sonlanmış orphan farklıdır.",
      "misconception": "Zombie arka planda çalışan bir programdır."
    }
  },
  {
    "title": "Thread, ortak bellek ve paralellik",
    "range": [
      42,
      46
    ],
    "type": "threads",
    "intro": "Thread, bir process’in içindeki yürütme akışıdır. Aynı process’in thread’leri ortak adres alanına erişir; her thread’in kendi talimat konumu, register değerleri ve stack’i vardır. Aynı anda çalışmaları ise birden fazla CPU çekirdeği gerektirir.",
    "notes": [
      "Process sınırı ayrı sanal adres alanıdır; iletişim explicit mechanism gerektirir. Thread’ler code/data/heap ve açık dosyaları paylaşabilir; pointer ile diğer thread’in canlı stack nesnesine erişebilir.",
      "Hatalı thread ortak belleği bozabilir. Kolay iletişim synchronization ve nesne ömrü sorumluluğu getirir.",
      "Concurrency: örtüşen zaman aralığında ilerleme. Tek core sırayla T1/T2/T3 çalıştırabilir. Parallelism: farklı core’larda aynı anda yürütme. Tek core, çok adımlı işlemi atomic yapmaz.",
      "Daha fazla thread her zaman hız değildir: serial stage, lock contention, memory bandwidth ve storage darboğazları; oluşturma, memory, scheduling ve coordination maliyetleri vardır. Diyagram benchmark değildir; performans iddiası ölçüm gerektirir."
    ],
    "steps": [
      [
        "Tek process",
        "Ortak code · data · heap · files"
      ],
      [
        "T1",
        "Kendi PC · register · stack"
      ],
      [
        "T2",
        "Kendi context’i; aynı adres alanı"
      ],
      [
        "1 core",
        "T1 → T2 → T1: concurrency"
      ],
      [
        "2 core",
        "T1 ve T2 aynı anda: parallelism mümkün"
      ]
    ],
    "extra": [
      "Concurrency, birden fazla işin aynı zaman aralığında ilerlemesidir; tek çekirdekte sırayla çalışarak da sağlanır. Parallelism, işlerin aynı anda yürütülmesidir. Örneğin iki çekirdek iki thread’i aynı anda çalıştırabilir.",
      "Bir thread’in stack’i ayrı olması diğer thread’lerden bellek korumasıyla yalıtıldığı anlamına gelmez. Geçerli bir pointer varsa başka thread’in canlı stack nesnesine erişilebilir; nesnenin ömrü ve eşzamanlı erişim ayrıca yönetilmelidir."
    ],
    "study": {
      "question": "Tek çekirdekte iki thread’in işleri örtüşebilir mi? Aynı anda talimat yürütürler mi?",
      "answer": "İlerlemeleri sırayla sağlanarak zaman aralıkları örtüşebilir: concurrency. Bu tek çekirdek örneğinde aynı anda iki yürütme yoktur. Parallelism için uygun birden fazla yürütme kaynağı gerekir.",
      "misconception": "Concurrency ve parallelism aynı şeydir."
    }
  },
  {
    "title": "Worker pool ve iş kuyruğu",
    "range": [
      47,
      48
    ],
    "type": "pool",
    "intro": "Worker pool, işleri sınırlı sayıda çalışan thread’e dağıtır. Gelen istek önce kuyruğa alınır; boş bir worker işi alıp tamamlar. Kuyruk dolduğunda yeni isteklerin beklemesi veya reddedilmesi gibi bir kural gerekir.",
    "notes": [
      "Shared cache ve queues coordination ister. Bounded pool hem worker sayısını hem kuyruğun kurallarını görünür kılar.",
      "Kimin hangi isteğe sahip olduğu, kuyruğu kimin değiştireceği, dolunca ne olacağı ve shutdown’da waiting worker’ların nasıl uyanacağı belirlenmelidir.",
      "Thread tek seçenek değildir: event-driven tasarımlar da beklemeleri örtüştürebilir. Model iş yüküne göre seçilir."
    ],
    "steps": [
      [
        "İstek R1",
        "Acceptor işi alır"
      ],
      [
        "Kuyruk",
        "Sınırlı kapasite: R1, R2"
      ],
      [
        "Worker 1",
        "R1’in sahipliğini alır"
      ],
      [
        "Worker 2",
        "R2’yi bağımsız işler"
      ],
      [
        "Shutdown",
        "Bekleyenleri uyandır; kaynakları bırak"
      ]
    ],
    "extra": [
      "Kuyruğa iş eklemek ve kuyruktan iş almak ortak veriyi değiştirir. Bu işlemler korunmalı; kuyruk boşsa worker gereksiz bir döngüyle sürekli kontrol etmek yerine uygun bir bekleme mekanizması kullanmalıdır.",
      "Kapanışta önce yeni iş kabulünün ne zaman duracağı belirlenir. Bekleyen işler tamamlanacak mı, iptal mi edilecek? Bekleyen worker’lar nasıl uyandırılacak? Bu kararlar kaynakların güvenli bırakılmasını sağlar."
    ],
    "study": {
      "question": "İki worker var, kuyruk kapasitesi üç, hepsi dolu. Yeni istek için hangi karar eksik?",
      "answer": "Kuyruk doluyken kabul politikasını belirlemek gerekir: bekletmek, reddetmek veya başka sınırlı düzen kullanmak. Sınırsız kuyruk birikmesi bellek ve gecikme sorununu büyütebilir.",
      "misconception": "Worker sayısını sınırlamak kuyruk büyüklüğünü de kendiliğinden sınırlar."
    }
  },
  {
    "title": "Race condition ve kayıp güncelleme",
    "range": [
      49,
      52
    ],
    "type": "race",
    "intro": "İki thread aynı değişkeni korumasız değiştirirse sonuç işlemlerin sırasına bağlı olabilir. counter++ ifadesini okuma, artırma ve yazma olarak düşün: ikisi de eski değeri okursa bir artış kaybolabilir.",
    "notes": [
      "A ve B 0 okur; ikisi de 1 hesaplar ve 1 yazar. İki increment’ın beklenen sonucu 2 iken örnek trace 1 verir. Tam işlemi lock ile koru veya uygun atomic kullan.",
      "Bu kavramsal trace’tir. C’de unsynchronized conflicting accesses undefined behavior olabilir; gerçek racy C programından kesin “1” sonucu bekleme.",
      "pthread_join örneği: main input=7 başlatır, worker result=49 yazar, main join sonrası okur. Nesne worker tamamlanana kadar canlıdır.",
      "join sıralama sağlar; diğer worker’ların eşzamanlı erişimini karşılıklı dışlamaz. Çoklu güncelleme için ayrıca coordination gerekebilir."
    ],
    "steps": [
      [
        "counter = 0",
        "Başlangıç"
      ],
      [
        "A read(0)",
        "A temporary=0"
      ],
      [
        "B read(0)",
        "B temporary=0"
      ],
      [
        "A write(1)",
        "counter=1"
      ],
      [
        "B write(1)",
        "counter=1 · güncelleme kayboldu"
      ]
    ],
    "extra": [
      "Mutex ile tüm okuma–artırma–yazma işlemini korursan ikinci thread ilk artışın sonucunu okur. Uygun atomic artırma da tek counter için çözüm olabilir; birden çok değişken arasındaki tutarlılık ayrıca düşünülmelidir.",
      "join bir thread’in tamamlanmasını bekler. İki worker aynı anda ortak counter’ı değiştirmeye devam ediyorsa sonradan ikisini join etmek önceki yarışmayı önlemez."
    ],
    "study": {
      "question": "İki worker counter artırdı, main ikisini join etti. Sonucun doğru olması garanti mi?",
      "answer": "Hayır. join tamamlanmayı sıralar; worker’ların önceki korumasız ortak erişimini düzeltmez. Artırma işlemi uygun mutex veya atomic ile korunmalıdır.",
      "misconception": "Sonradan join etmek race condition’ı giderir."
    }
  },
  {
    "title": "Process’ler arası iletişim ve pipe",
    "range": [
      53,
      56
    ],
    "type": "pipe",
    "intro": "Ayrı process’ler veri paylaşmak için bir iletişim mekanizması kullanır. Shared memory’de aynı bellek alanına erişirler; pipe’ta biri byte yazar, diğeri okur. Pipe bir mesaj listesi değil, sıralı byte akışıdır.",
    "notes": [
      "Shared memory layout, ownership ve readiness kuralları ister; ortak flag tek başına synchronization sağlamaz. Message passing de error handling, order ve framing ister. Gönderen durursa alıcının ne yapacağı belirlenmeli.",
      "printf 'alpha\\nbeta\\n' | wc -l: üretici iki newline içeren byte stream gönderir, tüketici sayar: 2. Sonuç scheduling sırasından değil girdiden çıkar; whitespace gösterimi değişebilir.",
      "Shell bağlantıyı düzenler. printf builtin olabilir; komut metni process sayısını kanıtlamaz. Pipe mesaj sınırlarını korumaz; read parçaları write parçalarından farklı olabilir. Delimiter veya length field gibi framing tanımla."
    ],
    "steps": [
      [
        "printf",
        "alpha\\nbeta\\n"
      ],
      [
        "Pipe buffer",
        "a l p h a \\n b e t a \\n"
      ],
      [
        "wc -l",
        "Bytes farklı büyüklükte parçalarla okunabilir"
      ],
      [
        "Newline sayacı",
        "İlk \\n → 1; ikinci \\n → 2"
      ],
      [
        "Çıktı",
        "2"
      ]
    ],
    "extra": [
      "printf iki satır yazar; wc -l newline karakterlerini sayar. Sonuç 2’dir. Okumanın bir seferde mi, birkaç parçada mı yapıldığı bu sayıyı değiştirmez.",
      "Bir write çağrısının verisi tek read ile alınmak zorunda değildir. “Bir mesaj nerede bitti?” sorusunu pipe cevaplamaz; uygulama ayırıcı veya uzunluk bilgisi gibi bir biçim tanımlamalıdır."
    ],
    "study": {
      "question": "Üretici 11 byte’ı bir write ile gönderdi. Tüketicinin bir read ile 11 byte alması garanti mi?",
      "answer": "Hayır. Pipe byte akışıdır; okuma uzunluğu ve koşulları veriyi farklı parçalara ayırabilir. Tüketici gerektiğinde birden çok okuma yapmalı ve uygulama biçimini kendisi çözmelidir.",
      "misconception": "Bir write bir mesajdır ve tek read ile gelir."
    }
  },
  {
    "title": "Pipe: bekleme, backpressure ve EOF",
    "range": [
      57,
      62
    ],
    "type": "eof",
    "intro": "Boş pipe tek başına verinin bittiği anlamına gelmez. Bir yazma ucu hâlâ açıksa blocking read veri bekleyebilir. Bütün yazma uçları kapanmış ve kalan veri tüketilmişse read sıfır döndürür: EOF.",
    "notes": [
      "Backpressure: üretici tüketiciden hızlıysa sınırlı buffer dolar. Writer space bekler; CPU-ready olmakla aynı değildir. Tüketici hızlıysa buffer boşalır ve writer varken data bekler.",
      "Kullanılmayan uçları her process’te kapat. Child yazmayı bitirse bile parent yanlışlıkla write-end açık tuttuysa EOF gelemez.",
      "Komutun tüm ömrü: shell child ve bağlantıları hazırlar; exec görüntüyü değiştirir; computation/kernel/waits arasında ilerler; scheduler diğer işleri seçebilir; termination status’u parent toplar.",
      "Çalışılmış soru: fork öncesi x=10, child kendi x’ini 20 yapar, parent wait sonrası 10 görür. wait adres alanlarını birleştirmez.",
      "Her adımda PID, program image, açık uçlar, ready/waiting ve eksik olay; kernel entry ve task switch ayrı izlenmelidir. Doğru byte’ları hesaplamak, EOF ve status temizliği olmadan bitiş garantisi değildir."
    ],
    "steps": [
      [
        "Boş buffer · writer açık",
        "Reader data bekler"
      ],
      [
        "Buffer dolu",
        "Writer space bekler: backpressure"
      ],
      [
        "Child write-end kapalı",
        "Parent yanlışlıkla kendi write-end’ini açık tuttu"
      ],
      [
        "Hâlâ EOF yok",
        "Buffer boş ama writer referansı var"
      ],
      [
        "Tüm write-end’ler kapalı",
        "Buffer tüketildikten sonra read → EOF"
      ]
    ],
    "extra": [
      "EOF bir byte veya özel karakter değildir; read’in 0 döndürmesiyle bildirilen bitiş durumudur. Boş akışta writer açıkken bekleme, writer kalmadığında EOF oluşur. Burada blocking, sıfırdan büyük uzunluk isteyen okuma anlatılıyor.",
      "fork, dosya tanımlayıcılarını miras bırakabilir. Child process kendi yazma ucunu kapatsa bile parent process aynı pipe’ın bir yazma ucunu açık tutuyorsa okuyucu EOF alamaz. Kullanılmayan uçlar her process’te kapatılmalıdır."
    ],
    "study": {
      "question": "Pipe boş, child process yazmayı bitirdi, parent process yazma ucunu açık tuttu. Reader ne görür?",
      "answer": "Blocking reader veri bekleyebilir; EOF için tüm yazma ucu referansları kapanmalı ve buffer tüketilmiş olmalıdır. Child process’in bitmesi tek başına bu koşulu sağlamaz.",
      "misconception": "Boş buffer her zaman EOF demektir."
    }
  },
  {
    "title": "Tekrar soruları ve uygulama",
    "range": [
      63,
      65
    ],
    "type": "review",
    "intro": "Bir örneği açıklarken şu bilgileri ayrı takip et: process kimliği, çalışan program, görev durumu, CPU sahibi, paylaşılan kaynaklar ve bitiş koşulu. Aşağıdaki sorular bunları birbirine karıştırıp karıştırmadığını kontrol eder.",
    "notes": [
      "Kısa background process gözlemle; launch ve thread örneklerini derleyip çalıştır; önce sonucu tahmin et, farkları açıkla. CPU sharing/waiting hakkında bir soru hazırla. Bunlar practice; burada graded deadline yok.",
      "Ayırt et: program/process, process/thread, ready/running/waiting, kernel entry/task switch, fork/exec/wait, concurrency/parallelism, shared memory/pipe.",
      "Kaynaklar: Operating System Concepts 10e, seçilmiş Chapters 1–4; özgün çizimler Silberschatz, Galvin & Gagne. Linux man-pages: fork(2), execve(2), waitpid(2), pipe(7). İsteğe bağlı OSTEP: processes, process API, threads. Eşlik eden reading’de bağlantılar, açıklamalar ve çalışılmış cevaplar var."
    ],
    "steps": [
      [
        "Kimlik",
        "PID ve program image"
      ],
      [
        "Durum",
        "Ready mi, waiting mi?"
      ],
      [
        "Yürütme",
        "CPU sahibi ve privilege mode"
      ],
      [
        "Paylaşım",
        "Memory, descriptor ve ownership"
      ],
      [
        "Tamamlanma",
        "EOF + join/wait + resource cleanup"
      ]
    ],
    "extra": [
      "Kontrol örneği: A disk bekliyor, B çalışıyor. Disk tamamlandı. A’nın durumu ready; CPU sahibi hâlâ B olabilir. “Veri geldi” ile “A çalışmaya başladı” ayrı olaylardır.",
      "Kontrol örneği: child process bitti, pipe boş, parent processde yazma ucu açık. Child process’in bitmesi doğru olsa da pipe okuyucusu EOF göremeyebilir. Process sonlanması ile iletişim kanalının bitişini ayrı kontrol et."
    ],
    "study": {
      "question": "Bir örneği çözerken hangi bilgileri ayrı yazmalısın?",
      "answer": "Her process için PID, program, durum ve adres alanı; ayrıca CPU sahibi, açık pipe uçları ve sonlanma bilgisini kimin topladığı. Bir bilginin değişmesinden diğerlerinin de değiştiğini çıkarma.",
      "misconception": "Tek bir “çalışıyor/bitti” etiketi bütün durumu açıklar."
    }
  }
];
