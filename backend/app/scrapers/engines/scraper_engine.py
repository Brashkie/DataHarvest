"""
DataHarvest — Scraper Engine Manager
Playwright · Selenium · Requests · Scrapy · CloudScraper · Tor
"""
from __future__ import annotations

import asyncio
import time
import random
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Callable
from urllib.parse import urlparse

import requests
import httpx
from bs4 import BeautifulSoup
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from fake_useragent import UserAgent

from app.core.config import settings

ua = UserAgent()


# ── Data Classes ─────────────────────────────────────────────────────────────

@dataclass
class ScrapeConfig:
    """Configuration for a single scrape operation."""
    url: str
    engine: str = "playwright"                     # playwright | selenium | requests | cloudscraper
    selectors: Dict[str, str] = field(default_factory=dict)  # {field: css_selector}
    xpath_selectors: Dict[str, str] = field(default_factory=dict)
    headers: Dict[str, str] = field(default_factory=dict)
    cookies: Dict[str, str] = field(default_factory=dict)
    auth: Optional[Dict[str, str]] = None          # {type, username, password, token}
    proxy: Optional[str] = None
    timeout: int = 30
    wait_for: Optional[str] = None                 # CSS selector to wait for
    wait_ms: int = 0                               # extra wait in ms after load
    scroll: bool = False                           # auto-scroll to bottom
    screenshot: bool = False
    javascript: Optional[str] = None              # custom JS to execute
    pagination: Optional[Dict] = None             # {next_selector, max_pages, url_pattern}
    follow_links: Optional[Dict] = None           # {selector, max_depth, same_domain}
    extract_tables: bool = True
    extract_links: bool = False
    extract_images: bool = False
    extract_metadata: bool = True
    use_tor: bool = False
    stealth: bool = False                          # stealth mode to avoid detection
    headless: bool = True
    user_agent: Optional[str] = None


@dataclass
class ScrapeResult:
    """Result of a scrape operation."""
    url: str
    success: bool
    engine: str
    data: List[Dict[str, Any]] = field(default_factory=list)
    tables: List[Dict[str, Any]] = field(default_factory=list)
    links: List[str] = field(default_factory=list)
    images: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    raw_html: Optional[str] = None
    screenshot_path: Optional[str] = None
    pages_scraped: int = 1
    rows_extracted: int = 0
    duration_secs: float = 0.0
    error: Optional[str] = None
    status_code: Optional[int] = None


# ── Base Engine ───────────────────────────────────────────────────────────────

class BaseEngine:
    def __init__(self, config: ScrapeConfig):
        self.config = config
        self.logger = logger.bind(engine=self.__class__.__name__, url=config.url)

    def _get_headers(self) -> Dict[str, str]:
        base = {
            "User-Agent": self.config.user_agent or ua.random,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
        }
        base.update(self.config.headers)
        return base

    def _parse_html(self, html: str, url: str) -> Dict[str, Any]:
        """Parse HTML with BeautifulSoup — extract structured data."""
        soup = BeautifulSoup(html, "lxml")

        result: Dict[str, Any] = {"_url": url}

        # CSS selectors
        for field_name, selector in self.config.selectors.items():
            try:
                elements = soup.select(selector)
                if len(elements) == 1:
                    result[field_name] = elements[0].get_text(strip=True)
                elif len(elements) > 1:
                    result[field_name] = [el.get_text(strip=True) for el in elements]
            except Exception as e:
                self.logger.warning(f"Selector '{selector}' failed: {e}")

        return result

    def _extract_tables(self, html: str) -> List[Dict]:
        """Extract all HTML tables as list of dicts."""
        import pandas as pd
        tables = []
        try:
            dfs = pd.read_html(html)
            for i, df in enumerate(dfs):
                tables.append({
                    "index": i,
                    "columns": df.columns.tolist(),
                    "rows": df.to_dict("records"),
                    "shape": list(df.shape),
                })
        except Exception:
            pass
        return tables

    def _extract_links(self, html: str, base_url: str) -> List[str]:
        """Extract all unique links."""
        from urllib.parse import urljoin
        soup = BeautifulSoup(html, "lxml")
        links = set()
        for a in soup.find_all("a", href=True):
            href = urljoin(base_url, a["href"])
            if href.startswith("http"):
                links.add(href)
        return list(links)

    def _extract_metadata(self, html: str) -> Dict[str, Any]:
        """Extract page metadata."""
        soup = BeautifulSoup(html, "lxml")
        meta: Dict[str, Any] = {}

        if title := soup.find("title"):
            meta["title"] = title.get_text(strip=True)

        for m in soup.find_all("meta"):
            name = m.get("name") or m.get("property", "")
            content = m.get("content", "")
            if name and content:
                meta[name] = content

        return meta


