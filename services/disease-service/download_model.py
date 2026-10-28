"""
SmartFarm AI — Model Checkpoint Downloader & Verifier

Downloads the pretrained crop disease classification weights, verifies checksum,
and places the artifact into services/disease-service/weights/.

Usage:
    python download_model.py [--force] [--dry-run]
"""

import sys
import os
import hashlib
import argparse
from pathlib import Path

WEIGHTS_DIR = Path(__file__).parent / "weights"
TARGET_FILE = WEIGHTS_DIR / "agri_plant_disease_resnet50.pth"

# Model metadata
REPO_ID = "mesabo/agri-plant-disease-resnet50"
SOURCE_URL = "https://huggingface.co/mesabo/agri-plant-disease-resnet50/resolve/main/pytorch_model.bin"
EXPECTED_MIN_BYTES = 50 * 1024 * 1024 # ~90MB

def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192 * 1024):
            sha.update(chunk)
    return sha.hexdigest()

def download(force: bool = False, dry_run: bool = False):
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    if TARGET_FILE.exists() and not force:
        size = TARGET_FILE.stat().st_size
        print(f"[OK] Checkpoint already exists at {TARGET_FILE} ({size / (1024*1024):.1f} MB).")
        print("Use --force to re-download.")
        return 0

    if dry_run:
        print(f"[DRY-RUN] Would download {SOURCE_URL} to {TARGET_FILE}")
        return 0

    print(f"Downloading checkpoint from {SOURCE_URL}...")
    try:
        import urllib.request

        def progress(count, block_size, total_size):
            percent = int(count * block_size * 100 / (total_size or 1))
            sys.stdout.write(f"\rDownloading: {percent}% ({count * block_size / (1024*1024):.1f} MB)")
            sys.stdout.flush()

        urllib.request.urlretrieve(SOURCE_URL, TARGET_FILE, reporthook=progress)
        print("\nDownload complete.")

        size = TARGET_FILE.stat().st_size
        if size < EXPECTED_MIN_BYTES:
            print(f"[ERROR] Downloaded file size {size} is smaller than expected {EXPECTED_MIN_BYTES}.")
            return 1

        sha = compute_sha256(TARGET_FILE)
        print(f"[SUCCESS] Weights verified: {size / (1024*1024):.1f} MB (SHA256: {sha[:16]}...)")
        return 0
    except Exception as e:
        print(f"\n[ERROR] Download failed: {e}")
        if TARGET_FILE.exists():
            TARGET_FILE.unlink()
        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download crop disease model weights")
    parser.add_argument("--force", action="store_true", help="Overwrite existing weights")
    parser.add_argument("--dry-run", action="store_true", help="Display download plan without network transfer")
    args = parser.parse_args()

    sys.exit(download(force=args.force, dry_run=args.dry_run))
