from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import json
import re
from typing import List, Dict, Optional, Tuple
from collections import defaultdict

# Presidio & Spacy imports
from presidio_analyzer import AnalyzerEngine, RecognizerResult, PatternRecognizer, Pattern
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

app = FastAPI()

# CORS toestaan voor je frontend (draait vaak op 5173 of 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In productie zet je hier je specifieke frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CUSTOM RECOGNIZERS ---

def is_valid_bsn(number: str) -> bool:
    """Valideert een BSN volgens de 11-proef."""
    clean_num = re.sub(r'\D', '', str(number))
    if len(clean_num) != 9:
        return False
    
    digits = [int(d) for d in clean_num]
    total = sum(digits[i] * (9 - i) for i in range(8))
    total += digits[8] * -1
    
    return total % 11 == 0

# BSN Recognizer met flexibele formatting
bsn_patterns = [
    Pattern(name="bsn_plain", regex=r"\b\d{9}\b", score=0.5),
    Pattern(name="bsn_dashes", regex=r"\b\d{3}-\d{2}-\d{2}-\d{2}\b", score=0.7),
    Pattern(name="bsn_dots", regex=r"\b\d{3}\.\d{2}\.\d{2}\.\d{2}\b", score=0.7),
]

class BsnRecognizer(PatternRecognizer):
    def __init__(self):
        super().__init__(
            supported_entity="NL_BSN",
            patterns=bsn_patterns,
            context=["bsn", "burger", "service", "nummer", "sofinummer", "sofi"]
        )
    
    def validate_result(self, pattern_match):
        """Valideer met 11-proef"""
        text = pattern_match.matched_text
        if is_valid_bsn(text):
            pattern_match.score = 0.9
            return pattern_match
        return None

# Nederlandse Postcode Recognizer
postcode_patterns = [
    Pattern(name="postcode_space", regex=r"\b\d{4}\s?[A-Z]{2}\b", score=0.85),
]

postcode_recognizer = PatternRecognizer(
    supported_entity="NL_POSTCODE",
    patterns=postcode_patterns,
    context=["postcode", "adres", "woonplaats"]
)

# IBAN Recognizer (uitgebreid)
iban_patterns = [
    Pattern(name="iban_nl", regex=r"\bNL\d{2}[A-Z]{4}\d{10}\b", score=0.9),
    Pattern(name="iban_spaced", regex=r"\bNL\d{2}\s?[A-Z]{4}\s?\d{4}\s?\d{4}\s?\d{2}\b", score=0.85),
    Pattern(name="iban_generic", regex=r"\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7,10}\b", score=0.7),
]

iban_recognizer = PatternRecognizer(
    supported_entity="NL_IBAN",
    patterns=iban_patterns,
    context=["iban", "rekening", "bank", "rekeningnummer"]
)

# Nederlandse Telefoonnummers (uitgebreid)
phone_patterns = [
    Pattern(name="mobile_06", regex=r"\b06[\s\-]?\d{8}\b", score=0.9),
    Pattern(name="mobile_plus31", regex=r"\+31[\s\-]?6[\s\-]?\d{8}\b", score=0.9),
    Pattern(name="landline", regex=r"\b0\d{1,3}[\s\-]?\d{6,7}\b", score=0.75),
    Pattern(name="international", regex=r"\+31[\s\-]?\d{1,3}[\s\-]?\d{6,7}\b", score=0.8),
]

phone_recognizer = PatternRecognizer(
    supported_entity="NL_PHONE",
    patterns=phone_patterns,
    context=["telefoon", "tel", "mobiel", "mobile", "phone"]
)

# Policy/Polisnummer Recognizer (algemene patronen)
policy_patterns = [
    Pattern(name="policy_letter_digits", regex=r"\b[A-Z]{1,3}\d{6,10}\b", score=0.6),
    Pattern(name="policy_mak", regex=r"\bMAK\d{4,6}\b", score=0.85),
    Pattern(name="policy_vdigits", regex=r"\bV\d{7,9}\b", score=0.8),
    Pattern(name="policy_dl", regex=r"\bDL\d{6}\b", score=0.8),
]

