#!/usr/bin/env python3
"""Verify FTPS login to ALL-INKL and list the webspace root."""

from __future__ import annotations

import os
import ssl
import sys
from ftplib import FTP_TLS, error_perm

from load_allinkl_env import load_allinkl_env

load_allinkl_env()

FTP_HOST = os.environ.get("FTP_HOST", "w02176b7.kasserver.com")
FTP_USER = os.environ.get("FTP_USER", "")
FTP_PASS = os.environ.get("FTP_PASS", "")
USE_TLS = os.environ.get("FTP_TLS", "1") != "0"


def connect() -> FTP_TLS:
    if not FTP_USER or not FTP_PASS:
        print(
            "FTP-Zugang fehlt. Lege `.env` an (siehe `.env.example`) oder setze FTP_USER/FTP_PASS.",
            file=sys.stderr,
        )
        sys.exit(1)
    if USE_TLS:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ftp = FTP_TLS(context=ctx)
    else:
        from ftplib import FTP

        ftp = FTP()  # type: ignore[assignment]
    ftp.connect(FTP_HOST, 21, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    if isinstance(ftp, FTP_TLS):
        try:
            ftp.prot_p()
        except error_perm:
            pass
    return ftp


def main() -> None:
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect()
    try:
        print(f"✓ Login erfolgreich (PWD: {ftp.pwd()})")
        print("\nWebspace-Ordner (Auszug):")
        lines: list[str] = []
        ftp.retrlines("LIST", lines.append)
        for line in sorted(lines)[:25]:
            print(f"  {line}")
        if len(lines) > 25:
            print(f"  … und {len(lines) - 25} weitere Einträge")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    main()
