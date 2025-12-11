# Quick Start Guide - Anonymo Buddy

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.10+
- Node.js 18+
- ~1GB free disk space

### Step 1: Backend Setup (2 min)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Download Dutch NLP model (interactive setup)
python setup_models.py

# OR manually install a specific model:
# Small (recommended for <2GB RAM): python -m spacy download nl_core_news_sm
# Medium (recommended for 2-4GB RAM): python -m spacy download nl_core_news_md
# Large (recommended for 4GB+ RAM): python -m spacy download nl_core_news_lg

# Test that recognizers work
python test_recognizers.py

# Start server
uvicorn main:app --reload
```

Backend will start at: http://localhost:8000

**Note**: The app will automatically use the best available model. If you get a MemoryError, use a smaller model.

### Step 2: Frontend Setup (1 min)

```bash
# In a new terminal, from project root
npm install

# Start development server
npm run dev
```

Frontend will start at: http://localhost:5173

### Step 3: Test It Out! (2 min)

1. Open http://localhost:5173 in your browser
2. Upload the test file: `test_dutch_data.csv`
3. Keep all PII categories selected (default)
4. Click "Upload & Analyseer"
5. Wait ~5 seconds
6. See the magic! ✨
   - All columns visible with horizontal scroll
   - Real data shown with color-coded PII
   - Hover over highlighted text to see entity type
   - Toggle "Preview Anonimisatie" to see what output will look like
7. Select columns to anonymize (suggestions are auto-selected)
8. Click "Anonimiseer en Download"
9. Open the downloaded file in Excel

### What to Expect

**In the Preview:**
- 🟨 Yellow = Names (Jan Jansen, Maria de Vries)
- 🟥 Red = BSN numbers (validated with 11-proof)
- 🟦 Blue = Email & Phone numbers
- 🟩 Green = Addresses & Postcodes
- 🟪 Purple = IBAN numbers
- 🌸 Pink = Policy numbers (V0019918, MAK1120)

**Statistics Dashboard:**
- Total columns: 13
- PII detected: 50+
- Suggested columns: 10+

**Downloaded File:**
- Selected columns will have `[NAAM]`, `[BSN]`, `[EMAIL]`, etc.
- Non-selected columns remain unchanged
- File opens normally in Excel

## 🎯 Quick Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads in browser
- [ ] Can upload test_dutch_data.csv
- [ ] Preview shows all 13 columns
- [ ] PII is color-coded correctly
- [ ] Tooltips appear on hover
- [ ] Statistics show correct numbers
- [ ] Can toggle columns on/off
- [ ] Preview mode works
- [ ] Download produces valid Excel file
- [ ] Output file has anonymized data

## 🐛 Quick Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Verify spaCy model
python -m spacy validate
```

### Frontend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Model not found" error
```bash
# Run the interactive setup
python setup_models.py

# Or manually download spaCy model (choose based on your RAM)
python -m spacy download nl_core_news_sm   # For low RAM systems
python -m spacy download nl_core_news_md   # Recommended
python -m spacy download nl_core_news_lg   # If you have 4GB+ RAM

# Verify it's installed
python -c "import spacy; nlp = spacy.load('nl_core_news_md'); print('OK')"
```

### MemoryError or SystemError when loading model
This happens when the large model doesn't fit in memory or there are compatibility issues:

**Solution 1: Use a smaller model**
```bash
# Install the small or medium model instead
python -m spacy download nl_core_news_sm   # ~40MB
# or
python -m spacy download nl_core_news_md   # ~100MB

# The app will automatically detect and use it
uvicorn main:app --reload
```

**Solution 2: Use Python 3.10 or 3.11**
Python 3.13 has some compatibility issues with spaCy/ujson. If possible:
```bash
# Use Python 3.10 or 3.11
python3.11 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python setup_models.py
```

**Solution 3: Set model via environment variable**
```bash
# On Windows
set SPACY_MODEL=nl_core_news_sm
uvicorn main:app --reload

# On Linux/Mac
export SPACY_MODEL=nl_core_news_sm
uvicorn main:app --reload
```

### CORS errors in browser
Check that:
1. Backend is running on port 8000
2. Frontend is running on port 5173
3. No other apps using these ports

### Preview doesn't show PII highlighting
Check browser console for errors. Likely causes:
1. API not returning data correctly
2. Type mismatch in data structure

Run test script to verify backend:
```bash
cd backend
python test_recognizers.py
```

## 📚 Next Steps

After successful testing:

1. **Read the docs**: Check `IMPLEMENTATION_SUMMARY.md` for full details
2. **Deploy**: Follow `DEPLOYMENT_CHECKLIST.md` for production setup
3. **Customize**: Adjust recognizers in `backend/main.py` for your use case
4. **Test with real data**: Upload your own Excel/CSV files

## 💡 Pro Tips

1. **First analysis is slow** (~10s) because spaCy loads the model. Subsequent analyses are much faster (~2-5s).

2. **Large files** (1000+ rows) will take longer. Consider processing in batches for very large datasets.

3. **Column selection matters**: Only selected columns are anonymized in the output. Deselect columns that don't need anonymization to save processing time.

4. **Preview toggle**: Use the "Preview Anonimisatie" button to see exactly what the output will look like before downloading.

5. **Hover tooltips**: Hover over highlighted PII to see the entity type and confidence score.

6. **Test recognizers**: Run `python test_recognizers.py` regularly to verify custom patterns work as expected.

## 🎉 You're Ready!

That's it! You now have a fully functional Dutch PII anonymization tool running locally.

**Questions?** Check the detailed docs in `IMPLEMENTATION_NOTES.md`

**Issues?** See `DEPLOYMENT_CHECKLIST.md` troubleshooting section

**Happy Anonymizing!** 🔒