policy_recognizer = PatternRecognizer(
    supported_entity="NL_POLICY_NUMBER",
    patterns=policy_patterns,
    context=["polis", "policy", "nummer", "verzekering", "makelaar"]
)

# Email recognizer (verbeterd)
email_patterns = [
    Pattern(
        name="email_standard",
        regex=r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        score=0.9
    ),
]

email_recognizer = PatternRecognizer(
    supported_entity="EMAIL_ADDRESS",
    patterns=email_patterns,
    context=["email", "e-mail", "mail"]
)

# --- SETUP NLP ENGINE MET CUSTOM RECOGNIZERS ---
# Try to load the large model, fallback to medium or small if memory issues
import os

# Allow configuration via environment variable
SPACY_MODEL = os.getenv("SPACY_MODEL", "nl_core_news_lg")

# Try loading the model with fallback
def create_nlp_engine():
    """Create NLP engine with fallback to smaller models if large model fails."""
    models_to_try = []
    
    if SPACY_MODEL == "nl_core_news_lg":
        models_to_try = ["nl_core_news_lg", "nl_core_news_md", "nl_core_news_sm"]
    elif SPACY_MODEL == "nl_core_news_md":
        models_to_try = ["nl_core_news_md", "nl_core_news_sm"]
    else:
        models_to_try = [SPACY_MODEL]
    
    for model_name in models_to_try:
        try:
            print(f"Attempting to load spaCy model: {model_name}")
            configuration = {
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "nl", "model_name": model_name}],
            }
            provider = NlpEngineProvider(nlp_configuration=configuration)
            engine = provider.create_engine()
            print(f"✅ Successfully loaded model: {model_name}")
            return engine, model_name
        except (MemoryError, SystemError, Exception) as e:
            print(f"❌ Failed to load {model_name}: {e}")
            if model_name == models_to_try[-1]:
                raise Exception(f"Could not load any spaCy model. Tried: {models_to_try}")
            continue
    
    raise Exception("No suitable spaCy model could be loaded")

nlp_engine, loaded_model = create_nlp_engine()
print(f"Using spaCy model: {loaded_model}")

# Maak analyzer met alle custom recognizers
analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["nl"])

# Voeg custom recognizers toe
analyzer.registry.add_recognizer(BsnRecognizer())
analyzer.registry.add_recognizer(postcode_recognizer)
analyzer.registry.add_recognizer(iban_recognizer)
analyzer.registry.add_recognizer(phone_recognizer)
analyzer.registry.add_recognizer(policy_recognizer)
analyzer.registry.add_recognizer(email_recognizer)

anonymizer = AnonymizerEngine()

# --- HELPER FUNCTIONS ---

def get_entity_label(entity_type: str) -> str:
    """Map entity type naar leesbaar label voor anonimisatie."""
    entity_map = {
        "PERSON": "[NAAM]",
        "NL_BSN": "[BSN]",
        "NL_POSTCODE": "[POSTCODE]",
        "NL_IBAN": "[IBAN]",
        "IBAN_CODE": "[IBAN]",
        "NL_PHONE": "[TEL]",
        "PHONE_NUMBER": "[TEL]",
        "EMAIL_ADDRESS": "[EMAIL]",
        "ORGANIZATION": "[ORGANISATIE]",
        "LOCATION": "[LOCATIE]",
        "NL_POLICY_NUMBER": "[POLISNR]",
        "DATE_TIME": "[DATUM]",
        "CREDIT_CARD": "[CREDITCARD]",
        "IBAN": "[IBAN]",
    }
    return entity_map.get(entity_type, "[PII]")

