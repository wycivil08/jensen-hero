"""Build a relocatable static site from the four maintained source directories."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
for name in ('art', 'combat', 'warrior'):
    shutil.copytree(ROOT / name, OUT / name)
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
shutil.copytree(game / 'assets', OUT / 'game/assets')
shutil.copy2(ROOT / 'index.html', OUT / 'index.html')
(OUT / '.nojekyll').touch()
# Keep the existing public lab bookmark while the source has one canonical name.
(OUT / 'cozy').mkdir()
(OUT / 'cozy/index.html').write_text('<!doctype html><meta charset="utf-8"><title>Combat lab</title><script>location.replace("../combat/"+location.search+location.hash)</script><a href="../combat/">Open combat lab</a>')
print('Built dist/: art, combat, player prototype and warrior reference')
