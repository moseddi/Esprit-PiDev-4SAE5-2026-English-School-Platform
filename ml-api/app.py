"""
Flask API — Adaptive English Learning ML Model
Endpoints:
  GET  /health
  GET  /api/metrics
  GET  /api/recommendations
  GET  /api/clusters
  GET  /api/feature-importance
  POST /api/predict          { session fields }
  POST /api/batch-predict    { "sessions": [...] }
"""

import os, warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.cluster import KMeans
from sklearn.preprocessing import RobustScaler
from sklearn.model_selection import train_test_split
from sklearn.utils import resample
from sklearn.metrics import (accuracy_score, precision_score,
                              recall_score, f1_score, roc_auc_score,
                              silhouette_score)

try:
    from xgboost import XGBClassifier
    XGBOOST_OK = True
except ImportError:
    XGBOOST_OK = False

app = Flask(__name__)
CORS(app)

# ── globals ──────────────────────────────────────────────────────────────────
rf_model      = None
lr_model      = None
svm_model     = None
xgb_model     = None
kmeans_model  = None
feature_cols  = []
cluster_feats = []
model_metrics = {}
recommendations = []
cluster_profiles = []

DATA_PATH = os.environ.get(
    "DATA_PATH",
    "adaptive-english-learning-dataset-2024-fixed.csv"
)

# ── preprocessing (mirrors the notebook exactly) ─────────────────────────────
def prepare_data():
    df = pd.read_csv(DATA_PATH)

    enc = df.copy()

    # engagement → one-hot
    eng_dum = pd.get_dummies(enc['engagement_level'], prefix='engagement')
    enc = pd.concat([enc, eng_dum], axis=1)

    # difficulty → ordinal
    enc['content_difficulty_encoded'] = enc['content_difficulty_level'].map(
        {'Easy': 0, 'Medium': 1, 'Hard': 2})

    # other categoricals → one-hot
    for col in ['emotion_state', 'teaching_style',
                'device_type_used', 'content_type_displayed']:
        enc = pd.concat([enc, pd.get_dummies(enc[col], prefix=col)], axis=1)

    # RobustScaler on all numeric except target/ids
    exclude = {'personalized_content_effectiveness', 'student_id',
               'teacher_id', 'session_id', 'recommendation_used',
               'real_time_adjustments_made'}
    num_cols = [c for c in enc.select_dtypes(include=[np.number]).columns
                if c not in exclude]
    sc = RobustScaler()
    scaled = enc.copy()
    scaled[num_cols] = sc.fit_transform(enc[num_cols])

    # build X / y
    drop = ['student_id', 'teacher_id', 'session_id', 'timestamp',
            'engagement_level', 'emotion_state', 'teaching_style',
            'device_type_used', 'content_type_displayed',
            'content_difficulty_level',
            'personalized_content_effectiveness']
    X = scaled.drop(columns=drop, errors='ignore')
    y = scaled['personalized_content_effectiveness']

    return df, scaled, X, y, sc


def compute_recommendations(X, y):
    content_cols = [c for c in X.columns if c.startswith('content_type_displayed_')]
    style_cols   = [c for c in X.columns if c.startswith('teaching_style_')]
    diff_vals    = sorted(X['content_difficulty_encoded'].unique())
    diff_map     = {diff_vals[0]: 'Easy', diff_vals[1]: 'Medium', diff_vals[2]: 'Hard'}

    combos = []
    for cc in content_cols:
        for sc in style_cols:
            for dv in diff_vals:
                mask = (X[cc] == 1) & (X[sc] == 1) & (X['content_difficulty_encoded'] == dv)
                n = int(mask.sum())
                if n >= 10:
                    eff = float(y[mask].mean() * 100)
                    combos.append({
                        'content':        cc.replace('content_type_displayed_', ''),
                        'style':          sc.replace('teaching_style_', ''),
                        'difficulty':     diff_map[dv],
                        'sessions':       n,
                        'effectiveness':  round(eff, 1)
                    })
    combos.sort(key=lambda x: x['effectiveness'], reverse=True)
    return combos[:10]


def build_cluster_profiles(X, y, labels, n_clusters):
    profiles = []
    emotion_cols = [c for c in X.columns if c.startswith('emotion_state_')]

    for i in range(n_clusters):
        mask = labels == i
        n_st = int(mask.sum())
        eff  = round(float(y[mask].mean() * 100), 1)

        # dominant emotion
        dom_emotion = 'N/A'
        ec = [c for c in emotion_cols if c in X.columns]
        if ec:
            dom_emotion = X[ec][mask].mean().idxmax().replace('emotion_state_', '')

        # reading speed
        rs = float(X['reading_speed_wpm'][mask].mean()) if 'reading_speed_wpm' in X.columns else 0
        speed = 'Fast reader' if rs > 0.5 else ('Slow reader' if rs < -0.5 else 'Average reader')

        # pronunciation
        pa = float(X['pronunciation_accuracy'][mask].mean()) if 'pronunciation_accuracy' in X.columns else 0
        pron = 'Good' if pa > 0.3 else ('Average' if pa > -0.3 else 'Weak')

        profiles.append({
            'cluster_id':       i,
            'n_students':       n_st,
            'effectiveness':    eff,
            'speed_label':      speed,
            'dominant_emotion': dom_emotion,
            'pronunciation':    pron
        })
    return profiles