def get_entities_to_analyze(options: Dict) -> List[str]:
    """Bepaal welke entities gezocht moeten worden op basis van user options."""
    entities = []
    
    if options.get('namen', False):
        entities.append("PERSON")
    if options.get('bedrijf', False):
        entities.append("ORGANIZATION")
    if options.get('postcode', False):
        entities.extend(["NL_POSTCODE", "LOCATION"])
    if options.get('bsn', False):
        entities.append("NL_BSN")
    if options.get('iban', False):
        entities.extend(["NL_IBAN", "IBAN_CODE"])
    if options.get('tel', False):
        entities.extend(["NL_PHONE", "PHONE_NUMBER"])
    if options.get('email', False):
        entities.append("EMAIL_ADDRESS")
    if options.get('dates', False):
        entities.append("DATE_TIME")
    if options.get('financial', False):
        # Policy numbers vallen vaak onder financieel
        entities.append("NL_POLICY_NUMBER")
    
    # Als geen specifieke keuze, analyseer alles
    if not entities:
        entities = None  # None = alle entities
    
    return entities

def detect_pii_columns(columns: List[str]) -> List[str]:
    """Simpele heuristiek om kolommen te markeren in de preview."""
    suspicious = []
    keywords = [
        "naam", "name", "klant", "cliënt", "mail", "tel", "mobiel", 
        "iban", "rekening", "adres", "postcode", "woonplaats", 
        "bsn", "sofi", "geboren", "geboorte", "premie", "salaris",
        "polis", "verzekering", "makelaar"
    ]
    for col in columns:
        if any(kw in col.lower() for kw in keywords):
            suspicious.append(col)
    return suspicious

def analyze_text(text: str, entities: Optional[List[str]] = None, language: str = "nl") -> List[RecognizerResult]:
    """Analyseer text voor PII entities."""
    if not text or not isinstance(text, str) or len(text.strip()) == 0:
        return []
    
    try:
        results = analyzer.analyze(
            text=text,
            entities=entities,
            language=language,
            return_decision_process=False
        )
        return results
    except Exception as e:
        print(f"Error analyzing text: {e}")
        return []

def anonymize_text(text: str, results: List[RecognizerResult]) -> str:
    """Anonimiseer text met specifieke labels per entity type."""
    if not results:
        return text
    
    try:
        # Maak operators per entity type voor specifieke labels
        operators = {}
        for result in results:
            label = get_entity_label(result.entity_type)
            operators[result.entity_type] = OperatorConfig("replace", {"new_value": label})
        
        anonymized_result = anonymizer.anonymize(
            text=text,
            analyzer_results=results,
            operators=operators
        )
        return anonymized_result.text
    except Exception as e:
        print(f"Error anonymizing text: {e}")
        return text

# --- ENDPOINTS ---

