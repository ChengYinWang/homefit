@echo off
chcp 65001 >nul
rem 從 SVG 人物原稿輸出 GIF / SVG / poster（Node.js + sharp / Python + Pillow）
cd /d "%~dp0.."
set "TASK_NODE=node"
set "TASK_PY=python"
set "TASK_RUNTIME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies"
if exist "%TASK_RUNTIME%\node\bin\node.exe" set "TASK_NODE=%TASK_RUNTIME%\node\bin\node.exe"
if exist "%TASK_RUNTIME%\python\python.exe" set "TASK_PY=%TASK_RUNTIME%\python\python.exe"
if exist "%TASK_RUNTIME%\node\node_modules" set "NODE_PATH=%TASK_RUNTIME%\node\node_modules"
"%TASK_NODE%" dev\export_frames.mjs dev\frames.json || exit /b 1
"%TASK_NODE%" dev\render_illustrations.cjs dev\frames.json 動作動畫 || exit /b 1
"%TASK_PY%" dev\assemble_gifs.py 動作動畫 || exit /b 1
"%TASK_NODE%" dev\generate_review.mjs || exit /b 1
echo 完成！檔案在「動作動畫」資料夾
