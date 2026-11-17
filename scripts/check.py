"""Check deployment assets, local HTML links and the frozen extraction baseline."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'dist'
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href') and value:
                self.urls.append(value)

for page in SITE.rglob('*.html'):
    text = page.read_text()
    assert '/Users/' not in text and '127.0.0.1:' not in text, page
    parser = Links()
    parser.feed(text)
    for url in parser.urls:
        parts = urlsplit(url)
        if parts.scheme or parts.netloc or not parts.path:
            continue
        assert not parts.path.startswith('/'), (page, url, 'not relocatable')
        target = (page.parent / unquote(parts.path)).resolve()
        assert target.is_relative_to(SITE.resolve()), (page, url)
        assert target.exists(), (page, url)
        if target.is_dir():
            assert (target / 'index.html').is_file(), (page, url)

game = (SITE / 'game/index.html').read_text()
assert '{{JENSEN:' not in game
assert 'jensen_r7_career_v1' in game
for name in set(re.findall(r'assets/([\w.-]+\.(?:jpg|png|webp))', game)):
    assert (SITE / 'game/assets' / name).is_file(), name
for name in ('interface.mp3', 'battle.mp3'):
    assert (SITE / 'warrior/audio' / name).stat().st_size > 0
manifest = json.loads((ROOT / 'docs/baseline.json').read_text())
for row in manifest['files']:
    p = ROOT / row['path']
    assert p.is_file() and not p.is_symlink(), p
    assert hashlib.sha256(p.read_bytes()).hexdigest() == row['sha256'], row['path']
assert len(list((SITE / 'combat/vendor').glob('*.wasm'))) == 1
print('PASS baseline hashes, portable local links, player image/save key and warrior audio')
