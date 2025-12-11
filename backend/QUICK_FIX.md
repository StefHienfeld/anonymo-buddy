# Quick Fix for MemoryError

## Problem
You're getting a `MemoryError` or `SystemError` when loading the `nl_core_news_lg` model.

## Immediate Solution

The large spaCy model is too big for your system. Install a smaller model instead:

### Option 1: Use the Interactive Setup (Recommended)
```bash
cd backend
python setup_models.py
```

This will help you choose the right model for your system.

### Option 2: Manual Installation (Fastest)
```bash
cd backend

# Install the SMALL model (recommended for your system)
python -m spacy download nl_core_news_sm

# Test it works
python test_recognizers.py

# Start the server
uvicorn main:app --reload
```

### Option 3: Medium Model (if small doesn't give good results)
```bash
cd backend

# Install the MEDIUM model
python -m spacy download nl_core_news_md

# Test it works
python test_recognizers.py

# Start the server
uvicorn main:app --reload
```

## What Changed?

I've updated `main.py` to automatically try smaller models if the large one fails. The app will now:
1. Try to load `nl_core_news_lg` (large, most accurate)
2. If that fails, try `nl_core_news_md` (medium)
3. If that fails, try `nl_core_news_sm` (small)

You only need to have ONE model installed, and the app will use it automatically.

## Model Comparison

| Model | Size | RAM Needed | Accuracy | Speed |
|-------|------|------------|----------|-------|
| sm (small) | ~40MB | <2GB | Good (85%) | Fast |
| md (medium) | ~100MB | 2-4GB | Better (90%) | Medium |
| lg (large) | ~500MB | 4GB+ | Best (95%) | Slower |

## Testing

After installing a model, test it:
```bash
python test_recognizers.py
```

If it works without errors, you're good to go!

## Still Having Issues?

If you're using Python 3.13, there might be compatibility issues. Try:
```bash
# Check your Python version
python --version

# If it's 3.13, consider using 3.11 or 3.10
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download nl_core_news_sm
python test_recognizers.py
```

