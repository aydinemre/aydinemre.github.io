# Emre Aydın — kişisel blog

https://aydinemre.github.io

Türkçe kişisel notlar ve yüksek lisans çalışmaları. Astro + MDX ile hazırlanır, GitHub Actions üzerinden GitHub Pages'e yayınlanır.

## Geliştirme

Node.js 22.12+ kullanın.

```sh
npm ci
npm run dev
npm run build
```

## İçerik ekleme

- Kişisel notlar: `src/pages/kisisel-notlarim/`
- BİL511: `src/pages/yuksek-lisans/bil511/`
- BİL513: `src/pages/yuksek-lisans/bil513/`
- Ortak tasarım: `src/layouts/Layout.astro`

Yeni yazıları `.mdx` dosyası olarak ekleyebilirsiniz. MDX içinde Astro bileşenlerini ve JavaScript ile hazırlanan etkileşimli görselleri kullanabilirsiniz. Yeni yazının bağlantısını ilgili liste sayfasına ekleyin.

Medium'dan taşınan yazının özgün tarihi, metni ve kaynak bağlantısı korunmuştur. Medium üzerindeki yazı silinmemiştir.

Eski Jekyll sitesi Git geçmişinde ve `backup/pre-personal-blog` dalında korunur. Eski temanın MIT lisansı `LICENSE` dosyasında korunmuştur; yeni blog yazıları için yeniden kullanım izni verilmez.
