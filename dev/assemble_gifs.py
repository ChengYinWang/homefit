"""從 code-native SVG 渲染的影格組合 GIF；共用色盤避免閃色。"""
import json, pathlib, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

root = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '動作動畫')
manifest = json.loads((root/'_frames/manifest.json').read_text(encoding='utf-8'))
(root/'gif').mkdir(exist_ok=True)
for ex in manifest:
    files = sorted((root/'_frames'/ex['id']).glob('*.png'))
    rgb = [Image.open(p).convert('RGB') for p in files]
    # 由整個循環的採樣建立固定色盤，避免每影格重新量化造成閃動。
    samples = rgb[::max(1,len(rgb)//8)]
    strip = Image.new('RGB',(160*len(samples),160))
    for i,im in enumerate(samples): strip.paste(im.resize((160,160)),(i*160,0))
    palette = strip.quantize(colors=128)
    frames = [im.quantize(palette=palette,dither=Image.Dither.NONE) for im in rgb]
    duration = [round((i+1)*ex['frameMs']/10)*10-round(i*ex['frameMs']/10)*10 for i in range(len(frames))]
    target = root/'gif'/(ex['name']+'.gif')
    frames[0].save(target,save_all=True,append_images=frames[1:],duration=duration,loop=0,optimize=True,disposal=1)
    with Image.open(target) as check:
        assert check.size == (640,640)
        assert check.n_frames >= 2
        assert check.info.get('loop') == 0
    for im in rgb: im.close()
    print(ex['name'], target.stat().st_size, flush=True)
