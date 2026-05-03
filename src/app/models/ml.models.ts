// ─────────────────────────────────────────────────────────────────────────────
// ML Models — types for the Flask prediction API
// ─────────────────────────────────────────────────────────────────────────────

/** Raw input sent to POST /api/predict */
export interface SessionInput {
  reading_speed_wpm:          number;
  pronunciation_accuracy:     number;
  listening_score:            number;
  reading_score:              number;
  speaking_score:             number;
  engagement_level:           'Low' | 'Medium' | 'High';
  emotion_state:              'Happy' | 'Bored' | 'Confused' | 'Focused';
  content_type_displayed:     'Text' | 'Video' | 'Quiz' | 'Game';
  content_difficulty_level:   'Easy' | 'Medium' | 'Hard';
  teaching_style:             'Visual' | 'Auditory' | 'Kinesthetic' | 'Mixed';
  device_type_used:           'Laptop' | 'Tablet' | 'Smart Board' | 'AR Glass';
  eye_tracking_focus_duration: number;
  gesture_interaction_count:  number;
  adaptive_score:             number;
  student_feedback_score:     number;
  network_latency_ms:         number;
  sensor_error_rate:          number;
  teaching_experience_years:  number;
  recommendation_used:        number;
  performance_improvement_rate: number;
}

/** Single model result */
export interface ModelResult {
  prediction:  0 | 1;
  probability: number;
  label:       'Effective' | 'Ineffective';
}

/** Map of model-key → result (allows string indexing in templates) */
export interface PredictionsMap {
  random_forest:       ModelResult;
  logistic_regression: ModelResult;
  svm:                 ModelResult;
  xgboost?:            ModelResult;
  ensemble:            ModelResult;
  [key: string]:       ModelResult | undefined;   // ← index signature
}

/** Full response from POST /api/predict */
export interface PredictionResponse {
  predictions:   PredictionsMap;
  cluster_id:    number | null;
  input_summary: {
    engagement_level: string;
    emotion_state:    string;
    content_type:     string;
    difficulty:       string;
    teaching_style:   string;
  };
}

/** One model's performance metrics */
export interface ModelMetric {
  name:      string;
  accuracy:  number;
  precision: number;
  recall:    number;
  f1:        number;
  auc_roc:   number;
}

/** GET /api/metrics */
export interface MetricsResponse {
  random_forest:       ModelMetric;
  logistic_regression: ModelMetric;
  svm:                 ModelMetric;
  xgboost?:            ModelMetric;
}

/** One content/style/difficulty combination */
export interface Recommendation {
  content:        string;
  style:          string;
  difficulty:     string;
  sessions:       number;
  effectiveness:  number;
}

/** One student cluster profile */
export interface ClusterProfile {
  cluster_id:       number;
  n_students:       number;
  effectiveness:    number;
  speed_label:      string;
  dominant_emotion: string;
  pronunciation:    string;
}

/** One feature importance entry */
export interface FeatureImportance {
  feature:    string;
  importance: number;
}

/** Batch predict item */
export interface BatchResult {
  session_id:  string;
  student_id:  string;
  prediction:  0 | 1;
  probability: number;
  label:       'Effective' | 'Ineffective';
  error?:      string;
}

export interface BatchPredictResponse {
  results: BatchResult[];
  total:   number;
}
