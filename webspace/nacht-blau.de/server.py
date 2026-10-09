#!/usr/bin/env python3
"""Lokaler Entwicklungsserver für NachtBlau GbR."""

from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).parent
PORT = 8080


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def main():
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"NachtBlau GbR: http://localhost:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
