"""Build a relocatable static site from the Jensen modules and frozen comparison assets."""
from pathlib import Path
import argparse
import base64
import re
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--standalone', action='store_true', help='also export the offline journey, finale and reflection practice')
args = parser.parse_args()
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
for name in ('art', 'combat'):
    shutil.copytree(ROOT / name, OUT / name)
# Preserve the published /warrior/ bookmarks with the fixed comparison edition.
shutil.copytree(ROOT / 'references/warrior', OUT / 'warrior')
game = ROOT / 'game'
html = (game / 'index.template.html').read_text()
for name in ('combat-data.js', 'combat-actions.js', 'combat-enemies.js', 'runtime.js',
             'lab.js', 'store.js', 'story.js', 'ui.css', 'ui.html'):
    marker = '{{JENSEN:' + name + '}}'
    assert html.count(marker) == 1, name
    html = html.replace(marker, (game / name).read_text())
assert '{{JENSEN:' not in html
(OUT / 'game').mkdir()
(OUT / 'game/index.html').write_text(html)
shutil.copy2(game / 'store.js', OUT / 'game/store.js')
shutil.copytree(game / 'assets', OUT / 'game/assets')
shutil.copy2(ROOT / 'index.html', OUT / 'index.html')
(OUT / '.nojekyll').touch()
# Keep the existing public lab bookmark while the source has one canonical name.
(OUT / 'cozy').mkdir()
(OUT / 'cozy/index.html').write_text('<!doctype html><meta charset="utf-8"><title>Combat lab</title><script>location.replace("../combat/"+location.search+location.hash)</script><a href="../combat/">Open combat lab</a>')
# The reflection is already a complete, independently playable encounter.
(OUT / 'vertical-slice').mkdir()
(OUT / 'vertical-slice/index.html').write_text(
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>The Reflection</title>'
    '<meta http-equiv="refresh" content="0; url=../combat/?mode=reflection">'
    '<a href="../combat/?mode=reflection">Play The Reflection</a></html>'
)
print('Built dist/: playable story, combat, reflection, art and warrior reference')

if args.standalone:
    combat = OUT / 'combat'
    page = (combat / 'index.html').read_text()
    page = page.replace('<link rel="stylesheet" href="./journey.css">', '<style>\n' + (combat / 'journey.css').read_text() + '\n</style>')
    wasm = base64.b64encode((combat / 'vendor/HavokPhysics.wasm').read_bytes()).decode('ascii')
    notices = '\n'.join((combat / 'vendor' / name).read_text() for name in ('LICENSE.babylon.md', 'LICENSE.havok'))
    assets = combat / 'assets'
    for name, media_type in [('wafer-floor.webp', 'image/webp'), ('BarlowCondensed-Bold.ttf', 'font/ttf')]:
        reference = './assets/' + name
        assert page.count(reference) == 1, name
        data = base64.b64encode((assets / name).read_bytes()).decode('ascii')
        page = page.replace(reference, f'data:{media_type};base64,{data}')
    for ref in set(re.findall(r'url\("([^"]+\.(?:jpg|webp))"\)', page)):
        data = base64.b64encode((combat / ref).read_bytes()).decode('ascii')
        mime = 'image/jpeg' if ref.endswith('.jpg') else 'image/webp'
        page = page.replace(ref, f'data:{mime};base64,{data}')
    notices += '\n' + (assets / 'BarlowCondensed-LICENSE.txt').read_text()
    payload = f'<script id="embeddedPhysics" type="application/octet-stream">{wasm}</script>'
    page = page.replace('<noscript>', payload + f'\n<script type="text/plain" id="vendorNotices">{notices}</script>\n<noscript>', 1)

    def inline_script(match):
        source = (combat / match[1]).read_text()
        if '</script' in source.lower() or '<!--' in source:
            raise ValueError(f'Unsafe inline script boundary in {match[1]}')
        return '<script>\n' + source + '\n</script>'

    page, count = re.subn(r'<script defer src="([^"]+)"[^>]*></script>', inline_script, page)
    assert count and '<script defer src=' not in page
    for filename, mode in [('ten-seats.html', 'finale'), ('from-tray-to-thunder.html', 'story'), ('the-reflection.html', 'reflection')]:
        (OUT / filename).write_text(page.replace('<html lang="en">', f'<html lang="en" data-mode="{mode}" data-public-combat="https://wycivil08.github.io/jensen-hero/combat/">', 1))
        print('Built dist/' + filename + ' for offline desktop play')
