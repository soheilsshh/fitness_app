"""Temporary script to inspect page structure."""
import os
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

USER = os.getenv("MORABIHA_USER", "09999907312")
PASS = os.getenv("MORABIHA_PASS", "99py12")

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--disable-gpu")
opts.add_argument("--lang=fa-IR")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)

try:
    driver.get(
        "https://admin-morabiha.ir/login"
        "?returnUrl=%2Ftemplates%2Fexercise%2Flist-general"
    )
    time.sleep(8)
    Path("output").mkdir(exist_ok=True)
    Path("output/login_page.html").write_text(driver.page_source, encoding="utf-8")
    print("Login page title:", driver.title)
    inputs = driver.find_elements(By.CSS_SELECTOR, "input")
    print("Inputs found:", len(inputs))
    for inp in inputs:
        print(
            " ",
            inp.get_attribute("type"),
            inp.get_attribute("name"),
            inp.get_attribute("placeholder"),
        )
    text_inp = driver.find_element(
        By.CSS_SELECTOR, "input[type=text], input[type=tel], input:not([type=password])"
    )
    pwd_inp = driver.find_element(By.CSS_SELECTOR, "input[type=password]")
    text_inp.send_keys(USER)
    pwd_inp.send_keys(PASS)
    btn = driver.find_element(By.CSS_SELECTOR, "button[type=submit], form button")
    btn.click()
    time.sleep(5)
    print("URL after login:", driver.current_url)

    for name, url in [
        ("exercise", "https://admin-morabiha.ir/templates/exercise/list-general"),
        ("diet", "https://admin-morabiha.ir/templates/diet/list-general"),
    ]:
        driver.get(url)
        time.sleep(5)
        Path("output").mkdir(exist_ok=True)
        Path(f"output/{name}_list.html").write_text(driver.page_source, encoding="utf-8")
        print(f"\n=== {name} ===")
        print("URL:", driver.current_url)

        for sel in [
            ".pagination",
            "[class*=pagination]",
            "[class*=Pagination]",
            "nav[aria-label]",
            ".MuiPagination",
            "button[aria-label*=page]",
            "a[href*=page]",
            "[class*=pager]",
            "[class*=Pager]",
        ]:
            els = driver.find_elements(By.CSS_SELECTOR, sel)
            if els:
                print(f"  {sel}: {len(els)} elements")
                for e in els[:3]:
                    print("   ", e.tag_name, e.get_attribute("class"), (e.text or "")[:80])

        for sel in ["table tbody tr", "[class*=row]", "[class*=card]", "a[href*=/templates/]"]:
            els = driver.find_elements(By.CSS_SELECTOR, sel)
            if els:
                print(f"  {sel}: {len(els)}")

        links = driver.find_elements(By.CSS_SELECTOR, "a[href]")
        hrefs = [
            a.get_attribute("href")
            for a in links
            if a.get_attribute("href")
            and any(k in a.get_attribute("href") for k in ("template", "detail", "edit"))
        ]
        print("  template links:", len(hrefs))
        for h in hrefs[:15]:
            print("   ", h)

        btns = driver.find_elements(By.CSS_SELECTOR, "button")
        print("  buttons:", len(btns))
        for b in btns[:20]:
            t = b.text.strip()
            al = b.get_attribute("aria-label") or ""
            if t or al:
                print("   btn:", repr(t[:50]), repr(al[:50]))
finally:
    driver.quit()
