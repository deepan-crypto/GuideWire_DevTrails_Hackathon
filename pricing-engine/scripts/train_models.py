"""
Master training script — trains all three models with detailed progress output.

Usage:
    python scripts/train_models.py
    python scripts/train_models.py --data data/synthetic/claims_dataset.parquet
"""

import json
import sys
import time
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    log_loss,
    matthews_corrcoef,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

try:
    from xgboost import XGBClassifier
    HAS_GPU = True
    try:
        # Test if GPU is available
        test_model = XGBClassifier(tree_method="gpu_hist", n_estimators=1, verbosity=0)
        test_model.fit(np.array([[1, 2], [3, 4]]), np.array([0, 1]))
        GPU_METHOD = "gpu_hist"
    except Exception:
        GPU_METHOD = "hist"
        HAS_GPU = False
except ImportError:
    HAS_GPU = False
    GPU_METHOD = "hist"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from training.preprocessor import load_and_split
from data.generators.constants import FEATURE_NAMES


def _progress_bar(current: int, total: int, width: int = 30, prefix: str = "") -> str:
    pct = current / max(total, 1)
    filled = int(width * pct)
    bar = "█" * filled + "░" * (width - filled)
    return f"  {prefix} |{bar}| {pct*100:5.1f}%"


def _print_metrics(y_true, y_pred, y_prob, model_name: str):
    """Print and compute comprehensive classification metrics."""
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    mcc = matthews_corrcoef(y_true, y_pred)

    try:
        auc = roc_auc_score(y_true, y_prob)
    except ValueError:
        auc = 0.0
    try:
        auc_pr = average_precision_score(y_true, y_prob)
    except ValueError:
        auc_pr = 0.0
    try:
        logloss = log_loss(y_true, y_prob)
    except ValueError:
        logloss = 0.0
    try:
        brier = brier_score_loss(y_true, y_prob)
    except ValueError:
        brier = 0.0

    # Specificity and NPV from confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.shape == (2, 2) else (0, 0, 0, 0)
    specificity = tn / max(tn + fp, 1)
    npv = tn / max(tn + fn, 1)  # Negative Predictive Value

    # Per-class classification report
    cls_report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)

    print(f"  │  ┌─ {model_name} Metrics")
    print(f"  │  │  Accuracy    : {acc:.4f}")
    print(f"  │  │  Precision   : {prec:.4f}")
    print(f"  │  │  Recall      : {rec:.4f}")
    print(f"  │  │  Specificity : {specificity:.4f}")
    print(f"  │  │  NPV         : {npv:.4f}")
    print(f"  │  │  F1-Score    : {f1:.4f}")
    print(f"  │  │  MCC         : {mcc:.4f}")
    print(f"  │  │  AUC-ROC     : {auc:.4f}")
    print(f"  │  │  AUC-PR      : {auc_pr:.4f}")
    print(f"  │  │  Log Loss    : {logloss:.4f}")
    print(f"  │  │  Brier Score : {brier:.4f}")
    print(f"  │  └─")

    print(f"  │  Confusion Matrix:")
    print(f"  │    Predicted:     0       1")
    for i, row in enumerate(cm):
        print(f"  │    Actual {i}:  {row[0]:>5}   {row[1]:>5}")
    print(f"  │  (TP={tp}, TN={tn}, FP={fp}, FN={fn})")

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "specificity": round(specificity, 4),
        "npv": round(npv, 4),
        "f1_score": round(f1, 4),
        "mcc": round(mcc, 4),
        "auc_roc": round(auc, 4),
        "auc_pr": round(auc_pr, 4),
        "log_loss": round(logloss, 4),
        "brier_score": round(brier, 4),
        "confusion_matrix": {"TP": int(tp), "TN": int(tn), "FP": int(fp), "FN": int(fn)},
        "classification_report": cls_report,
        "test_samples": int(len(y_true)),
        "positive_samples": int(int(y_true.sum())),
        "negative_samples": int(len(y_true) - int(y_true.sum())),
    }


