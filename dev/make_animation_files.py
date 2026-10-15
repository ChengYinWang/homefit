"""相容舊指令：轉交新版 SVG 插畫輸出器，不再使用火柴人路徑解析器。"""
import os, pathlib, shutil, subprocess, sys
root = pathlib.Path(__file__).resolve().parents[1]
runtime = pathlib.Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies'
node = runtime/'node/bin/node.exe'
if not node.exists(): node = shutil.which('node') or 'node'
env = os.environ.copy()
if (runtime/'node/node_modules').exists(): env['NODE_PATH'] = str(runtime/'node/node_modules')
source = pathlib.Path(sys.argv[1]).resolve()
output = pathlib.Path(sys.argv[2]).resolve()
subprocess.run([str(node), str(root/'dev/render_illustrations.cjs'), str(source), str(output)], check=True, env=env)
subprocess.run([sys.executable, str(root/'dev/assemble_gifs.py'), str(output)], check=True)
