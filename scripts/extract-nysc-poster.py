from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/NYSC/public/NYSC.gif')
target = Path('/home/ubuntu/NYSC/public/NYSC-poster.png')
with Image.open(source) as image:
    image.seek(0)
    frame = image.convert('RGBA')
    frame.save(target, optimize=True)
print(target)