def _metrics(name, model, Xt, yt):
    yp  = model.predict(Xt)
    ypr = model.predict_proba(Xt)[:, 1]
    return {
        'name':      name,
        'accuracy':  round(float(accuracy_score(yt, yp)),  3),
        'precision': round(float(precision_score(yt, yp)), 3),
        'recall':    round(float(recall_score(yt, yp)),    3),
        'f1':        round(float(f1_score(yt, yp)),        3),
        'auc_roc':   round(float(roc_auc_score(yt, ypr)),  3)
    }


def train_all():
    global rf_model, lr_model, svm_model, xgb_model, kmeans_model
    global feature_cols, cluster_feats, model_metrics, recommendations, cluster_profiles

    print("📂 Loading data …")
    df, scaled, X, y, sc = prepare_data()
    feature_cols = list(X.columns)

    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2,
                                           random_state=42, stratify=y)

    # ── Random Forest ────────────────────────────────────────────────────────
    print("🌲 Training Random Forest …")
    rf_model = RandomForestClassifier(
        n_estimators=100, class_weight='balanced',
        max_depth=5, min_samples_split=50, min_samples_leaf=20,
        random_state=42, n_jobs=-1)
    rf_model.fit(Xtr, ytr)

    # ── Logistic Regression ──────────────────────────────────────────────────
    print("📈 Training Logistic Regression …")
    lr_model = LogisticRegression(class_weight='balanced',
                                  max_iter=1000, random_state=42)
    lr_model.fit(Xtr, ytr)

    # ── SVM (balanced undersampling) ─────────────────────────────────────────
    print("🔷 Training SVM …")
    X0 = Xtr[ytr == 0]; X1 = Xtr[ytr == 1]
    X0b = resample(X0, replace=False, n_samples=len(X1) * 2, random_state=42)
    Xbal = pd.concat([X0b, X1])
    ybal = pd.Series([0] * len(X0b) + [1] * len(X1))
    svm_model = SVC(kernel='rbf', C=1.0, gamma='scale',
                    class_weight='balanced', probability=True, random_state=42)
    svm_model.fit(Xbal, ybal)

    # ── XGBoost ──────────────────────────────────────────────────────────────
    if XGBOOST_OK:
        print("⚡ Training XGBoost …")
        spw = float((ytr == 0).sum()) / max(float((ytr == 1).sum()), 1)
        xgb_model = XGBClassifier(
            n_estimators=100, max_depth=6, learning_rate=0.1,
            subsample=0.8, colsample_bytree=0.8,
            scale_pos_weight=spw, random_state=42,
            use_label_encoder=False, eval_metric='logloss', verbosity=0)
        xgb_model.fit(Xtr, ytr)

    # ── Metrics ──────────────────────────────────────────────────────────────
    model_metrics = {
        'random_forest':       _metrics('Random Forest',       rf_model,  Xte, yte),
        'logistic_regression': _metrics('Logistic Regression', lr_model,  Xte, yte),
        'svm':                 _metrics('SVM',                 svm_model, Xte, yte),
    }
    if XGBOOST_OK and xgb_model:
        model_metrics['xgboost'] = _metrics('XGBoost', xgb_model, Xte, yte)

    # ── Recommendations ──────────────────────────────────────────────────────
    print("💡 Computing recommendations …")
    recommendations = compute_recommendations(X, y)

    # ── Clustering ───────────────────────────────────────────────────────────
    print("🔵 Clustering …")
    base_feats = ['reading_speed_wpm', 'pronunciation_accuracy',
                  'eye_tracking_focus_duration', 'gesture_interaction_count',
                  'adaptive_score', 'student_feedback_score',
                  'content_difficulty_encoded']
    em_cols = [c for c in X.columns if c.startswith('emotion_state_')]
    te_cols = [c for c in X.columns if c.startswith('teaching_style_')]
    ct_cols = [c for c in X.columns if c.startswith('content_type_displayed_')]
    cluster_feats = [f for f in base_feats + em_cols[:4] + te_cols[:2] + ct_cols[:2]
                     if f in X.columns]

    Xcl = X[cluster_feats]
    best_k, best_sil = 3, -1
    for k in range(2, 7):
        km  = KMeans(n_clusters=k, random_state=42, n_init=10)
        lbl = km.fit_predict(Xcl)
        sil = silhouette_score(Xcl, lbl)
        if sil > best_sil:
            best_sil, best_k = sil, k

    kmeans_model = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    labels = kmeans_model.fit_predict(Xcl)
    cluster_profiles = build_cluster_profiles(X, y, labels, best_k)

    print(f"✅ Done — best k={best_k}, silhouette={best_sil:.3f}")


