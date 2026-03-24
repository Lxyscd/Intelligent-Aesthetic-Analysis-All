import tensorflow as tf

def export_to_saved_model(h5_path, export_dir):
    """
    将 H5 模型转换为 TensorFlow SavedModel 格式，方便 Java 调用。
    """
    # 加载模型，需要传入自定义损失函数
    from model import earth_mover_distance
    model = tf.keras.models.load_model(h5_path, custom_objects={'earth_mover_distance': earth_mover_distance})
    
    # 导出
    tf.saved_model.save(model, export_dir)
    print(f"Model exported to {export_dir} for Java deployment.")

if __name__ == '__main__':
    export_to_saved_model('best_nima_model.h5', 'nima_saved_model')
