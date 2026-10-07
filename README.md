# Emre Aydın — kişisel blog

https://aydinemre.github.io

Türkçe kişisel notlar ve yüksek lisans çalışmaları. Astro + MDX ile hazırlanır, GitHub Actions üzerinden GitHub Pages'e yayınlanır.

## Geliştirme

Node.js 22.12+ kullanın.

```sh
npm ci
npm run dev
npm run build
npm run verify
```

## İçerik ekleme

- Kişisel notlar: `src/pages/kisisel-notlarim/`
- BİL511: `src/pages/master/bil511/`
- BİL513/CSE513: `src/pages/master/bil513/` ve `src/data/cse513/`
- Ortak tasarım: `src/layouts/Layout.astro`

Yeni yazıları `.mdx` dosyası olarak ekleyebilirsiniz. MDX içinde Astro bileşenlerini ve JavaScript ile hazırlanan etkileşimli görselleri kullanabilirsiniz. Yeni yazının bağlantısını ilgili liste sayfasına ekleyin.

Medium'dan taşınan yazının özgün tarihi, metni ve kaynak bağlantısı korunmuştur. Medium üzerindeki yazı silinmemiştir.

Eski Jekyll sitesi Git geçmişinde ve `backup/pre-personal-blog` dalında korunur. Eski temanın MIT lisansı `LICENSE` dosyasında korunmuştur; yeni blog yazıları için yeniden kullanım izni verilmez.

## Yayın güvenliği

Site statik HTML/CSS/JavaScript yayınlar; sunucu, kullanıcı hesabı, çerez veya analitik izleyici içermez. Bütün sayfalar sistem/açık/koyu tema seçimi için küçük bir istemci betiği yükler. Yüksek lisans sayfalarında dil seçimi, derslerde deneyler ve tarayıcıya yerel kişisel notlar için JavaScript çalışır. Etkileşimli anlatımlar ilgili içerik sayfasında çalışır; klavye kullanımı ve azaltılmış hareket tercihi desteklenmelidir.

Mevcut npm audit çıktısı Astro'nun derleme bağımlılığı `http-cache-semantics@4.2.0` için bir cache güvenlik uyarısı içerir; yayımlanan statik sitede bu paket çalışmaz. Bu projede uzak görsel veya kişiselleştirilmiş yanıt cache'i kullanılmaz. Paket için düzeltilmiş sürüm yayınlandığında bağımlılıklar güncellenmelidir.

## Kalite kontrolleri

Her yayında derlenen tüm sayfalarda iç bağlantılar, varlıklar, Türkçe dil tanımı, tek ana başlık, SEO metadata, taşınan yazı ve ders sayfaları doğrulanır. CSE513 takvimindeki bütün 14 hafta ve ilk dersin kalıcı adresi aynı yeni çalışma tasarımını kullanır. HTML/CSS/JS dosyaları için 100 KB üst sınır uygulanır. Kontroller geçmeden yayın yapılmaz.

GitHub Pages aylık 100 GB soft bandwidth sınırına sahiptir. Çok yüksek trafik için kişisel özel alan adı üzerinden CDN ve uygun barındırma planı ayrıca yapılandırılmalıdır. Milyarlarca ziyarete dayanıklılık bu depoda doğrulanmış değildir.

## CSE513 çalışma rotası

1–3. haftalar yayımlanmış PDF’lerin kişisel öğrenme uyarlamasıdır. 4–6. ve 8–10. haftalar, henüz PDF bulunmadığı için yayımlanan resmî kapsam ve birincil kaynaklardan hazırlanmıştır. 7. hafta kişisel tekrar paketidir, resmî sınav kapsamı değildir. 11–14. haftalar aynı ortak makale sunumu rehberini kullanır.

Yayınlanan içerik ve dil verisi `src/data/cse513/` ile `public/study/cse513/data/` içinde tutulur. Görseller, sunumlar ve offline laboratuvar kaynakları `public/study/cse513/` altında bulunur. Ders metni JavaScript kapalıyken Türkçe okunabilir. TR/EN seçimi ve deney durumu tarayıcıda yönetilir. Kişisel notlar yalnız localStorage’da saklanır, sunucuya veya GitHub’a gönderilmez.

18 görsel anlatım gerçek, döngülü GIF dosyalarıyla otomatik oynar. Her GIF’te sağ üstte görselin dönem içindeki sırası ve mevcut kare/toplam kare bilgisi yer alır. Türkçe/İngilizce ve mobil/masaüstü sürümleri `public/study/cse513/animations/` altında, dosya boyutları ve kare sayıları `manifest.json` içindedir. Durdurma başlangıç görseline döner; yeniden oynatma GIF’i baştan başlatır. Azaltılmış hareket tercihi etkinse kullanıcı oynatmayı seçene kadar sabit görsel gösterilir. Metinler ve özgün deneyler her animasyonun altında açılabilir.

## Matrix teması

Bütün site aynı Matrix renkleri, serif başlıklar, monospace etiketler ve statik binary şeridi kullanır. Ortak renkler `public/site/theme.css` içinde, tema başlangıcı `ThemeHead.astro`, kullanıcı seçimi `ThemeControl.astro` ve `public/site/theme.js` ile yönetilir. Varsayılan sistem tercihidir; arayüzden Açık/Koyu/Sistem seçilebilir. Tercih `emre-theme` anahtarında yerel saklanır. JavaScript kapalıyken CSS sistem temasını izler. GIF ve poster dosyalarının açık ve koyu sürümleri vardır.

Yüksek lisans bölümü `/master/` altında yayımlanır. Eski `/yuksek-lisans/` adresleri karşılık gelen yeni sayfaya yönlendirilir; JavaScript açıkken query ve bölüm bağlantıları da korunur. GitHub Pages üzerinde bunlar statik yönlendirme sayfalarıdır.
