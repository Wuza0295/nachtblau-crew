#!/usr/bin/env python3
"""Stelle die NachtBlau-Projekt-Seite auf https://nacht-blau.de/ bereit.

Lädt webspace/nacht-blau.de/ per temporärem KAS-FTP-User hoch.
Credentials: Umgebungsvariablen, .env.webspace oder /tmp/nb-creds.env.
Keine Secrets werden geloggt oder committed.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import re
import secrets
import ssl
import sys
import time
import urllib.error
import urllib.request
from ftplib import FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "webspace" / "nacht-blau.de"
LOG = Path("/tmp/restore-nacht-blau-gbr.log")
TOKEN_FILE = Path("/tmp/nb-kas.token")
CREDS_CANDIDATES = [
    Path("/tmp/nb-creds.env"),
    ROOT / ".env.webspace",
]

SKIP_NAMES = {".gitkeep", "README.md", "server.py"}


def load_creds() -> dict[str, str]:
    creds: dict[str, str] = {}
    for key in (
        "FTP_HOST",
        "FTP_USER",
        "FTP_PASS",
        "PARENT_HOST",
        "PARENT_USER",
        "PARENT_PASS",
        "KAS_USER",
        "KAS_PASS",
        "SUB_LOGIN",
        "SUB_HOST",
    ):
        if os.environ.get(key):
            creds[key] = os.environ[key]

    for path in CREDS_CANDIDATES:
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip("'").strip('"')
            if key and key not in creds:
                creds[key] = value

    # Aliase für Parent-/Sub-Zugang
    if "PARENT_USER" not in creds and creds.get("FTP_USER"):
        creds["PARENT_USER"] = creds["FTP_USER"]
    if "PARENT_PASS" not in creds and creds.get("FTP_PASS"):
        creds["PARENT_PASS"] = creds["FTP_PASS"]
    if "PARENT_HOST" not in creds:
        creds["PARENT_HOST"] = creds.get("FTP_HOST", "w02176b7.kasserver.com")
    if "SUB_LOGIN" not in creds and creds.get("KAS_USER"):
        creds["SUB_LOGIN"] = creds["KAS_USER"]
    if "SUB_HOST" not in creds:
        creds["SUB_HOST"] = "w021fa34.kasserver.com"

    required = ("PARENT_USER", "PARENT_PASS", "SUB_LOGIN")
    missing = [key for key in required if not creds.get(key)]
    if missing:
        print(
            "Fehlende Credentials: "
            + ", ".join(missing)
            + "\nBitte .env.webspace oder /tmp/nb-creds.env setzen.",
            file=sys.stderr,
        )
        sys.exit(1)
    return creds


CREDS = load_creds()


def log(message: str) -> None:
    print(message, flush=True)
    with LOG.open("a", encoding="utf-8") as handle:
        handle.write(message + "\n")


def local_files() -> list[Path]:
    found = [
        path
        for path in SOURCE.rglob("*")
        if path.is_file() and path.name not in SKIP_NAMES
    ]

    def sort_key(path: Path):
        rel = path.relative_to(SOURCE).as_posix()
        late = rel in {"index.html", "index.htm", "robots.txt", ".htaccess"}
        return (late, rel)

    return sorted(found, key=sort_key)


def connect(host: str, user: str, password: str) -> FTP_TLS:
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    ftp = FTP_TLS(context=context)
    ftp.connect(host, 21, timeout=60)
    ftp.login(user, password)
    ftp.prot_p()
    ftp.set_pasv(True)
    ftp.voidcmd("TYPE I")
    ftp.sock.settimeout(180)
    return ftp


def cwd(ftp: FTP_TLS, path: str) -> None:
    ftp.cwd("/")
    for part in [piece for piece in path.strip("/").split("/") if piece and piece != "."]:
        try:
            ftp.cwd(part)
        except error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def upload(host: str, user: str, password: str, remote_root: str) -> str:
    batch = local_files()
    if not batch:
        raise RuntimeError(f"Keine Dateien unter {SOURCE}")
    log(f"nacht-blau.de: {len(batch)} Dateien nach {host}:{remote_root}")
    ftp = connect(host, user, password)
    grouped: dict[str, list[Path]] = {}
    for path in batch:
        rel = path.relative_to(SOURCE)
        parent = rel.parent.as_posix()
        remote = remote_root.rstrip("/") or "/"
        if parent not in {"", "."}:
            remote = f"{remote.rstrip('/')}/{parent}"
        grouped.setdefault(remote, []).append(path)

    done = 0
    total = len(batch)
    for directory in sorted(grouped):
        cwd(ftp, directory)
        for path in grouped[directory]:
            if path.name in {"index.html", "index.htm"}:
                continue
            payload = path.read_bytes()
            for attempt in range(3):
                try:
                    ftp.storbinary("STOR " + path.name, io.BytesIO(payload))
                    break
                except Exception as error:
                    log(f"retry {path.relative_to(SOURCE)} ({type(error).__name__})")
                    time.sleep(1)
                    try:
                        ftp.quit()
                    except Exception:
                        pass
                    ftp = connect(host, user, password)
                    cwd(ftp, directory)
            else:
                raise RuntimeError(f"Upload fehlgeschlagen: {path.name}")
            done += 1
            if done % 20 == 0 or done == total:
                log(f"upload {done}/{total}")

    index = (SOURCE / "index.html").read_bytes()
    cwd(ftp, remote_root)
    ftp.storbinary("STOR index.html", io.BytesIO(index))
    ftp.storbinary("STOR index.htm", io.BytesIO(index))

    check = bytearray()
    ftp.retrbinary("RETR index.html", check.extend)
    digest = hashlib.sha256(bytes(check)).hexdigest()[:16]
    match = bytes(check) == index
    log(f"index.html {len(check)} sha {digest} match {match}")

    logo = bytearray()
    cwd(ftp, remote_root.rstrip("/") + "/assets")
    ftp.retrbinary("RETR logo.svg", logo.extend)
    log(f"logo.svg {len(logo)} bytes")

    title_ok = b"NachtBlau" in bytes(check) and b"NachtBlau GbR" not in bytes(check)
    ftp.quit()
    if not match or not title_ok or len(logo) < 200:
        raise RuntimeError("Upload-Verifikation fehlgeschlagen")
    return digest


def soap(url: str, action: str, namespace: str, method: str, params: dict) -> str:
    body = json.dumps(params, separators=(",", ":"))
    safe = body.replace("&", "&amp;").replace("<", "&lt;")
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="{namespace}" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <SOAP-ENV:Body>
    <ns1:{method}>
      <Params xsi:type="xsd:string">{safe}</Params>
    </ns1:{method}>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>'''
    request = urllib.request.Request(url, data=xml.encode(), method="POST")
    request.add_header("Content-Type", "text/xml; charset=utf-8")
    request.add_header("SOAPAction", action)
    try:
        with urllib.request.urlopen(
            request, context=ssl.create_default_context(), timeout=40
        ) as response:
            return response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        return error.read().decode("utf-8", "replace")


def extract_return(raw: str) -> str:
    found = re.findall(r"<return[^>]*>(.*?)</return>", raw, re.S)
    if not found:
        return ""
    value = found[0].strip()
    value = (
        value.replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&amp;", "&")
    )
    return value


def kas_auth() -> str:
    raw = soap(
        "https://kasapi.kasserver.com/soap/KasAuth.php",
        "#KasAuth",
        "urn:xmethodsKasApiAuthentication",
        "KasAuth",
        {
            "kas_login": CREDS["PARENT_USER"],
            "kas_auth_type": "plain",
            "kas_auth_data": CREDS["PARENT_PASS"],
            "session_lifetime": 1800,
            "session_update_lifetime": "Y",
        },
    )
    problem = fault(raw)
    token = extract_return(raw)
    if problem:
        raise RuntimeError(f"KasAuth fehlgeschlagen: {problem}")
    if not token or len(token) < 20:
        raise RuntimeError("KasAuth lieferte kein Session-Token")
    TOKEN_FILE.write_text(token)
    TOKEN_FILE.chmod(0o600)
    log(f"KasAuth OK (token len {len(token)})")
    return token


def kas(action: str, params: dict | None = None) -> str:
    time.sleep(0.6)
    token = TOKEN_FILE.read_text().strip()
    return soap(
        "https://kasapi.kasserver.com/soap/KasApi.php",
        "urn:xmethodsKasApi#KasApi",
        "urn:xmethodsKasApi",
        "KasApi",
        {
            "kas_login": CREDS["SUB_LOGIN"],
            "kas_auth_type": "session",
            "kas_auth_data": token,
            "kas_action": action,
            "KasRequestParams": params or {},
        },
    )


def fault(raw: str) -> str:
    found = re.findall(r"<faultstring[^>]*>(.*?)</faultstring>", raw, re.S)
    return found[0].strip() if found else ""


def return_string(raw: str) -> str:
    found = re.findall(
        r"<key[^>]*>ReturnString</key><value[^>]*>(.*?)</value>",
        raw,
        re.S,
    )
    return found[0].strip() if found else ""


def ftp_logins(raw: str) -> list[str]:
    return re.findall(
        r"<key[^>]*>ftp_login</key><value[^>]*>(.*?)</value>",
        raw,
        re.S,
    )


def wait_until_only_main() -> list[str]:
    for _ in range(20):
        raw = kas("get_ftpusers")
        problem = fault(raw)
        names = ftp_logins(raw)
        log(f"ftpusers {names} fault {problem or '-'}")
        if problem == "in_progress":
            time.sleep(2)
            continue
        if names and set(names) <= {CREDS["SUB_LOGIN"]}:
            return names
        if names and any(name != CREDS["SUB_LOGIN"] for name in names):
            time.sleep(2)
            continue
        if not names and problem:
            time.sleep(2)
            continue
        time.sleep(2)
    raise RuntimeError("FTP-User wurden nicht rechtzeitig frei")


def main() -> None:
    if not SOURCE.is_dir():
        raise RuntimeError(f"Quelle fehlt: {SOURCE}")
    LOG.write_text("")
    log(f"Deploy NachtBlau aus {SOURCE}")
    kas_auth()
    wait_until_only_main()

    login = secrets.token_hex(4)
    password = secrets.token_urlsafe(18)
    created = ""
    for attempt in range(8):
        raw = kas(
            "add_ftpuser",
            {
                "ftp_login": login,
                "ftp_password": password,
                "ftp_path": "/nacht-blau.de/",
                "ftp_comment": "gbr-restore",
            },
        )
        problem = fault(raw)
        returned = return_string(raw)
        names = ftp_logins(raw)
        log(
            f"add_ftpuser Versuch {attempt + 1} return {returned or '-'} "
            f"fault {problem or '-'} logins {names}"
        )
        if problem == "in_progress":
            wait_until_only_main()
            continue
        if problem:
            raise RuntimeError(f"add_ftpuser fehlgeschlagen: {problem}")
        created = names[-1] if names else login
        if returned and returned not in {"TRUE", "true"}:
            created = returned
        break
    else:
        raise RuntimeError("add_ftpuser blieb in_progress")

    listed = ftp_logins(kas("get_ftpusers"))
    extras = [name for name in listed if name != CREDS["SUB_LOGIN"]]
    if extras:
        created = extras[-1]
    log(f"temporärer FTP-Login {created}")

    try:
        digest = upload(CREDS["SUB_HOST"], created, password, "/")
        log(f"Upload fertig sha={digest}")
    finally:
        for attempt in range(8):
            raw = kas("delete_ftpuser", {"ftp_login": created})
            problem = fault(raw)
            log(
                f"delete_ftpuser Versuch {attempt + 1} "
                f"return {return_string(raw) or '-'} fault {problem or '-'}"
            )
            if problem == "in_progress":
                time.sleep(2)
                continue
            break
        wait_until_only_main()
        log("temporärer FTP-User entfernt")

    log("RESTORE DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        log(f"FEHLER {type(error).__name__}: {error}")
        raise
