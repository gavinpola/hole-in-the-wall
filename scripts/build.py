#!/usr/bin/env python3
"""
Hole in the Wall - Build Script
Compiles YAML restaurant data to JSON and copies static assets to dist/
"""
from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

# Try to import yaml, provide helpful error if not installed
try:
    import yaml
except ImportError:
    print("Error: PyYAML is required. Install with: pip install pyyaml")
    exit(1)

# Paths
ROOT_DIR = Path(__file__).parent.parent
DATA_DIR = ROOT_DIR / "data"
SRC_DIR = ROOT_DIR / "src"
DIST_DIR = ROOT_DIR / "dist"


def load_yaml(file_path: Path) -> dict:
    """Load a YAML file and return its contents."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def find_restaurant_files() -> list[Path]:
    """Find all restaurant YAML files recursively."""
    restaurant_dir = DATA_DIR / "restaurants"
    if not restaurant_dir.exists():
        return []
    return list(restaurant_dir.rglob("*.yaml"))


def compile_restaurants() -> list[dict]:
    """Load all restaurant YAML files and compile to a list."""
    restaurants = []
    files = find_restaurant_files()

    print(f"Found {len(files)} restaurant files")

    for file_path in files:
        try:
            data = load_yaml(file_path)
            if data and isinstance(data, dict) and 'id' in data:
                # Add source file for debugging
                data['_source'] = str(file_path.relative_to(ROOT_DIR))
                restaurants.append(data)
                print(f"  ✓ {data.get('name_en', 'Unknown')}")
            else:
                print(f"  ✗ Skipping {file_path.name} - missing 'id' field")
        except Exception as e:
            print(f"  ✗ Error loading {file_path.name}: {e}")

    return restaurants


def load_regions() -> dict:
    """Load the regions configuration."""
    regions_file = DATA_DIR / "regions.yaml"
    if regions_file.exists():
        return load_yaml(regions_file)
    return {}


def build_data():
    """Build the main data JSON file."""
    print("\n📦 Building data...")

    # Compile all data
    data = {
        "restaurants": compile_restaurants(),
        "regions": load_regions(),
        "meta": {
            "generated_at": __import__('datetime').datetime.now().isoformat(),
            "count": 0
        }
    }
    data["meta"]["count"] = len(data["restaurants"])

    # Ensure dist directory exists
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    # Write JSON
    output_file = DIST_DIR / "data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Written {output_file}")
    print(f"  {data['meta']['count']} restaurants compiled")

    return data


def copy_static():
    """Copy static files from src to dist."""
    print("\n📁 Copying static files...")

    # Files and directories to copy
    items_to_copy = [
        "index.html",
        "css",
        "js",
        "assets"
    ]

    for item in items_to_copy:
        src_path = SRC_DIR / item
        dst_path = DIST_DIR / item

        if src_path.exists():
            if src_path.is_dir():
                if dst_path.exists():
                    shutil.rmtree(dst_path)
                shutil.copytree(src_path, dst_path)
                print(f"  ✓ {item}/ (directory)")
            else:
                shutil.copy2(src_path, dst_path)
                print(f"  ✓ {item}")
        else:
            print(f"  - {item} (not found, skipping)")


def generate_manifest():
    """Generate a manifest file for the PWA (future)."""
    manifest = {
        "name": "Hole in the Wall",
        "short_name": "HITW",
        "description": "Discover Japan's hidden restaurants",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0a0a0a",
        "theme_color": "#e07a5f",
        "icons": []
    }

    manifest_file = DIST_DIR / "manifest.json"
    with open(manifest_file, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f"\n✓ Generated {manifest_file}")


def generate_config():
    """Generate config.js with API keys from environment variables."""
    print("\n🔑 Generating config...")

    mapbox_token = os.environ.get('MAPBOX_TOKEN', '')

    if not mapbox_token:
        print("  ⚠️ MAPBOX_TOKEN not set - map will show placeholder")

    config_content = f"""/**
 * Configuration - Generated at build time
 */

window.HITW_CONFIG = {{
  MAPBOX_TOKEN: '{mapbox_token}'
}};
"""

    config_file = DIST_DIR / "js" / "config.js"
    config_file.parent.mkdir(parents=True, exist_ok=True)

    with open(config_file, 'w', encoding='utf-8') as f:
        f.write(config_content)

    print(f"  ✓ {config_file}")


def main():
    """Main build process."""
    print("=" * 50)
    print("🏮 Hole in the Wall - Build")
    print("=" * 50)

    # Clean dist directory
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)

    # Build steps
    build_data()
    copy_static()
    generate_config()
    generate_manifest()

    print("\n" + "=" * 50)
    print("✅ Build complete!")
    print(f"   Output: {DIST_DIR}")
    print("=" * 50)


if __name__ == "__main__":
    main()