def train_single_model(
    model_name: str,
    X_train, y_train, X_val, y_val, X_test, y_test,
    params: dict,
    calibrate: bool = True,
    calibration_method: str = "isotonic",
) -> tuple:
    """Train, calibrate, and evaluate a single model."""

    print(f"  │")
    print(f"  │  Training {model_name} model...")
    print(f"  │  Parameters: n_estimators={params.get('n_estimators')}, "
          f"max_depth={params.get('max_depth')}, lr={params.get('learning_rate')}")

    t0 = time.time()

    # Create model with early stopping
    model = XGBClassifier(**params)

    # Train with eval set for early stopping
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    train_time = time.time() - t0
    best_iter = model.best_iteration if hasattr(model, 'best_iteration') else params["n_estimators"]
    print(f"  │  ✓ Training complete in {train_time:.1f}s (best iteration: {best_iter})")

    # Calibrate
    if calibrate:
        print(f"  │  Calibrating probabilities ({calibration_method})...", end=" ", flush=True)
        t0 = time.time()

        # Create a clean estimator without early_stopping for CalibratedClassifierCV
        # (it re-fits internally via CV without eval_set, which breaks early stopping)
        cal_params = {k: v for k, v in params.items() if k != "early_stopping_rounds"}
        # Use the best iteration count from training as fixed n_estimators
        cal_params["n_estimators"] = best_iter if best_iter > 0 else cal_params.get("n_estimators", 100)
        cal_base = XGBClassifier(**cal_params)

        calibrated = CalibratedClassifierCV(cal_base, method=calibration_method, cv=3)
        calibrated.fit(X_train, y_train)
        cal_time = time.time() - t0
        print(f"✓ ({cal_time:.1f}s)")
        final_model = calibrated
    else:
        final_model = model

    # Evaluate on test set
    y_pred = final_model.predict(X_test)
    y_prob = final_model.predict_proba(X_test)[:, 1]
    metrics = _print_metrics(y_test, y_pred, y_prob, model_name)

    return final_model, model, metrics


