"""
Selenium scraper for admin-morabiha.ir (trainer panel).
Run: python selenium_scraper.py
"""

import json
import os
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

# --- config ---
USERNAME = os.getenv("MORABIHA_USER", "09999907312")
PASSWORD = os.getenv("MORABIHA_PASS", "99py12")

LOGIN_URL = (
    "https://admin-morabiha.ir/login"
    "?returnUrl=%2Ftemplates%2Fexercise%2Flist-general"
)
TARGET_URL = "https://admin-morabiha.ir/templates/exercise/list-general"

OUTPUT_DIR = Path("output")
COOKIES_FILE = OUTPUT_DIR / "cookies.json"
HTML_FILE = OUTPUT_DIR / "exercise_list.html"


def create_driver(headless: bool = False) -> webdriver.Chrome:
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    # Persian/RTL sites sometimes need this
    options.add_argument("--lang=fa-IR")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(2)
    return driver


def save_screenshot(driver: webdriver.Chrome, name: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"{name}.png"
    driver.save_screenshot(str(path))
    print(f"[screenshot] {path}")


def find_input(driver: webdriver.Chrome, candidates: list[tuple[str, str]]):
    """Try multiple selectors until one works."""
    for by, selector in candidates:
        try:
            el = WebDriverWait(driver, 8).until(
                EC.presence_of_element_located((by, selector))
            )
            if el.is_displayed():
                print(f"[ok] found input: {by} = {selector}")
                return el
        except Exception:
            continue
    raise RuntimeError("Could not find username/password input. Check screenshot.")


def find_submit_button(driver: webdriver.Chrome):
    candidates = [
        (By.CSS_SELECTOR, "button[type='submit']"),
        (By.XPATH, "//button[contains(., 'ورود')]"),
        (By.XPATH, "//button[contains(., 'ورود به')]"),
        (By.XPATH, "//input[@type='submit']"),
        (By.CSS_SELECTOR, "form button"),
    ]
    for by, selector in candidates:
        try:
            el = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((by, selector))
            )
            print(f"[ok] found submit: {by} = {selector}")
            return el
        except Exception:
            continue
    raise RuntimeError("Could not find login button. Check screenshot.")


def login(driver: webdriver.Chrome) -> None:
    print("[1] Opening login page...")
    driver.get(LOGIN_URL)

    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    time.sleep(2)  # SPA may render late
    save_screenshot(driver, "01_login_page")

    print("[2] Filling credentials...")
    username_input = find_input(
        driver,
        [
            (By.CSS_SELECTOR, "input[type='text']"),
            (By.CSS_SELECTOR, "input[type='email']"),
            (By.CSS_SELECTOR, "input[type='tel']"),
            (By.CSS_SELECTOR, "input[name='UserName']"),
            (By.CSS_SELECTOR, "input[name='username']"),
            (By.CSS_SELECTOR, "input[name='phone']"),
            (By.CSS_SELECTOR, "input[placeholder*='موبایل']"),
            (By.CSS_SELECTOR, "input[placeholder*='ایمیل']"),
            (By.XPATH, "//input[not(@type='password')]"),
        ],
    )
    password_input = find_input(
        driver,
        [
            (By.CSS_SELECTOR, "input[type='password']"),
            (By.CSS_SELECTOR, "input[name='Password']"),
            (By.CSS_SELECTOR, "input[name='password']"),
        ],
    )

    username_input.clear()
    username_input.send_keys(USERNAME)
    password_input.clear()
    password_input.send_keys(PASSWORD)
    save_screenshot(driver, "02_filled_form")

    print("[3] Submitting login...")
    submit = find_submit_button(driver)
    submit.click()

    # Wait until we leave login page or target page loads
    print("[4] Waiting for redirect...")
    try:
        WebDriverWait(driver, 25).until(
            lambda d: "login" not in d.current_url.lower()
            or "list-general" in d.current_url.lower()
        )
    except Exception:
        save_screenshot(driver, "03_login_failed")
        raise RuntimeError(
            "Login did not redirect. Wrong password or selector issue. "
            "See output/03_login_failed.png"
        )

    time.sleep(3)
    save_screenshot(driver, "03_after_login")
    print(f"[ok] Current URL: {driver.current_url}")


def save_cookies(driver: webdriver.Chrome) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(COOKIES_FILE, "w", encoding="utf-8") as f:
        json.dump(driver.get_cookies(), f, ensure_ascii=False, indent=2)
    print(f"[ok] Cookies saved: {COOKIES_FILE}")


def load_cookies(driver: webdriver.Chrome) -> bool:
    if not COOKIES_FILE.exists():
        return False
    driver.get("https://admin-morabiha.ir/")
    with open(COOKIES_FILE, encoding="utf-8") as f:
        cookies = json.load(f)
    for c in cookies:
        # Selenium needs domain without leading dot sometimes
        if "expiry" in c:
            c["expiry"] = int(c["expiry"])
        try:
            driver.add_cookie(c)
        except Exception:
            pass
    return True


def scrape_exercise_list(driver: webdriver.Chrome) -> str:
    print("[5] Opening exercise list...")
    driver.get(TARGET_URL)
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    time.sleep(4)  # wait for XHR/API data to render
    save_screenshot(driver, "04_exercise_list")

    html = driver.page_source
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    HTML_FILE.write_text(html, encoding="utf-8")
    print(f"[ok] HTML saved: {HTML_FILE} ({len(html)} chars)")
    return html


def try_capture_api_from_logs(driver: webdriver.Chrome) -> None:
    """If site loads data via API, performance logs may show the URL."""
    try:
        logs = driver.get_log("performance")
    except Exception:
        print("[info] Enable performance logging in Chrome options to capture API URLs.")
        return

    api_urls = []
    for entry in logs:
        msg = json.loads(entry["message"])["message"]
        if msg.get("method") == "Network.responseReceived":
            url = msg["params"]["response"].get("url", "")
            if any(k in url.lower() for k in ("api", "exercise", "template", "list")):
                api_urls.append(url)

    if api_urls:
        out = OUTPUT_DIR / "api_urls.txt"
        out.write_text("\n".join(sorted(set(api_urls))), encoding="utf-8")
        print(f"[ok] Possible API URLs: {out}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    driver = create_driver(headless=False)

    try:
        # Optional: reuse saved session
        if load_cookies(driver):
            driver.get(TARGET_URL)
            time.sleep(3)
            if "login" not in driver.current_url.lower():
                print("[ok] Reused saved cookies, already logged in.")
            else:
                login(driver)

        if "login" in driver.current_url.lower() or driver.current_url == "about:blank":
            login(driver)

        save_cookies(driver)
        scrape_exercise_list(driver)

        print("\n--- DONE ---")
        print("Check folder: output/")
        print("- exercise_list.html  -> page HTML")
        print("- cookies.json        -> session for next run")
        print("- *.png               -> debug screenshots")

        input("\nPress Enter to close browser...")

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
