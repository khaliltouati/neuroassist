import numpy as np
from PIL import Image

IMG_SIZE = (64, 64)


def load_and_preprocess(image_path: str) -> np.ndarray:
    """Load an image, resize to 64x64 grayscale, normalize to [0,1]."""
    img = Image.open(image_path).convert("L")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr.reshape(1, 64, 64, 1)  # (1, 64, 64, 1)
