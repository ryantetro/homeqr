/**
 * Browser-based extraction using Puppeteer
 * Used for sites with heavy bot protection (Zillow, Realtor.com, etc.)
 */

import puppeteer, { type Browser, type Page } from 'puppeteer';

let browserInstance: Browser | null = null;

/**
 * Get or create a browser instance (reuse for performance)
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  return browserInstance;
}

/**
 * Close browser instance (cleanup)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Fetch HTML using Puppeteer with stealth techniques
 */
export async function fetchWithBrowser(url: string): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set realistic viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Override navigator.webdriver to hide automation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        (parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters)) as Promise<PermissionStatus>;
    });

    // Set realistic headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate with realistic timing
    await page.goto(url, {
      waitUntil: 'networkidle2', // Wait for network to be mostly idle
      timeout: 30000,
    });

    // Wait a bit for JavaScript to execute (some sites load data dynamically)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get HTML
    const html = await page.content();
    return html;
  } finally {
    await page.close();
  }
}

/**
 * Check if a platform requires browser-based extraction
 */
export function requiresBrowser(url: string): boolean {
  // Allow disabling Puppeteer via environment variable
  if (process.env.DISABLE_PUPPETEER === 'true') {
    return false;
  }

  const urlLower = url.toLowerCase();
  return (
    urlLower.includes('zillow.com') ||
    urlLower.includes('realtor.com') ||
    urlLower.includes('homes.com') ||
    urlLower.includes('utahrealestate.com')
  );
}

