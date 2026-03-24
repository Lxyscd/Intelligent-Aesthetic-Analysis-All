import pandas as pd
import numpy as np

def convert_ava_to_csv(txt_path, output_csv):
    """
    将 AVA.txt 转换为训练所需的 CSV 格式。
    AVA.txt 格式: Index, Image_ID, Score1, Score2, ..., Score10, Tag1, Tag2, Tag3
    """
    print("Reading AVA.txt...")
    # AVA.txt 通常是以空格分隔的
    df = pd.read_csv(txt_path, sep=' ', header=None)
    
    # 我们只需要 Image_ID (第1列) 和 10个分数 (第2-11列)
    # 注意：Image_ID 在 AVA.txt 中是第二列，索引为 1
    image_ids = df.iloc[:, 1]
    scores = df.iloc[:, 2:12]
    
    # 创建新的 DataFrame
    new_df = pd.DataFrame()
    new_df['image_id'] = image_ids
    
    # 添加分数并归一化 (让每行总和为 1)
    score_array = scores.values.astype('float32')
    row_sums = score_array.sum(axis=1, keepdims=True)
    normalized_scores = score_array / row_sums
    
    for i in range(10):
        new_df[f'score_{i+1}'] = normalized_scores[:, i]
    
    new_df.to_csv(output_csv, index=False)
    print(f"Successfully created {output_csv} with {len(new_df)} samples.")

if __name__ == '__main__':
    # 修改为你的 AVA.txt 路径
    convert_ava_to_csv('AVA.txt', 'labels.csv')
