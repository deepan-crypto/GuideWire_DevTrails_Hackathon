"""
Data generation pipeline — orchestrates the full synthetic dataset creation.

Pipeline steps:
1. Generate rider profiles (with quality categories)
2. Assign claim categories to each rider
3. Generate claims per rider (with GPS trails, evidence, history)
4. Extract features using FeatureExtractor (same as API serving)
5. Assign ground-truth labels using rule-based labeler
6. Export to Parquet and CSV
"""

import sys
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.generators.claim_generator import generate_claims_for_rider
from data.generators.constants import (
    CLAIM_CATEGORIES,
    CLAIM_CATEGORY_WEIGHTS,
    FEATURE_NAMES,
    weighted_choice,
)
from data.generators.labeler import assign_labels
from data.generators.rider_generator import generate_riders
from features.extractor import FeatureExtractor


def _progress_bar(current: int, total: int, width: int = 40, prefix: str = "") -> str:
    """Build a text progress bar string."""
    pct = current / max(total, 1)
    filled = int(width * pct)
    bar = "█" * filled + "░" * (width - filled)
    return f"\r  {prefix} |{bar}| {pct*100:5.1f}% ({current:,}/{total:,})"


def run_pipeline(
    num_records: int = 20_000,
    seed: int = 42,
    output_dir: str | Path = "data/synthetic",
    verbose: bool = True,
) -> pd.DataFrame:
    """
    Generate the complete synthetic dataset.

    Parameters
    ----------
    num_records : int
        Target number of claim records.
    seed : int
        Master random seed for full reproducibility.
    output_dir : str | Path
        Directory to save output files.
    verbose : bool
        Print detailed progress with progress bars.

    Returns
    -------
    pd.DataFrame with features, labels, and metadata columns.
    """
    rng = np.random.default_rng(seed)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    extractor = FeatureExtractor()
    start_time = time.time()
    stage_times = {}

    # ── Estimate rider count ──
    avg_claims = 6.0
    n_riders = max(int(num_records / avg_claims), 100)

    if verbose:
        print()
        print(f"{'═'*64}")
        print(f"  {'GuideWire ES-AI — Synthetic Data Generation Pipeline':^60}")
        print(f"{'═'*64}")
        print(f"  Target records  : {num_records:,}")
        print(f"  Estimated riders: {n_riders:,}")
        print(f"  Random seed     : {seed}")
        print(f"  Output directory: {output_path.resolve()}")
        print(f"  Features/record : {len(FEATURE_NAMES)}")
        print(f"{'═'*64}")
        print()

    # ══════════════════════════════════════════════════════════
    # STAGE 1: Generate Rider Profiles
    # ══════════════════════════════════════════════════════════
    t0 = time.time()
    if verbose:
        print("┌─ STAGE 1/6: Generating Rider Profiles")
        print("│")

    riders = generate_riders(n_riders, seed=seed)

    quality_counts = {}
    for r in riders:
        q = r.get("quality", "unknown")
        quality_counts[q] = quality_counts.get(q, 0) + 1

    stage_times["riders"] = time.time() - t0
    if verbose:
        print(f"│  ✓ Generated {len(riders):,} riders in {stage_times['riders']:.2f}s")
        for q, c in sorted(quality_counts.items()):
            print(f"│    {q:>8s} quality: {c:,} riders ({c/len(riders)*100:.1f}%)")
        print(f"└─ Stage 1 complete")
        print()

    # ══════════════════════════════════════════════════════════
    # STAGE 2: Generate Claim Records
    # ══════════════════════════════════════════════════════════
    t0 = time.time()
    if verbose:
        print("┌─ STAGE 2/6: Generating Claim Records (with GPS trails)")
        print("│")

    all_payloads = []
    base_date = datetime(2026, 4, 1, 12, 0, 0)
    category_counts = {c: 0 for c in CLAIM_CATEGORIES}

    for idx, rider in enumerate(riders):
        category = weighted_choice(CLAIM_CATEGORIES, CLAIM_CATEGORY_WEIGHTS, rng)
        claims = generate_claims_for_rider(rider, category, rng, base_date)
        for c in claims:
            category_counts[category] = category_counts.get(category, 0) + 1
        all_payloads.extend(claims)

        if verbose and (idx + 1) % max(1, len(riders) // 20) == 0:
            print(_progress_bar(len(all_payloads), num_records, prefix="Claims"), end="", flush=True)

        if len(all_payloads) >= num_records * 1.1:
            break

    if len(all_payloads) > num_records:
        rng.shuffle(all_payloads)
        all_payloads = all_payloads[:num_records]
        # Recount categories after trim
        category_counts = {c: 0 for c in CLAIM_CATEGORIES}
        for p in all_payloads:
            cat = p.get("_category", "unknown")
            category_counts[cat] = category_counts.get(cat, 0) + 1

    stage_times["claims"] = time.time() - t0
    if verbose:
        print(_progress_bar(len(all_payloads), num_records, prefix="Claims"))
        print(f"│")
        print(f"│  ✓ Generated {len(all_payloads):,} claims in {stage_times['claims']:.2f}s")
        for cat in CLAIM_CATEGORIES:
            c = category_counts.get(cat, 0)
            print(f"│    {cat:>12s}: {c:>6,} ({c/max(len(all_payloads),1)*100:.1f}%)")
        print(f"└─ Stage 2 complete")
        print()

    # ══════════════════════════════════════════════════════════
    # STAGE 3: Extract Features
    # ══════════════════════════════════════════════════════════
    t0 = time.time()
    if verbose:
        print("┌─ STAGE 3/6: Extracting Features (35 per record)")
        print("│")

    feature_dicts = []
    metadata_list = []
    skipped = 0
    total = len(all_payloads)

    for i, payload in enumerate(all_payloads):
        try:
            feat = extractor.extract_dict(payload)
            feature_dicts.append(feat)
            metadata_list.append({
                "request_id": payload.get("request_id", ""),
                "claim_id": payload["claim_context"]["claim_id"],
                "user_id": payload["claim_context"]["user_id"],
                "category": payload.get("_category", "unknown"),
                "rider_quality": payload.get("_rider_quality", "unknown"),
                "disruption_type": payload["claim_context"]["disruption_type"],
                "zone": payload["user_profile"]["zone"],
            })
        except Exception as e:
            skipped += 1
            continue

        if verbose and (i + 1) % max(1, total // 20) == 0:
            print(_progress_bar(i + 1, total, prefix="Features"), end="", flush=True)

    stage_times["features"] = time.time() - t0
    if verbose:
        print(_progress_bar(total, total, prefix="Features"))
        print(f"│")
        print(f"│  ✓ Extracted {len(feature_dicts):,} feature vectors in {stage_times['features']:.2f}s")
        if skipped:
            print(f"│  ⚠ Skipped {skipped} records due to errors")
        print(f"└─ Stage 3 complete")
        print()

    # ══════════════════════════════════════════════════════════
    # STAGE 4: Assign Ground-Truth Labels
    # ══════════════════════════════════════════════════════════
    t0 = time.time()
    if verbose:
        print("┌─ STAGE 4/6: Assigning Ground-Truth Labels")
        print("│")

    label_dicts = []
    total_feat = len(feature_dicts)

    for i, (feat, payload) in enumerate(zip(feature_dicts, all_payloads)):
        category = payload.get("_category", "legitimate")
        labels = assign_labels(feat, category, rng)
        label_dicts.append(labels)

        if verbose and (i + 1) % max(1, total_feat // 10) == 0:
            print(_progress_bar(i + 1, total_feat, prefix="Labels "), end="", flush=True)

    stage_times["labels"] = time.time() - t0
    if verbose:
        print(_progress_bar(total_feat, total_feat, prefix="Labels "))
        print(f"│")
        print(f"│  ✓ Labeled {len(label_dicts):,} records in {stage_times['labels']:.2f}s")
        print(f"└─ Stage 4 complete")
        print()

    # ══════════════════════════════════════════════════════════
    # STAGE 5: Build DataFrame
    # ══════════════════════════════════════════════════════════
    t0 = time.time()
    if verbose:
        print("┌─ STAGE 5/6: Building Dataset")
        print("│")

    df_features = pd.DataFrame(feature_dicts, columns=FEATURE_NAMES)
    df_labels = pd.DataFrame(label_dicts)
    df_meta = pd.DataFrame(metadata_list)
    df = pd.concat([df_meta, df_features, df_labels], axis=1)

    stage_times["dataframe"] = time.time() - t0
    if verbose:
        print(f"│  ✓ DataFrame built: {df.shape[0]:,} rows × {df.shape[1]} columns")
        print(f"│  Memory usage: {df.memory_usage(deep=True).sum() / 1024 / 1024:.1f} MB")
        print(f"└─ Stage 5 complete")
        print()

    # ══════════════════════════════════════════════════════════
    # STAGE 6: Export
    # ══════════════════════════════════════════════════════════
    t0 = time.time()
    if verbose:
        print("┌─ STAGE 6/6: Exporting to Disk")
        print("│")

    parquet_path = output_path / "claims_dataset.parquet"
    df.to_parquet(parquet_path, engine="pyarrow", index=False)
    parquet_size = parquet_path.stat().st_size / 1024 / 1024

    if verbose:
        print(f"│  ✓ Parquet: {parquet_path.name} ({parquet_size:.1f} MB)")

    csv_path = output_path / "claims_dataset.csv"
    df.to_csv(csv_path, index=False)
    csv_size = csv_path.stat().st_size / 1024 / 1024

    stage_times["export"] = time.time() - t0
    if verbose:
        print(f"│  ✓ CSV:     {csv_path.name} ({csv_size:.1f} MB)")
        print(f"└─ Stage 6 complete")
        print()

    # ══════════════════════════════════════════════════════════
    # SUMMARY
    # ══════════════════════════════════════════════════════════
    total_elapsed = time.time() - start_time

    if verbose:
        print(f"{'═'*64}")
        print(f"  {'✅ DATASET GENERATION COMPLETE':^60}")
        print(f"{'═'*64}")
        print()
        print(f"  Records        : {len(df):,}")
        print(f"  Features       : {len(FEATURE_NAMES)}")
        print(f"  Total time     : {total_elapsed:.1f}s")
        print()
        print(f"  ┌─ Label Distribution")
        for label in ["accepted", "rejected", "fraud"]:
            count = int((df["ground_truth_label"] == label).sum())
            pct = count / len(df) * 100
            bar_len = int(pct / 2)
            bar = "█" * bar_len
            print(f"  │  {label:>10s} : {count:>6,} ({pct:5.1f}%) {bar}")
        print(f"  └─")
        print()
        print(f"  ┌─ Stage Timings")
        for stage, t in stage_times.items():
            print(f"  │  {stage:>12s} : {t:.2f}s")
        print(f"  │  {'TOTAL':>12s} : {total_elapsed:.2f}s")
        print(f"  └─")
        print()
        print(f"  Output files:")
        print(f"    → {parquet_path.resolve()}")
        print(f"    → {csv_path.resolve()}")
        print(f"{'═'*64}")
        print()

    return df


if __name__ == "__main__":
    run_pipeline()
