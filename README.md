# Minesweeper Mine Highlighter

Minesweeper.Online için tarayıcı konsolunda çalışan bir mayın analiz aracı. Tahtadaki sayılardan **matematiksel olarak kesinleşen mayınları kırmızı**, kesin mayın kalmadığında **en düşük riskli kareyi sarı** (yüzdesiyle) işaretler.

> **English summary:** A browser-console script for Minesweeper.Online that reads the board from the DOM, finds every cell that is provably a mine (red), and when no certain move exists, highlights the lowest-risk guess with its mine probability (yellow). It does not read hidden mine positions. For educational use in practice mode only.

---

## ⚠️ Sorumluluk Reddi

- Bu proje **eğitim amaçlıdır**: Minesweeper mantığını ve olasılık hesabını göstermek için yazılmıştır.
- Sadece **giriş yapmadan, pratik modda** kendi eğlencen için kullan.
- **Sıralamalı, arena, şampiyona ve çok oyunculu modlarda KULLANMA.** Bu modlarda yardımcı araç kullanmak sitenin kurallarına aykırıdır, rakiplere karşı haksız avantaj sağlar ve hesabın banlanmasına yol açabilir.
- Sorumluluk tamamen kullanıcıya aittir. Proje, Minesweeper.Online ile bağlantılı değildir.

---

## Özellikler

- 🟥 **Kırmızı:** Sayılardan ve toplam mayın sayısından %100 kesinleşen mayınlar.
- 🟨 **Sarı:** Kesin mayın kalmadığında en güvenli kareler. Üzerinde mayın olma yüzdesi yazar. `0%` yazıyorsa o kare kesin güvenlidir.
- Beginner (9x9, 10 mayın), Intermediate (16x16, 40 mayın) ve Expert (30x16, 99 mayın) modlarını otomatik tanır.
- Tahta değiştikçe (her açılan karede) otomatik güncellenir. Yeni oyunda tekrar yapıştırman gerekmez.
- Oyun bitince (mayına basılınca veya kazanınca) işaretleri temizler.

## Nasıl Çalışır?

Araç tahtayı sayfanın DOM'undan okur (`cell_x_y` elemanlarının sınıfları) ve üç aşamada çözer:

1. **Hızlı mantık:** Her sayı için kalan kapalı komşu sayısına göre kesin mayın/güvenli kare bulur. Bir kısıt diğerinin alt kümesi ise farkı çıkararak yeni kesinlikler üretir.
2. **Tam sayım (backtracking):** Birbirine bağlı kapalı kare bölgeleri için tüm geçerli mayın dizilimlerini sayar. Her karede mayın olma sayısına bakar.
3. **Küresel mayın sayısı:** Toplam mayın sayısını (10 / 40 / 99) hesaba katarak dizilimleri ağırlıklandırır. Böylece sadece sayılara bakınca belirsiz kalan bazı kareler kesinleşir ve olasılıklar daha doğru çıkar. Sınır dışındaki kapalı kareler için kalan mayınların ortalama yoğunluğu kullanılır.

## Kurulum ve Kullanım

1. [minesweeper.online](https://minesweeper.online) adresini aç ve **giriş yapmadan** pratik modda bir oyun başlat.
2. Tahtada bir kare aç. İlk tıklama her zaman güvenlidir, açmadan kırmızı kare çıkmaz.
3. `F12` ile geliştirici araçlarını aç ve **Konsol** sekmesine geç.
4. `minesweeper-highlighter.js` dosyasının içeriğini konsola yapıştırıp `Enter`'a bas.
5. Konsolda `Aktif. Durdurmak için hileDurdur()` yazısını görmelisin.

Durdurmak için konsola şunu yaz:

```js
hileDurdur()
```

> Chrome yapıştırma konusunda uyarı verirse konsola önce `allow pasting` yazıp Enter'a basman gerekebilir.

## Sınırlamalar

- **Mayınların gerçek konumlarını okumaz.** Konumlar sunucuda tutulur ve tarayıcıya gelmez. Araç yalnızca ekrandaki bilgiden çıkarım yapar.
- **50/50 ve benzeri durumlarda** kesin bilgi yoktur. Bu yüzden tahmin yapmak zorunda kalabilirsin. Sarı kareler yalnızca olasılığı gösterir, garanti vermez (%10 riskli karede de 10'da 1 ihtimalle mayın çıkar).
- Çok büyük bölgelerde sayım için **1,5 saniyelik süre sınırı** vardır. Bu sınır aşılırsa o bölge atlanır, toplam mayın sayısı kuralı devre dışı kalır ve yüzdeler daha kaba olur. Konsolda `atlanan bölge` olarak görünür.
- Sitenin standart 3 modu dışındaki (Custom) tahtalarda toplam mayın sayısı bilinmediği için yalnızca sayılara dayalı mantık kullanılır.
- Araç sitenin sınıf adlarına (`cell_x_y`, `hd_closed`, `hd_opened`, `hd_typeN`) dayanır. Site yapısını değiştirirse çalışmayabilir.
- Google Mayın Tarlası bu araçla çalışmaz, o oyun canvas ile çizilir.

## Sorun Giderme

| Sorun | Çözüm |
|---|---|
| `Kare bulunamadı` | Oyun sayfasında olduğundan ve tahtanın yüklendiğinden emin ol. Sayfayı yenileyip tekrar yapıştır. |
| Hiç kırmızı kare çıkmıyor | Henüz kesin mayın olmayabilir. Birkaç kare daha aç. |
| İşaretler kaymış görünüyor | Sayfayı kaydırıp pencereyi yeniden boyutlandır, işaretler otomatik yenilenir. |
| Eski işaretler kaldı | `hileDurdur()` yaz, sonra kodu yeniden yapıştır. |

## Katkıda Bulunma

Hata bildirimleri ve pull request'ler açıktır. Hata bildirirken şunları eklemen çok yardımcı olur:

- Ekran görüntüsü (tahta ve konsol çıktısı)
- Oyun modu (Beginner / Intermediate / Expert)
- Tarayıcı ve sürümü

## Lisans

Önerilen: [MIT](https://opensource.org/licenses/MIT). Repoya `LICENSE` dosyası eklemeyi unutma.
