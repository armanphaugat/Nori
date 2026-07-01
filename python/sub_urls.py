import asyncio
from urllib.parse import urlparse, urljoin
from playwright.async_api import async_playwright,Browser, Playwright, Page

_playwright: Playwright = None
_browser: Browser = None
_lock=asyncio.Lock()

async def _get_browser()->Browser:
    global _playwright, _browser
    async with _lock:
        if _playwright is None:
            _playwright = await async_playwright().start()
        if _browser is None:
            _browser = await _playwright.chromium.launch(headless=True)
    return _browser

async def close_browser()->None:
    global _playwright, _browser
    async with _lock:
        if _browser is not None:
            await _browser.close()
            _browser = None
        if _playwright is not None:
            await _playwright.stop()
            _playwright = None

async def get_sub_urls(url: str) -> dict:
    result = {"base_url": url, "sub_urls": [], "count": 0, "error": None}
    browser = await _get_browser()
    page: Page | None = None

    try:
        page = await browser.new_page()
        await page.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in {"image", "stylesheet", "font", "media"}
            else route.continue_(),
        )
        response = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(3000)
        if response is None or not response.ok:
            status = response.status if response else "no response"
            result["error"] = f"HTTP error {status} for: {url}"
            return result
        hrefs: list[str] = await page.eval_on_selector_all(
            "a[href]", "els => els.map(el => el.getAttribute('href'))"
        )
        seen: set[str] = set()
        for href in hrefs:
            if not href or href.strip().startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            full_url = urljoin(url, href)
            parsed = urlparse(full_url)
            if parsed.scheme in ("http", "https"):
                normalised = full_url.rstrip("/")
                if normalised not in seen:
                    seen.add(normalised)
                    result["sub_urls"].append(full_url)
        result["sub_urls"].sort()
        result["count"] = len(result["sub_urls"])
    except Exception as e:
        result["error"]=str(e)

    finally:
        if page:
            await page.close()

    return result
    
