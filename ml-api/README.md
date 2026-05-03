# ML API — Adaptive English Learning

## Setup

```bash
cd ml-api
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## Placer le dataset

Copier le fichier CSV dans `ml-api/` :
```
ml-api/adaptive-english-learning-dataset-2024-fixed.csv
```

Ou définir la variable d'environnement :
```bash
set DATA_PATH=C:\chemin\vers\le\fichier.csv   # Windows
export DATA_PATH=/chemin/vers/le/fichier.csv  # Linux/Mac
```

## Lancer le serveur

```bash
python app.py
```

Le serveur démarre sur **http://localhost:5000**

## Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /health | Statut du serveur |
| GET | /api/metrics | Métriques des modèles |
| GET | /api/recommendations | Top 10 configurations |
| GET | /api/clusters | Profils d'étudiants |
| GET | /api/feature-importance | Importance des features |
| POST | /api/predict | Prédiction pour une session |
| POST | /api/batch-predict | Prédictions en lot |

## Exemple POST /api/predict

```json
{
  "reading_speed_wpm": 110,
  "pronunciation_accuracy": 85,
  "listening_score": 75,
  "reading_score": 80,
  "speaking_score": 70,
  "engagement_level": "High",
  "emotion_state": "Happy",
  "content_type_displayed": "Video",
  "content_difficulty_level": "Medium",
  "teaching_style": "Visual",
  "device_type_used": "Laptop",
  "eye_tracking_focus_duration": 300,
  "gesture_interaction_count": 10,
  "adaptive_score": 75,
  "student_feedback_score": 4.2,
  "network_latency_ms": 45,
  "sensor_error_rate": 0.5,
  "teaching_experience_years": 8,
  "recommendation_used": 1,
  "performance_improvement_rate": 10
}
```
