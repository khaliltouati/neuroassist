import numpy as np
import cv2
import tensorflow as tf
import keras


def generate_gradcam(model: keras.Model, img_array: np.ndarray, last_conv_layer_name: str, pred_index: int) -> np.ndarray:
    """Generate Grad-CAM heatmap for the predicted class."""
    grad_model = keras.models.Model(
        inputs=model.input,
        outputs=[model.get_layer(last_conv_layer_name).output, model.output],
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        loss = predictions[:, pred_index]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)

    return heatmap.numpy()


def overlay_heatmap(image_path: str, heatmap: np.ndarray, output_path: str, alpha: float = 0.4) -> str:
    """Overlay Grad-CAM heatmap on the original image and save."""
    img = cv2.imread(image_path)
    img = cv2.resize(img, (64, 64))

    heatmap_resized = cv2.resize(heatmap, (64, 64))
    heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)

    overlay = cv2.addWeighted(img, 1 - alpha, heatmap_colored, alpha, 0)
    cv2.imwrite(output_path, overlay)

    return output_path
