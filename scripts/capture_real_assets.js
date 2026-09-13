const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8085/';
const OUT_DIR = path.resolve(__dirname, '../docs/images');
const FRAMES_DIR = path.resolve(__dirname, '../temp_frames');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 480,
    height: 940,
    deviceScaleFactor: 2
  });

  console.log('Navigating to', URL);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(1000);

  // 1. Dashboard Overview Screenshot
  console.log('Capturing screenshot_dashboard.png...');
  await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_dashboard.png'), type: 'png' });
  await page.screenshot({ path: path.join(FRAMES_DIR, 'frame_01.png'), type: 'png' });

  // 2. Net Burn View
  console.log('Toggling My Share net burn...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const netBtn = btns.find(b => b.textContent && b.textContent.includes('My Share'));
    if (netBtn) netBtn.click();
  });
  await sleep(500);
  await page.screenshot({ path: path.join(FRAMES_DIR, 'frame_02.png'), type: 'png' });

  // 3. Currency USD View
  console.log('Switching currency to USD...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const usdBtn = btns.find(b => b.textContent && b.textContent.trim() === 'USD');
    if (usdBtn) usdBtn.click();
  });
  await sleep(500);
  await page.screenshot({ path: path.join(FRAMES_DIR, 'frame_03.png'), type: 'png' });

  // Switch back to EUR
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const eurBtn = btns.find(b => b.textContent && b.textContent.trim() === 'EUR');
    if (eurBtn) eurBtn.click();
  });
  await sleep(300);

  // 4. Services Tab View
  console.log('Switching to Services tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sBtn = btns.find(b => b.textContent && b.textContent.includes('Services'));
    if (sBtn) sBtn.click();
  });
  await sleep(500);
  await page.screenshot({ path: path.join(FRAMES_DIR, 'frame_04.png'), type: 'png' });

  // 5. Subscription Detail Drawer (ChatGPT Plus)
  console.log('Opening ChatGPT Plus detail drawer...');
  await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('h3'));
    const gptTitle = titles.find(t => t.textContent && t.textContent.includes('ChatGPT Plus'));
    if (gptTitle) {
      const card = gptTitle.closest('div[class*="glass-card"]');
      if (card) card.click();
    }
  });
  await sleep(600);
  console.log('Capturing screenshot_detail_shield.png...');
  await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_detail_shield.png'), type: 'png' });
  await page.screenshot({ path: path.join(FRAMES_DIR, 'frame_05.png'), type: 'png' });

  // Close detail drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button svg.lucide-x')?.closest('button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  // 6. Add Subscription Modal
  console.log('Opening Add Subscription modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent && b.textContent.includes('Add'));
    if (addBtn) addBtn.click();
  });
  await sleep(500);
  console.log('Capturing screenshot_add_subscription.png...');
  await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_add_subscription.png'), type: 'png' });

  // Close Add modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button svg.lucide-x')?.closest('button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  // 7. Renewal Calendar Tab
  console.log('Switching to Calendar tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const calBtn = btns.find(b => b.textContent && b.textContent.includes('Calendar'));
    if (calBtn) calBtn.click();
  });
  await sleep(500);
  console.log('Capturing screenshot_calendar_view.png...');
  await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_calendar_view.png'), type: 'png' });
  await page.screenshot({ path: path.join(FRAMES_DIR, 'frame_06.png'), type: 'png' });

  await browser.close();
  console.log('✓ All real screenshots captured successfully!');

  // Generate animated demo GIF using ffmpeg
  const gifOutput = path.join(OUT_DIR, 'demo.gif');
  console.log('Assembling animated demo.gif via ffmpeg...');
  const ffmpegCmd = `ffmpeg -y -framerate 0.7 -i "${FRAMES_DIR}\\frame_%02d.png" -vf "scale=420:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${gifOutput}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });
  console.log('✓ Generated animated GIF:', gifOutput);

  // Clean up temp frames
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
