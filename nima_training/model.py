import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.applications import MobileNetV2

def build_nima_model(input_shape=(224, 224, 3)):
    """
    构建 NIMA 模型。使用 MobileNetV2 作为特征提取器。
    最后输出 10 个维度的向量，代表 1-10 分的概率分布。
    """
    base_model = MobileNetV2(input_shape=input_shape, include_top=False, weights='imagenet')
    
    x = GlobalAveragePooling2D()(base_model.output)
    x = Dropout(0.5)(x)
    # NIMA 预测 1-10 分的分布，所以输出维度为 10
    outputs = Dense(10, activation='softmax', name='quality_prediction')(x)
    
    model = Model(inputs=base_model.input, outputs=outputs)
    return model

def earth_mover_distance(y_true, y_pred):
    """
    NIMA 专用的损失函数：推土机距离 (EMD)。
    它惩罚预测分布与真实分布之间的累积差异。
    """
    cdf_true = tf.cumsum(y_true, axis=-1)
    cdf_pred = tf.cumsum(y_pred, axis=-1)
    samplewise_emd = tf.sqrt(tf.reduce_mean(tf.square(cdf_true - cdf_pred), axis=-1))
    return tf.reduce_mean(samplewise_emd)

def calculate_mean_score(score_dist):
    """
    根据 10 维分布计算平均分 (1-10)。
    """
    weights = tf.range(1, 11, dtype=tf.float32)
    return tf.reduce_sum(score_dist * weights, axis=-1)
