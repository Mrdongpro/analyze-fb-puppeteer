const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/analyze_fb', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Thiếu tham số URL' });

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    // Auto click “Xem thêm” nếu có
    const seeMoreSelector = 'div[role="button"]:has(span:contains("Xem thêm"))';
    try {
      await page.waitForSelector(seeMoreSelector, { timeout: 3000 });
      await page.click(seeMoreSelector);
    } catch {}

    // Đọc toàn bộ nội dung bài viết
    const fullText = await page.evaluate(() => {
      const article = document.querySelector('[data-ad-preview="message"]');
      return article ? article.innerText : null;
    });

    await browser.close();

    if (!fullText) return res.status(500).json({ error: 'Không đọc được nội dung bài viết' });
    res.json({ content: fullText });

  } catch (err) {
    res.status(500).json({ error: 'Lỗi xử lý', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://0.0.0.0:${PORT}`);
});
