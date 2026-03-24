export interface AnalysisResult {
  composition: string;
  lighting: string;
  color: string;
  overall: string;
  suggestions: string[];
  nimaScore?: number;
  id?: number;
  exif?: ExifData;
  recommended_crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
    reason: string;
  };
  cv_metrics?: {
    avg_r: number;
    avg_g: number;
    avg_b: number;
    composition_energy: number;
    aspect_ratio: number;
  };
  subject_analysis?: {
    subject_found: boolean;
    subject_name?: string;
    subject_description?: string;
    exposure_suggestions?: string[];
    engagement_suggestions?: string[];
  };
  estimated_exif?: {
    fNumber?: string;
    exposureTime?: string;
    iso?: string;
    focalLength?: string;
  };
}

export interface Post {
  id: number;
  user: { username: string };
  analysisHistory: {
    imageUrl: string;
    nimaScore: number;
    analysisResult: string;
  };
  title: string;
  description: string;
  likesCount: number;
  comments: { id: number; user: { username: string }; content: string; createdAt: string }[];
  createdAt: string;
}

export interface HistoryItem {
  id: number;
  imageUrl: string;
  analysisResult: string;
  nimaScore?: number;
  createdAt: string;
}

export interface User {
  username: string;
  token: string;
}

export interface ExifData {
  make?: string;
  model?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: string;
  focalLength?: string;
  dateTime?: string;
}
