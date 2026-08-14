import subprocess
import time
import re
import sys

def run_tunnel():
    cmd = [
        "ssh",
        "-o", "ServerAliveInterval=15",
        "-o", "ServerAliveCountMax=3",
        "-o", "StrictHostKeyChecking=no",
        "-R", "80:127.0.0.1:3000",
        "serveo.net"
    ]
    print("[TunnelKeeper] SSH tüneli başlatılıyor...")
    while True:
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            for line in proc.stdout:
                sys.stdout.write(line)
                sys.stdout.flush()
            proc.wait()
        except Exception as e:
            print(f"[TunnelKeeper] Hata oluştu: {e}")
        print("[TunnelKeeper] Tünel bağlantısı kesildi. 2 saniye içinde tekrar bağlanılıyor...")
        time.sleep(2)

if __name__ == '__main__':
    run_tunnel()
