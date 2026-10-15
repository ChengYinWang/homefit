# 開發用：不快取的靜態伺服器（修改檔案後重新整理就能看到）
import http.server, functools, os
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
http.server.ThreadingHTTPServer(('127.0.0.1', 8123), functools.partial(NoCache, directory=root)).serve_forever()