def train_all(
    data_path: str = "data/synthetic/claims_dataset.parquet",
    output_dir: str = "models/artifacts",
    verbose: bool = True,
):
    """
    Train all three models and save artifacts.

    Produces:
    - acceptance_model.joblib
    - rejection_model.joblib
    - fraud_model.joblib
    - scaler.joblib
    - evaluation_report.json
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    start_time = time.time()
    all_metrics = {}

    if verbose:
        print()
        print(f"{'═'*64}")
        print(f"  {'GuideWire ES-AI — Model Training Pipeline':^60}")
        print(f"{'═'*64}")
        print(f"  Dataset     : {data_path}")
        print(f"  Output      : {output_path.resolve()}")
        print(f"  GPU method  : {GPU_METHOD} ({'NVIDIA GPU detected' if HAS_GPU else 'CPU fallback'})")
        print(f"{'═'*64}")
        print()

    # ══════════════════════════════════════════════════
    # STAGE 1: Load and preprocess data
    # ══════════════════════════════════════════════════
    print("┌─ STAGE 1/5: Loading and Preprocessing Data")
    print("│")

    data = load_and_split(data_path, verbose=verbose)

    X_train = data["X_train"]
    X_val = data["X_val"]
    X_test = data["X_test"]

    # Save scaler
    scaler_path = output_path / "scaler.joblib"
    joblib.dump(data["scaler"], scaler_path)
    print(f"│")
    print(f"│  ✓ Scaler saved to {scaler_path.name}")
    print(f"└─ Stage 1 complete")
    print()

    # ══════════════════════════════════════════════════
    # STAGE 2: Train Acceptance Model
    # ══════════════════════════════════════════════════
    print("┌─ STAGE 2/5: Training Acceptance Model (XGBoost)")
    print("│")

    accept_params = {
        "tree_method": GPU_METHOD,
        "n_estimators": 300,
        "max_depth": 6,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "eval_metric": "auc",
        "early_stopping_rounds": 20,
        "random_state": 42,
        "verbosity": 0,
        "use_label_encoder": False,
    }

    accept_model, accept_raw, accept_metrics = train_single_model(
        "Acceptance",
        X_train, data["y_train_accept"],
        X_val, data["y_val_accept"],
        X_test, data["y_test_accept"],
        accept_params,
        calibrate=True,
        calibration_method="isotonic",
    )

    accept_path = output_path / "acceptance_model.joblib"
    joblib.dump(accept_model, accept_path)
    all_metrics["acceptance"] = accept_metrics

    print(f"  │")
    print(f"  │  ✓ Model saved to {accept_path.name}")
    print(f"  └─ Stage 2 complete")
    print()

    # ══════════════════════════════════════════════════
    # STAGE 3: Train Rejection Model
    # ══════════════════════════════════════════════════
    print("┌─ STAGE 3/5: Training Rejection Model (XGBoost)")
    print("│")

    # Compute scale_pos_weight for rejection
    n_pos_rej = data["y_train_reject"].sum()
    n_neg_rej = len(data["y_train_reject"]) - n_pos_rej
    spw_rej = n_neg_rej / max(n_pos_rej, 1)

    reject_params = {
        "tree_method": GPU_METHOD,
        "n_estimators": 300,
        "max_depth": 5,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "scale_pos_weight": spw_rej,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "eval_metric": "auc",
        "early_stopping_rounds": 20,
        "random_state": 42,
        "verbosity": 0,
        "use_label_encoder": False,
    }

    reject_model, reject_raw, reject_metrics = train_single_model(
        "Rejection",
        X_train, data["y_train_reject"],
        X_val, data["y_val_reject"],
        X_test, data["y_test_reject"],
        reject_params,
        calibrate=True,
        calibration_method="isotonic",
    )

    reject_path = output_path / "rejection_model.joblib"
    joblib.dump(reject_model, reject_path)
    all_metrics["rejection"] = reject_metrics

    print(f"  │")
    print(f"  │  ✓ Model saved to {reject_path.name}")
    print(f"  └─ Stage 3 complete")
    print()

    # ══════════════════════════════════════════════════
    # STAGE 4: Train Fraud Model
    # ══════════════════════════════════════════════════
    print("┌─ STAGE 4/5: Training Fraud Model (XGBoost)")
    print("│")

    n_pos_fraud = data["y_train_fraud"].sum()
    n_neg_fraud = len(data["y_train_fraud"]) - n_pos_fraud
    spw_fraud = n_neg_fraud / max(n_pos_fraud, 1)
    print(f"  │  Class imbalance: {n_pos_fraud:,} fraud / {n_neg_fraud:,} clean "
          f"(scale_pos_weight={spw_fraud:.1f})")

    fraud_params = {
        "tree_method": GPU_METHOD,
        "n_estimators": 500,
        "max_depth": 7,
        "learning_rate": 0.03,
        "subsample": 0.7,
        "colsample_bytree": 0.7,
        "scale_pos_weight": spw_fraud,
        "reg_alpha": 0.3,
        "reg_lambda": 2.0,
        "eval_metric": "aucpr",
        "early_stopping_rounds": 30,
        "random_state": 42,
        "verbosity": 0,
        "use_label_encoder": False,
    }

    fraud_model, fraud_raw, fraud_metrics = train_single_model(
        "Fraud",
        X_train, data["y_train_fraud"],
        X_val, data["y_val_fraud"],
        X_test, data["y_test_fraud"],
        fraud_params,
        calibrate=True,
        calibration_method="sigmoid",
    )

    fraud_path = output_path / "fraud_model.joblib"
    joblib.dump(fraud_model, fraud_path)
    all_metrics["fraud"] = fraud_metrics

    print(f"  │")
    print(f"  │  ✓ Model saved to {fraud_path.name}")
    print(f"  └─ Stage 4 complete")
    print()

    # ══════════════════════════════════════════════════
    # STAGE 5: Save evaluation report & feature importances
    # ══════════════════════════════════════════════════
    print("┌─ STAGE 5/5: Saving Evaluation Report")
    print("│")

    # Feature importances from raw (uncalibrated) models
    importances = {}
    for name, raw_model in [("acceptance", accept_raw), ("rejection", reject_raw), ("fraud", fraud_raw)]:
        imp = raw_model.feature_importances_
        top_idx = np.argsort(imp)[::-1][:10]
        top_features = [(FEATURE_NAMES[i], round(float(imp[i]), 4)) for i in top_idx]
        importances[name] = top_features
        print(f"│  Top 5 features ({name}):")
        for feat, score in top_features[:5]:
            bar_len = int(score * 50)
            bar = "█" * bar_len
            print(f"│    {feat:>38s}: {score:.4f} {bar}")

    # Save report
    report = {
        "generated_at": datetime.now().isoformat(),
        "total_training_time_seconds": round(time.time() - start_time, 2),
        "gpu_used": HAS_GPU,
        "tree_method": GPU_METHOD,
        "dataset": {
            "path": str(data_path),
            "total_records": int(len(data["df"])),
            "train_size": int(len(X_train)),
            "val_size": int(len(X_val)),
            "test_size": int(len(X_test)),
            "num_features": len(FEATURE_NAMES),
            "feature_names": FEATURE_NAMES,
            "class_distributions": {
                "acceptance": {
                    "train_positive": int(data["y_train_accept"].sum()),
                    "train_negative": int(len(data["y_train_accept"]) - data["y_train_accept"].sum()),
                    "positive_rate": round(float(data["y_train_accept"].mean()), 4),
                },
                "rejection": {
                    "train_positive": int(data["y_train_reject"].sum()),
                    "train_negative": int(len(data["y_train_reject"]) - data["y_train_reject"].sum()),
                    "positive_rate": round(float(data["y_train_reject"].mean()), 4),
                },
                "fraud": {
                    "train_positive": int(data["y_train_fraud"].sum()),
                    "train_negative": int(len(data["y_train_fraud"]) - data["y_train_fraud"].sum()),
                    "positive_rate": round(float(data["y_train_fraud"].mean()), 4),
                },
            },
        },
        "models": {
            "acceptance": {
                "version": "es-ai-accept-v1.0.0",
                "hyperparameters": {k: (str(v) if not isinstance(v, (int, float, bool, type(None))) else v)
                                    for k, v in accept_params.items()},
                "metrics": all_metrics["acceptance"],
                "top_features": dict(importances["acceptance"]),
                "calibration_method": "isotonic",
            },
            "rejection": {
                "version": "es-ai-reject-v1.0.0",
                "hyperparameters": {k: (str(v) if not isinstance(v, (int, float, bool, type(None))) else v)
                                    for k, v in reject_params.items()},
                "metrics": all_metrics["rejection"],
                "top_features": dict(importances["rejection"]),
                "calibration_method": "isotonic",
            },
            "fraud": {
                "version": "es-ai-fraud-v1.0.0",
                "hyperparameters": {k: (str(v) if not isinstance(v, (int, float, bool, type(None))) else v)
                                    for k, v in fraud_params.items()},
                "metrics": all_metrics["fraud"],
                "top_features": dict(importances["fraud"]),
                "calibration_method": "sigmoid",
            },
        },
    }
    report_path = output_path / "evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f"│")
    print(f"│  ✓ Report saved to {report_path.name}")
    print(f"└─ Stage 5 complete")
    print()

    # ══════════════════════════════════════════════════
    # SUMMARY
    # ══════════════════════════════════════════════════
    total_time = time.time() - start_time

    print(f"{'═'*64}")
    print(f"  {'✅ MODEL TRAINING COMPLETE':^60}")
    print(f"{'═'*64}")
    print()
    print(f"  Total training time: {total_time:.1f}s")
    print()
    print(f"  ┌─ Model Performance Summary")
    print(f"  │  {'Model':<14s} {'AUC-ROC':>8s} {'F1':>8s} {'Precision':>10s} {'Recall':>8s}")
    print(f"  │  {'─'*50}")
    for name in ["acceptance", "rejection", "fraud"]:
        m = all_metrics[name]
        print(f"  │  {name:<14s} {m['auc_roc']:>8.4f} {m['f1_score']:>8.4f} "
              f"{m['precision']:>10.4f} {m['recall']:>8.4f}")
    print(f"  └─")
    print()
    print(f"  Saved artifacts:")
    for f in sorted(output_path.glob("*")):
        if f.name != ".gitkeep":
            size = f.stat().st_size / 1024
            print(f"    → {f.name} ({size:.1f} KB)")
    print(f"{'═'*64}")
    print()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train all ES-AI models")
    parser.add_argument("--data", default="data/synthetic/claims_dataset.parquet",
                        help="Path to training dataset")
    parser.add_argument("--output", default="models/artifacts",
                        help="Output directory for model artifacts")
    args = parser.parse_args()

    train_all(data_path=args.data, output_dir=args.output)
