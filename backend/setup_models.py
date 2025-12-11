#!/usr/bin/env python3
"""
Setup script to download and test spaCy models.
Run this after installing requirements.txt
"""

import subprocess
import sys

def run_command(cmd):
    """Run a command and return success status."""
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        return False

def test_model(model_name):
    """Test if a spaCy model can be loaded."""
    try:
        import spacy
        print(f"Testing {model_name}...", end=" ")
        nlp = spacy.load(model_name)
        # Test it works
        doc = nlp("Jan Jansen woont in Amsterdam.")
        print(f"✅ Works! (Found {len(doc.ents)} entities)")
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def main():
    print("="*80)
    print("SPACY MODEL SETUP FOR ANONYMO-BUDDY")
    print("="*80)
    print()
    
    models = [
        ("nl_core_news_sm", "Small model (~40MB) - Faster, less accurate"),
        ("nl_core_news_md", "Medium model (~100MB) - Balanced"),
        ("nl_core_news_lg", "Large model (~500MB) - Most accurate"),
    ]
    
    print("Available models:")
    for i, (name, desc) in enumerate(models, 1):
        print(f"  {i}. {name} - {desc}")
    print()
    
    # Try to detect which model to install based on available memory
    try:
        import psutil
        available_ram = psutil.virtual_memory().available / (1024**3)  # GB
        print(f"Available RAM: {available_ram:.1f} GB")
        
        if available_ram < 2:
            recommended = "nl_core_news_sm"
            print("⚠️  Low memory detected. Recommending SMALL model.")
        elif available_ram < 4:
            recommended = "nl_core_news_md"
            print("Recommending MEDIUM model.")
        else:
            recommended = "nl_core_news_lg"
            print("Recommending LARGE model.")
    except ImportError:
        recommended = "nl_core_news_md"
        print("Could not detect RAM. Recommending MEDIUM model.")
    
    print()
    choice = input(f"Which model to install? (1-3, default: {recommended}): ").strip()
    
    if choice == "1":
        model_name = "nl_core_news_sm"
    elif choice == "2":
        model_name = "nl_core_news_md"
    elif choice == "3":
        model_name = "nl_core_news_lg"
    elif choice == "":
        model_name = recommended
    else:
        print("Invalid choice. Exiting.")
        return
    
    print()
    print(f"Installing {model_name}...")
    print("-"*80)
    
    if run_command(f"{sys.executable} -m spacy download {model_name}"):
        print()
        print("-"*80)
        print("Testing model...")
        if test_model(model_name):
            print()
            print("="*80)
            print("✅ SUCCESS! Model installed and tested.")
            print("="*80)
            print()
            print("You can now run:")
            print("  uvicorn main:app --reload")
            print()
            print(f"To use a different model later, set environment variable:")
            print(f"  export SPACY_MODEL={model_name}")
            print(f"  # or on Windows:")
            print(f"  set SPACY_MODEL={model_name}")
        else:
            print()
            print("⚠️  Model installed but testing failed.")
            print("You may need to reinstall or try a different model.")
    else:
        print()
        print("❌ Installation failed. Please check your internet connection and try again.")
        print()
        print("Manual installation command:")
        print(f"  python -m spacy download {model_name}")

if __name__ == "__main__":
    main()

