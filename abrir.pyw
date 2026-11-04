"""Lançador do atalho da Área de Trabalho.

Se o servidor já está rodando, só abre o navegador. Se não está, sobe o app.py
sem janela de terminal (o próprio app.py abre o navegador ao iniciar).
"""
import ctypes
import os
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

PASTA = Path(__file__).resolve().parent
PORTA = 7860
ENDERECO = f"http://127.0.0.1:{PORTA}"
LOG = PASTA / "servidor.log"


def servidor_no_ar() -> bool:
    try:
        with socket.create_connection(("127.0.0.1", PORTA), timeout=0.5):
            return True
    except OSError:
        return False


def avisar(texto: str) -> None:
    ctypes.windll.user32.MessageBoxW(None, texto, "YouTube para Markdown", 0x10)


if servidor_no_ar():
    webbrowser.open(ENDERECO)
    sys.exit(0)

python = PASTA / ".venv" / "Scripts" / "python.exe"
if not python.exists():
    avisar(f"Ambiente Python não encontrado em:\n{python}\n\nVeja a seção Instalação do README.")
    sys.exit(1)

# python.exe (e não pythonw) com o console escondido: o yt-dlp e o ffmpeg que o
# app chama herdam esse console invisível, então nenhuma janela preta pisca.
ambiente = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUNBUFFERED="1")
with open(LOG, "w", encoding="utf-8") as log:
    processo = subprocess.Popen(
        [str(python), "app.py"], cwd=PASTA, env=ambiente,
        stdout=log, stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )

time.sleep(2)
if processo.poll() is not None:
    ultimas = LOG.read_text(encoding="utf-8", errors="replace").strip().splitlines()[-12:]
    avisar("O servidor fechou ao iniciar.\n\n" + "\n".join(ultimas))
