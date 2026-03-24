import tensorflow as tf
from tensorflow.keras.applications.mobilenet import MobileNet
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model

def convert_idealo_weights(h5_path, export_dir):
    """
    专门用于转换 idealo 提供的 mobilenet_weights.h5
    """
    # 1. 重新构建 idealo 的 NIMA 架构
    base_model = MobileNet(input_shape=(224, 224, 3), include_top=False, weights=None)
    x = GlobalAveragePooling2D()(base_model.output)
    x = Dropout(0.75)(x) # idealo 使用的是 0.75 的 dropout
    x = Dense(10, activation='softmax', name='quality_prediction')(x)
    model = Model(inputs=base_model.input, outputs=x)

    # 2. 加载权重
    print(f"Loading weights from {h5_path}...")
    model.load_weights(h5_path)

    # 3. 导出为 SavedModel (Java 专用)
    tf.saved_model.save(model, export_dir)
    print(f"Successfully exported to {export_dir}!")

if __name__ == '__main__':
    # 确保你已经把下载的 mobilenet_weights.h5 放在了当前目录
    convert_idealo_weights('weights_mobilenet_aesthetic_0.07.hdf5', 'nima_saved_model')
