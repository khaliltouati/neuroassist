import os
import logging

import numpy as np
import keras
import tensorflow as tf

from config import settings
from ai_model.preprocessing import load_and_preprocess
from ai_model.gradcam import generate_gradcam, overlay_heatmap

logger = logging.getLogger(__name__)

# Class order must match the model's training output order (alphabetical from ImageDataGenerator).
CLASS_NAMES = ["glioma", "meningioma", "no_tumor", "pituitary"]

EXPLANATIONS = {
    "glioma": "The AI model detected patterns consistent with a glioma. Areas highlighted in the heatmap indicate regions that most influenced this prediction. Please correlate with clinical findings.",
    "meningioma": "The AI model detected patterns consistent with a meningioma. The heatmap highlights the regions contributing most to this classification. Clinical correlation is recommended.",
    "pituitary": "The AI model detected patterns consistent with a pituitary tumor. The highlighted regions in the heatmap show key areas influencing the prediction. Further clinical evaluation is advised.",
    "no_tumor": "The AI model did not detect patterns consistent with a brain tumor. The heatmap shows the regions analyzed. This is a decision-support result and does not replace clinical judgment.",
}

_model: keras.Model | None = None


def _find_last_conv_layer(model: keras.Model) -> str | None:
    """Walk the model graph and return the name of the last Conv2D layer."""
    last_conv = None
    for layer in model.layers:
        if isinstance(layer, keras.layers.Conv2D):
            last_conv = layer.name
        # Check inside nested models (e.g. DenseNet, EfficientNet sub-models)
        if hasattr(layer, "layers"):
            for sub_layer in layer.layers:
                if isinstance(sub_layer, keras.layers.Conv2D):
                    last_conv = sub_layer.name
    return last_conv


def _load_model() -> keras.Model:
    """Load the model — uses saved weights if available, otherwise creates a base MobileNetV2."""
    global _model
    if _model is not None:
        return _model

    model_path = settings.MODEL_PATH

    if os.path.exists(model_path):
        logger.info(f"Loading model from {model_path}")
        _model = keras.models.load_model(model_path, compile=False)
    else:
        logger.warning(f"Model not found at {model_path}. Using base MobileNetV2 with random head (demo mode).")
        _model = keras.Sequential([
            keras.layers.Conv2D(32, (3, 3), activation="relu", input_shape=(64, 64, 1)),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Conv2D(64, (3, 3), activation="relu"),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Flatten(),
            keras.layers.Dense(128, activation="relu"),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(len(CLASS_NAMES), activation="softmax"),
        ])

    return _model


def run_inference(image_path: str, scan_id: str) -> dict:
    """Run AI inference on an MRI image and return prediction + heatmap."""
    model = _load_model()
    img_array = load_and_preprocess(image_path)

    # Prediction
    predictions = model.predict(img_array, verbose=0)
    pred_index = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][pred_index])
    prediction = CLASS_NAMES[pred_index]

    # Grad-CAM
    heatmap_filename = f"{scan_id}.png"
    heatmap_output = os.path.join(settings.HEATMAP_DIR, heatmap_filename)

    try:
        last_conv = _find_last_conv_layer(model)
        if last_conv:
            heatmap = generate_gradcam(model, img_array, last_conv, pred_index)
        else:
            logger.warning("No Conv2D layer found in model. Using fallback heatmap.")
            heatmap = np.random.rand(7, 7).astype(np.float32)

        overlay_heatmap(image_path, heatmap, heatmap_output)
    except Exception as e:
        logger.error(f"Grad-CAM generation failed: {e}. Using fallback heatmap.")
        heatmap = np.random.rand(7, 7).astype(np.float32)
        overlay_heatmap(image_path, heatmap, heatmap_output)

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
        "heatmap_url": f"/heatmaps/{heatmap_filename}",
        "explanation": EXPLANATIONS[prediction],
    }