# ── feature vector builder ────────────────────────────────────────────────────
def build_vector(data: dict) -> pd.DataFrame:
    row = {c: 0.0 for c in feature_cols}

    # numeric fields
    for f in ['reading_speed_wpm', 'pronunciation_accuracy', 'listening_score',
              'reading_score', 'speaking_score', 'eye_tracking_focus_duration',
              'gesture_interaction_count', 'adaptive_score', 'student_feedback_score',
              'real_time_adjustments_made', 'performance_improvement_rate',
              'network_latency_ms', 'sensor_error_rate', 'teaching_experience_years',
              'recommendation_used']:
        if f in data and f in row:
            row[f] = float(data[f])

    # engagement → one-hot
    eng = data.get('engagement_level', 'Medium')
    for lvl in ['High', 'Low', 'Medium']:
        k = f'engagement_{lvl}'
        if k in row:
            row[k] = 1.0 if eng == lvl else 0.0

    # difficulty → ordinal
    if 'content_difficulty_encoded' in row:
        row['content_difficulty_encoded'] = float(
            {'Easy': 0, 'Medium': 1, 'Hard': 2}.get(
                data.get('content_difficulty_level', 'Medium'), 1))

    # one-hot categoricals
    for prefix, field in [
        ('emotion_state_',          'emotion_state'),
        ('teaching_style_',         'teaching_style'),
        ('device_type_used_',       'device_type_used'),
        ('content_type_displayed_', 'content_type_displayed'),
    ]:
        val = data.get(field, '')
        for c in feature_cols:
            if c.startswith(prefix):
                row[c] = 1.0 if c == f'{prefix}{val}' else 0.0

    return pd.DataFrame([row])[feature_cols]


# ── routes ────────────────────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'models_loaded': rf_model is not None,
                    'xgboost_available': XGBOOST_OK})


@app.route('/api/metrics')
def get_metrics():
    return jsonify(model_metrics)


@app.route('/api/recommendations')
def get_recommendations():
    return jsonify(recommendations)


@app.route('/api/clusters')
def get_clusters():
    return jsonify(cluster_profiles)


@app.route('/api/feature-importance')
def get_feature_importance():
    if rf_model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    fi = (pd.DataFrame({'feature': feature_cols,
                         'importance': rf_model.feature_importances_})
            .sort_values('importance', ascending=False)
            .head(15))
    return jsonify(fi.to_dict(orient='records'))


@app.route('/api/predict', methods=['POST'])
def predict():
    if rf_model is None:
        return jsonify({'error': 'Models not loaded'}), 503

    data = request.get_json(force=True) or {}
    try:
        Xi = build_vector(data)

        def pred(m):
            p = int(m.predict(Xi)[0])
            pr = round(float(m.predict_proba(Xi)[0][1]), 4)
            return {'prediction': p, 'probability': pr,
                    'label': 'Effective' if p == 1 else 'Ineffective'}

        results = {
            'random_forest':       pred(rf_model),
            'logistic_regression': pred(lr_model),
            'svm':                 pred(svm_model),
        }
        if XGBOOST_OK and xgb_model:
            results['xgboost'] = pred(xgb_model)

        # ensemble majority vote
        votes  = [v['prediction'] for v in results.values()]
        probas = [v['probability'] for v in results.values()]
        ens_p  = 1 if sum(votes) > len(votes) / 2 else 0
        results['ensemble'] = {
            'prediction': ens_p,
            'probability': round(float(np.mean(probas)), 4),
            'label': 'Effective' if ens_p == 1 else 'Ineffective'
        }

        # cluster
        cluster_id = None
        if kmeans_model and cluster_feats:
            cf_row = Xi[[f for f in cluster_feats if f in Xi.columns]].copy()
            for f in cluster_feats:
                if f not in cf_row.columns:
                    cf_row[f] = 0.0
            cluster_id = int(kmeans_model.predict(cf_row[cluster_feats])[0])

        return jsonify({
            'predictions': results,
            'cluster_id':  cluster_id,
            'input_summary': {
                'engagement_level': data.get('engagement_level'),
                'emotion_state':    data.get('emotion_state'),
                'content_type':     data.get('content_type_displayed'),
                'difficulty':       data.get('content_difficulty_level'),
                'teaching_style':   data.get('teaching_style'),
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    if rf_model is None:
        return jsonify({'error': 'Models not loaded'}), 503

    sessions = (request.get_json(force=True) or {}).get('sessions', [])
    if not sessions:
        return jsonify({'error': 'No sessions provided'}), 400

    out = []
    for s in sessions:
        try:
            Xi  = build_vector(s)
            p   = int(rf_model.predict(Xi)[0])
            pr  = round(float(rf_model.predict_proba(Xi)[0][1]), 4)
            out.append({'session_id': s.get('session_id', ''),
                        'student_id': s.get('student_id', ''),
                        'prediction': p, 'probability': pr,
                        'label': 'Effective' if p == 1 else 'Ineffective'})
        except Exception as e:
            out.append({'error': str(e), 'session_id': s.get('session_id', '')})

    return jsonify({'results': out, 'total': len(out)})


if __name__ == '__main__':
    train_all()
    app.run(host='0.0.0.0', port=5000, debug=False)
