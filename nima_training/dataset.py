import tensorflow as tf
import pandas as pd
import os

def load_dataset(csv_path, img_dir, batch_size=32, target_size=(224, 224)):
    """
    假设 CSV 格式: image_id, score_1, score_2, ..., score_10
    """
    df = pd.read_csv(csv_path)
    
    def process_path(file_id):
        return os.path.join(img_dir, f"{file_id}.jpg")

    file_paths = df['image_id'].apply(process_path).values
    # 提取 10 个分数的列并归一化为概率分布
    labels = df.iloc[:, 1:11].values.astype('float32')
    labels /= labels.sum(axis=1, keepdims=True)

    def parse_function(filename, label):
        image_string = tf.io.read_file(filename)
        image = tf.image.decode_jpeg(image_string, channels=3)
        image = tf.image.resize(image, target_size)
        image = tf.image.convert_image_dtype(image, tf.float32)
        # MobileNetV2 预处理: 缩放到 [-1, 1]
        image = (image / 127.5) - 1.0
        return image, label

    dataset = tf.data.Dataset.from_tensor_slices((file_paths, labels))
    dataset = dataset.shuffle(len(file_paths))
    dataset = dataset.map(parse_function, num_parallel_calls=tf.data.AUTOTUNE)
    dataset = dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)
    
    return dataset
