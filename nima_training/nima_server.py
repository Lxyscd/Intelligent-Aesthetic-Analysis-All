import os
import base64
import io
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from PIL import Image

app = Flask(__name__)

# 1. 加载模型
MODEL_PATH = "nima_saved_model"
print(f"正在加载模型: {MODEL_PATH}...")
try:
    model = tf.saved_model.load(MODEL_PATH)
    infer = model.signatures["serving_default"]
    print("✅ NIMA 模型加载成功！服务运行在 http://localhost:5001")
except Exception as e:
    print(f"❌ 模型加载失败: {e}")


def preprocess_image(image_bytes):
    try:
        # 预处理逻辑必须与训练时一致
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img).astype('float32')
        # MobileNet 预处理: 归一化到 [-1, 1]
        img_array = (img_array / 127.5) - 1.0
        return np.expand_dims(img_array, axis=0)
    except Exception as e:
        print(f"预处理图片失败: {e}")
        raise e


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        base64_str = data.get('image')
        if not base64_str:
            return jsonify({'error': 'No image data'}), 400

        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        image_bytes = base64.b64decode(base64_str)
        input_data = preprocess_image(image_bytes)

        # 执行推理
        input_tensor = tf.convert_to_tensor(input_data)
        # 注意：这里的输入名必须与模型导出的签名一致
        # 根据错误提示，模型期望的输入名是 'inputs'
        output = infer(inputs=input_tensor)

        # 获取预测概率数组 [1, 10]
        # output 是一个字典，通常包含 'output_0' 或类似键
        predictions = output[list(output.keys())[0]].numpy()[0]

        # 计算平均得分 (1-10 分的加权平均)
        score = np.sum(predictions * np.arange(1, 11))

        return jsonify({'score': float(score)})
    except Exception as e:
        print(f"推理出错: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # 运行服务
    app.run(host='0.0.0.0', port=5001)
