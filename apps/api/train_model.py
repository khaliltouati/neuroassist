"""
Train a MobileNetV2 brain tumor classifier on the Kaggle Brain Tumor MRI Dataset.

Dataset: https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset

Setup:
  1. Download & extract the dataset so the folder structure looks like:
     data/
       Training/
         glioma/
         meningioma/
         notumor/
         pituitary/
       Testing/
         glioma/
         meningioma/
         notumor/
         pituitary/

  2. pip install tensorflow Pillow matplotlib

  3. python train_model.py

Output: ai_model/weights/model.h5
"""

import os
import tensorflow as tf
from tensorflow.keras import layers, callbacks

# ── Config ──────────────────────────────────────────────

DATA_DIR = "data"                       # Path to extracted dataset
TRAIN_DIR = os.path.join(DATA_DIR, "Training")
TEST_DIR = os.path.join(DATA_DIR, "Testing")
OUTPUT_PATH = "ai_model/weights/model.h5"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 15
LEARNING_RATE = 1e-4

# Must match the order in inference.py: ["glioma", "meningioma", "no_tumor", "pituitary"]
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]


def main():
    print("Loading training data...")
    train_ds = tf.keras.utils.image_dataset_from_directory(
        TRAIN_DIR,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        class_names=CLASS_NAMES,
        shuffle=True,
        seed=42,
    )

    print("Loading test data...")
    test_ds = tf.keras.utils.image_dataset_from_directory(
        TEST_DIR,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        class_names=CLASS_NAMES,
        shuffle=False,
    )

    # Normalize pixels to [0, 1]
    normalize = layers.Rescaling(1.0 / 255)
    train_ds = train_ds.map(lambda x, y: (normalize(x), y))
    test_ds = test_ds.map(lambda x, y: (normalize(x), y))

    # Prefetch for performance
    train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
    test_ds = test_ds.prefetch(tf.data.AUTOTUNE)

    # ── Data augmentation ───────────────────────────────
    augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.1),
        layers.RandomContrast(0.1),
    ])

    # ── Model ───────────────────────────────────────────
    print("Building model...")
    base_model = tf.keras.applications.MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(224, 224, 3),
    )
    base_model.trainable = False  # Freeze backbone initially

    model = tf.keras.Sequential([
        layers.Input(shape=(224, 224, 3)),
        augmentation,
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(len(CLASS_NAMES), activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    # ── Phase 1: Train head only ────────────────────────
    print("\n=== Phase 1: Training classification head (backbone frozen) ===")
    model.fit(
        train_ds,
        validation_data=test_ds,
        epochs=5,
        callbacks=[
            callbacks.EarlyStopping(patience=3, restore_best_weights=True),
        ],
    )

    # ── Phase 2: Fine-tune top layers of backbone ───────
    print("\n=== Phase 2: Fine-tuning top backbone layers ===")
    base_model.trainable = True
    # Freeze all layers except the last 30
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE / 10),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.fit(
        train_ds,
        validation_data=test_ds,
        epochs=EPOCHS,
        callbacks=[
            callbacks.EarlyStopping(patience=5, restore_best_weights=True),
            callbacks.ReduceLROnPlateau(factor=0.5, patience=2, min_lr=1e-7),
        ],
    )

    # ── Evaluate ────────────────────────────────────────
    print("\n=== Final Evaluation ===")
    loss, accuracy = model.evaluate(test_ds)
    print(f"Test Loss: {loss:.4f}")
    print(f"Test Accuracy: {accuracy:.4f}")

    # ── Save ────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    model.save(OUTPUT_PATH)
    print(f"\nModel saved to {OUTPUT_PATH}")
    print("You can now start the API and it will load this model automatically.")


if __name__ == "__main__":
    main()