@app.post("/api/preview")
async def preview_file(file: UploadFile = File(...)):
    """Leest de file, geeft eerste 10 rijen en suggesties terug."""
    try:
        contents = await file.read()
        buffer = io.BytesIO(contents)
        
        # Lees Excel of CSV
        if file.filename.endswith('.csv'):
            df = pd.read_csv(buffer)
        else:
            df = pd.read_excel(buffer)
        
        # Vervang NaN door empty string voor JSON compatibiliteit
        df = df.fillna("")
        
        # Prepareer response
        preview_rows = df.head(10).to_dict(orient="records")
        columns = list(df.columns)
        suggested = detect_pii_columns(columns)
        
        return {
            "columns": columns,
            "rows": preview_rows,
            "suggested_pii_columns": suggested
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fout bij lezen bestand: {str(e)}")

@app.post("/api/deep-analyze")
async def deep_analyze_file(
    file: UploadFile = File(...),
    options: str = Form(...)
):
    """
    Diepgaande analyse van ALLE kolommen.
    Retourneert per cel de originele waarde EN gedetecteerde entities.
    """
    try:
        # Parse options
        opts = json.loads(options)
        entities_to_find = get_entities_to_analyze(opts)
        
        contents = await file.read()
        buffer = io.BytesIO(contents)
        
        # Lees bestand
        if file.filename.endswith('.csv'):
            df = pd.read_csv(buffer)
        else:
            df = pd.read_excel(buffer)
        
        df = df.fillna("")
        
        # Analyseer eerste 10 rijen
        preview_df = df.head(10)
        columns = list(df.columns)
        
        # Datastructuur voor response
        analyzed_rows = []
        column_stats = defaultdict(lambda: defaultdict(int))
        
        for idx, row in preview_df.iterrows():
            analyzed_row = {}
            
            for col in columns:
                cell_value = row[col]
                text_value = str(cell_value) if pd.notna(cell_value) and cell_value != "" else ""
                
                # Analyseer deze cel
                entities_found = []
                if text_value:
                    results = analyze_text(text_value, entities_to_find, "nl")
                    
                    for result in results:
                        entities_found.append({
                            "type": result.entity_type,
                            "start": result.start,
                            "end": result.end,
                            "score": result.score,
                            "text": text_value[result.start:result.end]
                        })
                        
                        # Update stats
                        column_stats[col][result.entity_type] += 1
                
                # Genereer preview (geanonimiseerde versie)
                preview_text = text_value
                if entities_found:
                    # Sorteer entities van achter naar voren om indices te behouden
                    sorted_entities = sorted(entities_found, key=lambda x: x['start'], reverse=True)
                    for entity in sorted_entities:
                        label = get_entity_label(entity['type'])
                        preview_text = preview_text[:entity['start']] + label + preview_text[entity['end']:]
                
                analyzed_row[col] = {
                    "original": text_value,
                    "entities": entities_found,
                    "preview": preview_text,
                    "has_pii": len(entities_found) > 0
                }
            
            analyzed_rows.append(analyzed_row)
        
        # Bepaal suggesties op basis van content + kolomnaam
        suggested_columns = []
        for col in columns:
            # Check of kolom PII bevat (via content of naam)
            has_content_pii = any(stat > 0 for stat in column_stats[col].values())
            has_name_match = col in detect_pii_columns([col])
            
            if has_content_pii or has_name_match:
                suggested_columns.append(col)
        
        return {
            "columns": columns,
            "rows": analyzed_rows,
            "column_analysis": dict(column_stats),
            "suggested_pii_columns": suggested_columns
        }
        
    except Exception as e:
        print(f"Deep analyze error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fout bij deep analyze: {str(e)}")

@app.post("/api/anonymize")
async def anonymize_file(
    file: UploadFile = File(...),
    options: str = Form(...),
    target_columns: str = Form(...)
):
    """
    Anonimiseer het bestand.
    Target_columns bepaalt welke kolommen geanonimiseerd worden.
    Options bepaalt welke types PII gezocht worden.
    """
    try:
        # Parse parameters
        opts = json.loads(options)
        targets = json.loads(target_columns)
        
        # Bepaal welke entities we zoeken
        entities_to_find = get_entities_to_analyze(opts)
        
        contents = await file.read()
        buffer = io.BytesIO(contents)
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(buffer)
        else:
            df = pd.read_excel(buffer)
        
        df = df.fillna("")
        
        # --- VERBETERDE ANONIMISEER LOOP ---
        # Alleen kolommen die gebruiker heeft geselecteerd
        for col in targets:
            if col not in df.columns:
                continue
            
            def process_cell(val):
                """Process één cel met Presidio's volledige kracht."""
                text_val = str(val) if pd.notna(val) and val != "" else ""
                if not text_val:
                    return val
                
                # Gebruik Presidio voor detectie
                results = analyze_text(text_val, entities_to_find, "nl")
                
                if results:
                    # Anonimiseer met specifieke labels
                    anonymized = anonymize_text(text_val, results)
                    return anonymized
                
                return text_val
            
            # Pas toe op kolom
            df[col] = df[col].apply(process_cell)
        
        # Schrijf output
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False)
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=anon_{file.filename}"}
        )
    
    except Exception as e:
        print(f"Anonymize error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fout bij anonimiseren: {str(e)}")

