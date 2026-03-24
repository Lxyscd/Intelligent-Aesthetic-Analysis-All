import tensorflow as tf
from model import build_nima_model, earth_mover_distance
from dataset import load_dataset
import os

# 配置
IMG_DIR = 'path/to/your/images'
CSV_PATH = 'path/to/your/labels.csv'
EPOCHS = 20
BATCH_SIZE = 32
MODEL_SAVE_PATH = 'nima_mobilenetv2.h5'

def train():
    # 1. 加载数据
    print("Loading dataset...")
    train_ds = load_dataset(CSV_PATH, IMG_DIR, batch_size=BATCH_SIZE)

    # 2. 构建模型
    print("Building model...")
    model = build_nima_model()
    
    # 3. 编译
    # 使用较小的学习率进行微调
    optimizer = tf.keras.optimizers.Adam(learning_rate=1e-4)
    model.compile(optimizer=optimizer, loss=earth_mover_distance)

    # 4. 训练
    print("Starting training...")
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint('best_nima_model.h5', save_best_only=True, monitor='loss'),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='loss', factor=0.5, patience=3)
    ]
    
    model.fit(train_ds, epochs=EPOCHS, callbacks=callbacks)
    
    # 5. 保存
    model.save(MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == '__main__':
    # 如果您有 GPU，请确保配置正确
    train()
