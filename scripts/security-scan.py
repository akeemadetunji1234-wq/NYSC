import requests
import sys

BASE_URL = "https://nysc-mu.vercel.app"

def check_sensitive_files():
    files = [
        "/.env",
        "/.git/config",
        "/package.json",
        "/prisma/schema.prisma",
        "/.vercel/project.json"
    ]
    print("--- Checking for Sensitive Files ---")
    for file in files:
        url = BASE_URL + file
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"[!] WARNING: Sensitive file accessible: {url}")
            else:
                print(f"[+] Safe: {file} returned {response.status_code}")
        except Exception as e:
            print(f"[-] Error checking {file}: {e}")

def check_auth_protection():
    routes = [
        "/admin",
        "/agent/dashboard",
        "/member/dashboard"
    ]
    print("\n--- Checking Route Protection (Unauthenticated) ---")
    for route in routes:
        url = BASE_URL + route
        try:
            # Next.js usually redirects to /signin or returns 401/403
            response = requests.get(url, timeout=5, allow_redirects=False)
            if response.status_code == 200:
                print(f"[!] WARNING: Protected route accessible without auth: {url}")
            elif response.status_code in [302, 307, 401, 403]:
                print(f"[+] Protected: {route} returned {response.status_code}")
            else:
                print(f"[-] {route} returned {response.status_code}")
        except Exception as e:
            print(f"[-] Error checking {route}: {e}")

def check_xss_protection():
    payload = "<script>alert('XSS')</script>"
    urls = [
        f"{BASE_URL}/search?q={payload}",
        f"{BASE_URL}/listings?location={payload}"
    ]
    print("\n--- Checking Basic XSS Reflection ---")
    for url in urls:
        try:
            response = requests.get(url, timeout=5)
            if payload in response.text:
                print(f"[!] WARNING: Potential XSS reflection found: {url}")
            else:
                print(f"[+] Safe: No XSS reflection found in {url}")
        except Exception as e:
            print(f"[-] Error checking XSS: {e}")

if __name__ == "__main__":
    check_sensitive_files()
    check_auth_protection()
    check_xss_protection()
