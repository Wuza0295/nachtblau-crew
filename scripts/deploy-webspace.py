#!/usr/bin/env python3
"""Deploy dist/public to ALL-INKL via FTPS/FTP."""

from __future__ import annotations

from webspace_config import (
    DIST,
    FTP_HOST,
    FTP_REMOTE_DIR,
    FTP_USER,
    HTACCESS,
    connect_ftp,
    cwd_makedirs,
    require_credentials,
)


def ensure_build() -> None:
    if not DIST.exists() or not any(DIST.iterdir()):
        print("Build fehlt – bitte zuerst `pnpm build` ausführen.", file=sys.stderr)
        sys.exit(1)
    ht = DIST / ".htaccess"
    if not ht.exists():
        ht.write_text(HTACCESS)


def upload_tree(ftp, local: Path, remote_prefix: str = "") -> int:
    count = 0
    for item in sorted(local.iterdir()):
        remote_name = f"{remote_prefix}/{item.name}" if remote_prefix else item.name
        if item.is_dir():
            try:
                ftp.mkd(item.name)
            except Exception:
                pass
            ftp.cwd(item.name)
            count += upload_tree(ftp, item, remote_name)
            ftp.cwd("..")
        else:
            print(f"  ↑ {remote_name}")
            with item.open("rb") as fh:
                ftp.storbinary(f"STOR {item.name}", fh)
            count += 1
    return count


def main() -> None:
    require_credentials()
    ensure_build()
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, FTP_REMOTE_DIR or "/")
        print(f"Upload nach {FTP_REMOTE_DIR or '/'} …")
        n = upload_tree(ftp, DIST)
        index_html = DIST / "index.html"
        if index_html.exists():
            with index_html.open("rb") as fh:
                ftp.storbinary("STOR index.htm", fh)
            n += 1
            print("  ↑ index.htm (mirror of index.html)")
        print(f"✓ {n} Dateien hochgeladen.")
        site = FTP_REMOTE_DIR.strip("/").split("/")[-1] if FTP_REMOTE_DIR else "nacht-blau.de"
        print(f"Prüfen: https://{site}/")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    main()
