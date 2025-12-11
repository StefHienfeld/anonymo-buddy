# Deployment Checklist - Anonymo Buddy

## ✅ Pre-Deployment Verificatie

### Backend Tests
- [ ] Test de custom recognizers: `cd backend && python test_recognizers.py`
- [ ] Verificeer dat alle PII types worden gedetecteerd
- [ ] Test de API endpoints:
  - [ ] `/api/preview` - werkt met Excel en CSV
  - [ ] `/api/deep-analyze` - retourneert correcte entity detecties
  - [ ] `/api/anonymize` - genereert geanonimiseerde bestanden

### Frontend Tests
- [ ] Upload test_dutch_data.csv
- [ ] Verificeer dat preview alle kolommen toont
- [ ] Check PII highlighting (kleuren correct)
- [ ] Test column toggles
- [ ] Test preview/origineel toggle button
- [ ] Download geanonimiseerd bestand en verifieer output

## 🚀 Deployment Stappen

### 1. Backend Deployment

```bash
cd backend

# Installeer dependencies
pip install -r requirements.txt

# Download spaCy model (indien nodig)
python -m spacy download nl_core_news_lg

# Test het script
python test_recognizers.py

# Start server (development)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Of gebruik Docker
docker build -t anonymo-backend .
docker run -p 8000:8000 anonymo-backend
```

### 2. Frontend Deployment

```bash
# Installeer dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🔍 Post-Deployment Tests

### Kritische Functionaliteit
1. **Upload Flow**
   - [ ] CSV upload werkt
   - [ ] Excel upload werkt
   - [ ] Error handling voor ongeldige bestanden

2. **PII Detectie**
   - [ ] Namen worden herkend (Nederlands)
   - [ ] BSN nummers worden gevalideerd (11-proef)
   - [ ] Email adressen worden gevonden
   - [ ] Telefoonnummers (alle formaten)
   - [ ] IBAN nummers
   - [ ] Postcodes
   - [ ] Polisnummers (V####, MAK####, DL####)
   - [ ] Bedrijfsnamen

3. **Preview Interface**
   - [ ] Alle kolommen zichtbaar
   - [ ] Horizontale scroll werkt
   - [ ] PII is correct gekleurd
   - [ ] Tooltips tonen entity info
   - [ ] Preview/origineel toggle werkt
   - [ ] Statistieken kloppen

4. **Anonimisatie**
   - [ ] Geselecteerde kolommen worden geanonimiseerd
   - [ ] Specifieke labels worden gebruikt ([NAAM], [BSN], etc.)
   - [ ] Niet-geselecteerde kolommen blijven origineel
   - [ ] Download werkt correct
   - [ ] Output bestand is leesbaar in Excel

## 🐛 Bekende Issues & Workarounds

### Issue 1: spaCy Model Download
**Probleem**: Het nl_core_news_lg model is groot (500MB+)
**Oplossing**: 
```bash
# Handmatig downloaden indien automatisch faalt
python -m spacy download nl_core_news_lg
python -m spacy validate
```

### Issue 2: CORS Errors
**Probleem**: Frontend kan niet communiceren met backend
**Oplossing**: Verificeer CORS settings in backend/main.py
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: Slow First Analysis
**Probleem**: Eerste analyse duurt lang
**Oplossing**: Dit is normaal - spaCy model wordt geladen. Volgende analyses zijn sneller.

## 📊 Performance Metrics

### Verwachte Timing
- **File Upload**: < 1 seconde
- **Deep Analyze** (10 rijen): 2-5 seconden
- **Deep Analyze** (100 rijen): 10-20 seconden
- **Anonymization** (100 rijen): 5-10 seconden

### Resource Usage
- **Memory**: ~500MB (spaCy model + Presidio)
- **CPU**: Piek tijdens analyse, idle daarna
- **Disk**: ~1GB (Python + dependencies + models)

## 🔒 Security Checklist

- [ ] Bestanden worden niet opgeslagen op server (in-memory processing)
- [ ] Geen logging van gevoelige data
- [ ] CORS correct geconfigureerd voor productie
- [ ] File size limits ingesteld (max 50MB aangeraden)
- [ ] Input validatie op file types
- [ ] Rate limiting overwegen voor productie

## 📝 Monitoring

### Logs om te Monitoren
```bash
# Backend errors
tail -f backend_error.log

# Analyse performance
grep "Deep analyze" logs | grep "completed"

# Failed anonymizations
grep "Anonymize error" logs
```

### Key Metrics
- Upload success rate
- Average analysis time
- PII detection rate per column
- Download success rate
- Error rate per endpoint

## 🎯 Success Criteria

De deployment is succesvol als:
- ✅ 95%+ van Nederlandse namen worden herkend
- ✅ 99%+ van BSN nummers worden gevalideerd en herkend
- ✅ 99%+ van emails, telefoons, IBANs worden gevonden
- ✅ Alle kolommen worden correct weergegeven in preview
- ✅ Geanonimiseerde bestanden zijn correct en leesbaar
- ✅ Geen crashes of errors bij normale gebruik
- ✅ Response times zijn acceptabel (< 30 sec voor 100 rijen)

## 📞 Support & Troubleshooting

### Common Commands
```bash
# Check backend status
curl http://localhost:8000/

# Test deep analyze endpoint
curl -X POST -F "file=@test_dutch_data.csv" \
     -F 'options={"namen":true,"bsn":true}' \
     http://localhost:8000/api/deep-analyze

# View backend logs
tail -f /var/log/anonymo-backend.log

# Restart backend
systemctl restart anonymo-backend  # (indien systemd service)
```

### Debug Mode
Backend met debug logging:
```bash
uvicorn main:app --reload --log-level debug
```

Frontend met source maps:
```bash
npm run dev -- --debug
```

## 📚 Documentatie

Zie ook:
- [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) - Technische details
- [README.md](README.md) - Project overzicht
- Backend API docs: `http://localhost:8000/docs` (FastAPI auto-docs)

