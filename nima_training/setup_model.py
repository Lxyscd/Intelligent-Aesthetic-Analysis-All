import os
import tensorflow as tf
from tensorflow.keras.applications.mobilenet import MobileNet
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model

def setup():
    # 预期的文件名
    local_h5 = "weights_mobilenet_aesthetic_0.07.hdf5"
    export_dir = "nima_saved_model"

    print("="*50)
    print("NIMA 模型本地转换工具")
    print("="*50)
    print(f"当前工作目录: {os.getcwd()}")
    print(f"正在寻找文件: {local_h5}")

    # 1. 构建模型结构
    print("\n[1/2] 正在构建模型结构...")
    base_model = MobileNet(input_shape=(224, 224, 3), include_top=False, weights=None)
    x = GlobalAveragePooling2D()(base_model.output)
    x = Dropout(0.75)(x)
    x = Dense(10, activation='softmax', name='quality_prediction')(x)
    model = Model(inputs=base_model.input, outputs=x)

    # 2. 加载本地权重
    print("\n[2/2] 正在加载本地权重...")
    if os.path.exists(local_h5):
        try:
            model.load_weights(local_h5)
            print(f"✅ 成功加载本地权重: {local_h5}")
            
            # 3. 导出为 Java 格式
            print("\n正在导出为 Java 格式 (SavedModel)...")
            if os.path.exists(export_dir):
                import shutil
                shutil.rmtree(export_dir)
            
            tf.saved_model.save(model, export_dir)
            
            print("\n" + "="*50)
            print(f"🎉 转换成功！")
            print(f"请将生成的 '{export_dir}' 文件夹复制到 Java 项目根目录下。")
            print("="*50)
        except Exception as e:
            print(f"❌ 加载权重失败: {e}")
            print("请检查文件是否完整或损坏。")
    else:
        print(f"❌ 错误: 未在当前目录下找到 {local_h5}")
        print(f"请将您下载好的文件移动到: {os.getcwd()}")

if __name__ == '__main__':
    setup()
