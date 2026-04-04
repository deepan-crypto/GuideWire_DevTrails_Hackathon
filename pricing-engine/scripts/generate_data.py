"""
CLI script: Generate synthetic dataset for ES-AI model training.

Usage:
    python scripts/generate_data.py
    python scripts/generate_data.py --num-records 50000 --seed 123
    python scripts/generate_data.py --output data/synthetic/
"""

import argparse
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data.generators.pipeline import run_pipeline


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic dataset for ES-AI model training.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/generate_data.py                          # Default: 20K records
  python scripts/generate_data.py --num-records 50000      # 50K records
  python scripts/generate_data.py --seed 123               # Custom seed
  python scripts/generate_data.py --output data/custom/    # Custom output dir
        """,
    )
    parser.add_argument(
        "--num-records",
        type=int,
        default=20_000,
        help="Number of claim records to generate (default: 20000)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="data/synthetic",
        help="Output directory for generated files (default: data/synthetic/)",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress progress output",
    )

    args = parser.parse_args()

    try:
        df = run_pipeline(
            num_records=args.num_records,
            seed=args.seed,
            output_dir=args.output,
            verbose=not args.quiet,
        )
        if not args.quiet:
            print(f"\n✅ Successfully generated {len(df):,} records.")
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
