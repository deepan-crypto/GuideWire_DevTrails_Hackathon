"""
Model Registry — loads and caches all trained models at startup.
"""

import sys
from pathlib import Path

import joblib
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.generators.constants import FEATURE_NAMES
from features.extractor import FeatureExtractor
from models.reason_codes import get_reason_codes_from_shap


class ModelRegistry:
    """
    Singleton registry that holds all trained models, the scaler,
    and the feature extractor.

    Loaded once at FastAPI startup and injected via dependency.
    """

    def __init__(self, model_dir: str | Path = "models/artifacts"):
        self.model_dir = Path(model_dir)
        self.acceptance_model = None
        self.rejection_model = None
        self.fraud_model = None
        self.scaler = None
        self.extractor = FeatureExtractor()
        self.feature_names = FEATURE_NAMES
        self._loaded = False

    def load(self, verbose: bool = True) -> dict[str, str]:
        """Load all models from disk. Returns model status dict."""
        status = {}

        # Load scaler
        scaler_path = self.model_dir / "scaler.joblib"
        if scaler_path.exists():
            self.scaler = joblib.load(scaler_path)
            status["scaler"] = "loaded"
            if verbose:
                print(f"  ✓ Scaler loaded from {scaler_path}")
        else:
            status["scaler"] = "missing"
            if verbose:
                print(f"  ⚠ Scaler not found at {scaler_path}")

        # Load models
        for name in ["acceptance", "rejection", "fraud"]:
            path = self.model_dir / f"{name}_model.joblib"
            if path.exists():
                model = joblib.load(path)
                setattr(self, f"{name}_model", model)
                status[name] = "loaded"
                if verbose:
                    print(f"  ✓ {name.capitalize()} model loaded from {path}")
            else:
                status[name] = "missing"
                if verbose:
                    print(f"  ⚠ {name.capitalize()} model not found at {path}")

        self._loaded = True
        return status

    @property
    def is_loaded(self) -> bool:
        return self._loaded and all([
            self.acceptance_model is not None,
            self.rejection_model is not None,
            self.fraud_model is not None,
            self.scaler is not None,
        ])

    def predict_acceptance(self, features: np.ndarray) -> tuple[float, list[str], str]:
        """Predict acceptance score. Returns (score, reason_codes, explanation)."""
        scaled = self.scaler.transform(features.reshape(1, -1))
        prob = float(self.acceptance_model.predict_proba(scaled)[0, 1])
        codes, explanation = get_reason_codes_from_shap(
            None, self.feature_names, top_n=3, model_type="acceptance"
        )
        return prob, codes, explanation

    def predict_rejection(self, features: np.ndarray) -> tuple[float, list[str], str]:
        """Predict rejection score. Returns (score, reason_codes, explanation)."""
        scaled = self.scaler.transform(features.reshape(1, -1))
        prob = float(self.rejection_model.predict_proba(scaled)[0, 1])
        codes, explanation = get_reason_codes_from_shap(
            None, self.feature_names, top_n=3, model_type="rejection"
        )
        return prob, codes, explanation

    def predict_fraud(self, features: np.ndarray) -> tuple[float, bool, list[str], str]:
        """Predict fraud score. Returns (score, flag, reason_codes, explanation)."""
        scaled = self.scaler.transform(features.reshape(1, -1))
        prob = float(self.fraud_model.predict_proba(scaled)[0, 1])
        flag = prob >= 0.85
        codes, explanation = get_reason_codes_from_shap(
            None, self.feature_names, top_n=3, model_type="fraud"
        )
        return prob, flag, codes, explanation

    def extract_features(self, payload: dict) -> np.ndarray:
        """Extract feature vector from a unified input payload."""
        return self.extractor.extract(payload)

    def extract_features_dict(self, payload: dict) -> dict:
        """Extract feature dict from a unified input payload."""
        return self.extractor.extract_dict(payload)