# ── Playwright Engine ─────────────────────────────────────────────────────────

class PlaywrightEngine(BaseEngine):
    """Full browser automation — handles JS-heavy sites, SPAs."""

    async def scrape_async(self) -> ScrapeResult:
        from playwright.async_api import async_playwright, TimeoutError as PWTimeout

        start = time.perf_counter()
        result = ScrapeResult(url=self.config.url, success=False, engine="playwright")

        async with async_playwright() as p:
            browser_type = p.chromium
            launch_opts = {
                "headless": self.config.headless,
                "args": [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                ],
            }

            if self.config.proxy:
                launch_opts["proxy"] = {"server": self.config.proxy}
            elif self.config.use_tor:
                launch_opts["proxy"] = {"server": settings.TOR_PROXY}

            browser = await browser_type.launch(**launch_opts)

            context = await browser.new_context(
                user_agent=self.config.user_agent or ua.random,
                viewport={"width": 1920, "height": 1080},
                extra_http_headers=self.config.headers,
                ignore_https_errors=True,
            )

            if self.config.stealth:
                await context.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                    Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3,4,5]});
                    window.chrome = {runtime: {}};
                """)

            if self.config.cookies:
                await context.add_cookies([
                    {"name": k, "value": v, "url": self.config.url}
                    for k, v in self.config.cookies.items()
                ])

            page = await context.new_page()
            pages_scraped = 0
            all_data = []
            all_tables = []
            all_links = []

            try:
                current_url = self.config.url
                max_pages = 1
                if self.config.pagination:
                    max_pages = self.config.pagination.get("max_pages", 10)

                for page_num in range(max_pages):
                    self.logger.info(f"Scraping page {page_num + 1}: {current_url}")
                    await page.goto(
                        current_url,
                        wait_until="networkidle",
                        timeout=self.config.timeout * 1000,
                    )

                    if self.config.wait_for:
                        try:
                            await page.wait_for_selector(
                                self.config.wait_for,
                                timeout=10000
                            )
                        except PWTimeout:
                            self.logger.warning(f"wait_for selector timed out: {self.config.wait_for}")

                    if self.config.wait_ms > 0:
                        await page.wait_for_timeout(self.config.wait_ms)

                    if self.config.scroll:
                        await self._auto_scroll(page)

                    if self.config.javascript:
                        await page.evaluate(self.config.javascript)

                    html = await page.content()
                    pages_scraped += 1

                    # Parse
                    if self.config.selectors:
                        data = self._parse_html(html, current_url)
                        all_data.append(data)

                    if self.config.extract_tables:
                        all_tables.extend(self._extract_tables(html))

                    if self.config.extract_links:
                        all_links.extend(self._extract_links(html, current_url))

                    if self.config.screenshot:
                        import os
                        ss_path = f"{settings.EXPORT_DIR}/screenshots/{int(time.time())}_{page_num}.png"
                        os.makedirs(os.path.dirname(ss_path), exist_ok=True)
                        await page.screenshot(path=ss_path, full_page=True)
                        result.screenshot_path = ss_path

                    # Pagination
                    if self.config.pagination and page_num < max_pages - 1:
                        next_sel = self.config.pagination.get("next_selector")
                        if next_sel:
                            next_btn = await page.query_selector(next_sel)
                            if not next_btn:
                                break
                            await next_btn.click()
                            await page.wait_for_load_state("networkidle")
                            current_url = page.url
                        else:
                            break

                result.success = True
                result.data = all_data
                result.tables = all_tables
                result.links = list(set(all_links))
                result.pages_scraped = pages_scraped
                result.rows_extracted = sum(len(t.get("rows", [])) for t in all_tables) + len(all_data)
                result.metadata = self._extract_metadata(html) if self.config.extract_metadata else {}

            except Exception as e:
                result.error = str(e)
                self.logger.error(f"Playwright scrape failed: {e}")
            finally:
                await browser.close()

        result.duration_secs = time.perf_counter() - start
        return result

    async def _auto_scroll(self, page) -> None:
        """Scroll page to bottom progressively."""
        await page.evaluate("""
            async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 300;
                    const timer = setInterval(() => {
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= document.body.scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            }
        """)

    def scrape(self) -> ScrapeResult:
        """Sync wrapper for async scrape."""
        return asyncio.run(self.scrape_async())


# ── Selenium Engine ────────────────────────────────────────────────────────────

class SeleniumEngine(BaseEngine):
    """Selenium WebDriver — Chrome/Firefox automation."""

    def scrape(self) -> ScrapeResult:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from webdriver_manager.chrome import ChromeDriverManager

        start = time.perf_counter()
        result = ScrapeResult(url=self.config.url, success=False, engine="selenium")

        opts = Options()
        if self.config.headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-blink-features=AutomationControlled")
        opts.add_argument(f"--user-agent={self.config.user_agent or ua.random}")
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option("useAutomationExtension", False)

        if self.config.proxy:
            opts.add_argument(f"--proxy-server={self.config.proxy}")

        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=opts)
        driver.set_page_load_timeout(self.config.timeout)

        try:
            driver.get(self.config.url)

            if self.config.wait_for:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, self.config.wait_for))
                )

            if self.config.wait_ms > 0:
                import time as t; t.sleep(self.config.wait_ms / 1000)

            if self.config.scroll:
                driver.execute_script(
                    "window.scrollTo(0, document.body.scrollHeight);"
                )
                import time as t; t.sleep(1)

            if self.config.javascript:
                driver.execute_script(self.config.javascript)

            html = driver.page_source
            data = self._parse_html(html, self.config.url) if self.config.selectors else {}
            tables = self._extract_tables(html) if self.config.extract_tables else []

            result.success = True
            result.data = [data] if data else []
            result.tables = tables
            result.rows_extracted = sum(len(t.get("rows", [])) for t in tables)
            result.metadata = self._extract_metadata(html) if self.config.extract_metadata else {}

            if self.config.screenshot:
                import os
                ss_path = f"{settings.EXPORT_DIR}/screenshots/sel_{int(time.time())}.png"
                os.makedirs(os.path.dirname(ss_path), exist_ok=True)
                driver.save_screenshot(ss_path)
                result.screenshot_path = ss_path

        except Exception as e:
            result.error = str(e)
            self.logger.error(f"Selenium scrape failed: {e}")
        finally:
            driver.quit()

        result.duration_secs = time.perf_counter() - start
        return result


# ── Requests Engine ────────────────────────────────────────────────────────────

class RequestsEngine(BaseEngine):
    """Fast requests-based scraper for simple static pages."""

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(requests.RequestException),
    )
    def scrape(self) -> ScrapeResult:
        start = time.perf_counter()
        result = ScrapeResult(url=self.config.url, success=False, engine="requests")

        session = requests.Session()
        proxies = {}

        if self.config.proxy:
            proxies = {"http": self.config.proxy, "https": self.config.proxy}
        elif self.config.use_tor:
            proxies = {"http": settings.TOR_PROXY, "https": settings.TOR_PROXY}

        if self.config.auth:
            auth_type = self.config.auth.get("type", "basic")
            if auth_type == "basic":
                session.auth = (
                    self.config.auth["username"],
                    self.config.auth["password"],
                )
            elif auth_type == "bearer":
                session.headers["Authorization"] = f"Bearer {self.config.auth['token']}"

        try:
            response = session.get(
                self.config.url,
                headers=self._get_headers(),
                cookies=self.config.cookies,
                proxies=proxies,
                timeout=self.config.timeout,
                verify=not self.config.use_tor,
            )
            response.raise_for_status()
            result.status_code = response.status_code

            html = response.text
            data = self._parse_html(html, self.config.url) if self.config.selectors else {}
            tables = self._extract_tables(html) if self.config.extract_tables else []
            links = self._extract_links(html, self.config.url) if self.config.extract_links else []

            result.success = True
            result.data = [data] if data else []
            result.tables = tables
            result.links = links
            result.raw_html = html
            result.rows_extracted = sum(len(t.get("rows", [])) for t in tables)
            result.metadata = self._extract_metadata(html) if self.config.extract_metadata else {}

        except Exception as e:
            result.error = str(e)
            self.logger.error(f"Requests scrape failed: {e}")

        result.duration_secs = time.perf_counter() - start
        return result


# ── CloudScraper Engine ───────────────────────────────────────────────────────

class CloudScraperEngine(BaseEngine):
    """CloudScraper — bypass Cloudflare & bot detection."""

    def scrape(self) -> ScrapeResult:
        import cloudscraper

        start = time.perf_counter()
        result = ScrapeResult(url=self.config.url, success=False, engine="cloudscraper")

        scraper = cloudscraper.create_scraper(
            browser={
                "browser": "chrome",
                "platform": "windows",
                "desktop": True,
            }
        )

        try:
            response = scraper.get(
                self.config.url,
                headers=self.config.headers,
                cookies=self.config.cookies,
                timeout=self.config.timeout,
            )
            response.raise_for_status()
            result.status_code = response.status_code

            html = response.text
            data = self._parse_html(html, self.config.url) if self.config.selectors else {}
            tables = self._extract_tables(html) if self.config.extract_tables else []

            result.success = True
            result.data = [data] if data else []
            result.tables = tables
            result.rows_extracted = sum(len(t.get("rows", [])) for t in tables)

        except Exception as e:
            result.error = str(e)
            self.logger.error(f"CloudScraper failed: {e}")

        result.duration_secs = time.perf_counter() - start
        return result


# ── Engine Factory ────────────────────────────────────────────────────────────

class ScraperEngineFactory:
    """Factory — instantiate the right engine for a given config."""

    _engines = {
        "playwright":    PlaywrightEngine,
        "selenium":      SeleniumEngine,
        "requests":      RequestsEngine,
        "cloudscraper":  CloudScraperEngine,
    }

    @classmethod
    def create(cls, config: ScrapeConfig) -> BaseEngine:
        engine_cls = cls._engines.get(config.engine)
        if not engine_cls:
            raise ValueError(f"Unknown engine: {config.engine}. Valid: {list(cls._engines.keys())}")
        return engine_cls(config)

    @classmethod
    def auto_select(cls, url: str, config: ScrapeConfig) -> str:
        """
        Auto-select the best engine based on URL characteristics.
        - Cloudflare-protected → cloudscraper
        - SPA / heavy JS → playwright
        - Static HTML → requests
        """
        domain = urlparse(url).netloc.lower()

        # Known JS-heavy or SPA sites
        js_heavy_patterns = ["twitter.com", "x.com", "linkedin.com", "instagram.com",
                             "facebook.com", "tiktok.com", "youtube.com"]
        cf_patterns = ["cloudflare", "shopify"]  # simplified

        if any(p in domain for p in js_heavy_patterns):
            return "playwright"
        if any(p in domain for p in cf_patterns):
            return "cloudscraper"

        return "requests"


# ── High-level scrape function ────────────────────────────────────────────────

def scrape(config: ScrapeConfig, on_progress: Optional[Callable] = None) -> ScrapeResult:
    """
    Main entry point: scrape a URL with the configured engine.
    Emits progress via callback if provided.
    """
    if config.engine == "auto":
        config.engine = ScraperEngineFactory.auto_select(config.url, config)
        logger.info(f"Auto-selected engine: {config.engine} for {config.url}")

    engine = ScraperEngineFactory.create(config)

    if on_progress:
        on_progress({"stage": "connecting", "progress": 10})

    result = engine.scrape()

    if on_progress:
        on_progress({
            "stage": "completed" if result.success else "error",
            "progress": 100,
            "rows": result.rows_extracted,
            "pages": result.pages_scraped,
        })

    return result