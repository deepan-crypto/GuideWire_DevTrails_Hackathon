"""
Data preprocessing for model training.

Loads the synthetic dataset, performs train/val/test splitting,
and prepares feature matrices for XGBoost.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.generators.constants import FEATURE_NAMES


def load_and_split(
    data_path: str | Path = "data/synthetic/claims_dataset.parquet",
    test_size: float = 0.15,
    val_size: float = 0.15,
    seed: int = 42,
    verbose: bool = True,
) -> dict:
    """
    Load dataset and split into train/val/test sets.

    Returns
    -------
    dict with keys: X_train, X_val, X_test, y_train_accept, y_val_accept,
    y_test_accept, y_train_reject, y_val_reject, y_test_reject,
    y_train_fraud, y_val_fraud, y_test_fraud, scaler, feature_names
    """
    data_path = Path(data_path)

    if verbose:
        print(f"  Loading dataset from {data_path.name}...", end=" ", flush=True)

    if data_path.suffix == ".parquet":
        df = pd.read_parquet(data_path)
    else:
        df = pd.read_csv(data_path)

    if verbose:
        print(f"✓ ({len(df):,} records)")

    # Extract feature matrix and labels
    X = df[FEATURE_NAMES].values.astype(np.float64)
    y_accept = df["is_accepted"].values.astype(np.int32)
    y_reject = df["is_rejected"].values.astype(np.int32)
    y_fraud = df["is_fraud"].values.astype(np.int32)

    # First split: train+val vs test
    X_trainval, X_test, ya_tv, ya_test, yr_tv, yr_test, yf_tv, yf_test = train_test_split(
        X, y_accept, y_reject, y_fraud,
        test_size=test_size,
        random_state=seed,
        stratify=y_fraud,  # Stratify on rarest class
    )

    # Second split: train vs val
    relative_val = val_size / (1.0 - test_size)
    X_train, X_val, ya_train, ya_val, yr_train, yr_val, yf_train, yf_val = train_test_split(
        X_trainval, ya_tv, yr_tv, yf_tv,
        test_size=relative_val,
        random_state=seed,
        stratify=yf_tv,
    )

    # Scale features
    if verbose:
        print(f"  Scaling features with StandardScaler...", end=" ", flush=True)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_val = scaler.transform(X_val)
    X_test = scaler.transform(X_test)

    if verbose:
        print("✓")
        print(f"  Split sizes:")
        print(f"    Train : {X_train.shape[0]:>6,} ({X_train.shape[0]/len(df)*100:.1f}%)")
        print(f"    Val   : {X_val.shape[0]:>6,} ({X_val.shape[0]/len(df)*100:.1f}%)")
        print(f"    Test  : {X_test.shape[0]:>6,} ({X_test.shape[0]/len(df)*100:.1f}%)")
        print()
        print(f"  Class distributions (train set):")
        print(f"    Accepted: {ya_train.sum():>5,}/{len(ya_train)} ({ya_train.mean()*100:.1f}%)")
        print(f"    Rejected: {yr_train.sum():>5,}/{len(yr_train)} ({yr_train.mean()*100:.1f}%)")
        print(f"    Fraud   : {yf_train.sum():>5,}/{len(yf_train)} ({yf_train.mean()*100:.1f}%)")

    return {
        "X_train": X_train, "X_val": X_val, "X_test": X_test,
        "y_train_accept": ya_train, "y_val_accept": ya_val, "y_test_accept": ya_test,
        "y_train_reject": yr_train, "y_val_reject": yr_val, "y_test_reject": yr_test,
        "y_train_fraud": yf_train, "y_val_fraud": yf_val, "y_test_fraud": yf_test,
        "scaler": scaler,
        "feature_names": FEATURE_NAMES,
        "df": df,
    }
