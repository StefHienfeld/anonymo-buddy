#!/usr/bin/env python3
"""
Test script voor de custom Presidio recognizers.
Run dit script om te valideren dat alle PII patronen correct worden herkend.
"""

from main import analyzer, get_entity_label

def test_text(text: str, description: str):
    """Test een text string en print de gevonden entities."""
    print(f"\n{'='*80}")
    print(f"Test: {description}")
    print(f"{'='*80}")
    print(f"Input: {text}")
    print(f"-" * 80)
    
    results = analyzer.analyze(text=text, language='nl')
    
    if results:
        print(f"✅ {len(results)} entities gevonden:")
        for result in results:
            entity_text = text[result.start:result.end]
            label = get_entity_label(result.entity_type)
            print(f"  - {result.entity_type:20s} → {label:15s} | '{entity_text}' (confidence: {result.score:.2f})")
    else:
        print("❌ Geen entities gevonden")

def main():
    print("\n" + "="*80)
    print("PRESIDIO RECOGNIZER TEST SUITE")
    print("="*80)
    
    # Test 1: BSN nummers
    test_text(
        "BSN nummer is 123456782",
        "BSN - Plain format"
    )
    
    test_text(
        "BSN: 123-45-67-82",
        "BSN - Dashes format"
    )
    
    # Test 2: Email adressen
    test_text(
        "Mijn email is jan.jansen@example.nl",
        "Email adres"
    )
    
    # Test 3: Telefoonnummers
    test_text(
        "Bel me op 06-12345678 of +31612345678",
        "Mobiele nummers"
    )
    
    test_text(
        "Kantoor: 020-1234567",
        "Vast nummer"
    )
    
    # Test 4: IBAN
    test_text(
        "Betaal naar IBAN NL91ABNA0417164300",
        "IBAN nummer"
    )
    
    # Test 5: Postcode
    test_text(
        "Woonachtig op 1234 AB Amsterdam",
        "Postcode met spatie"
    )
    
    test_text(
        "Adres: 5678CD Rotterdam",
        "Postcode zonder spatie"
    )
    
    # Test 6: Polisnummers
    test_text(
        "Polis V0019918 bij makelaar Spithoff",
        "Polisnummer V-format"
    )
    
    test_text(
        "Contract MAK1120 actief",
        "Polisnummer MAK-format"
    )
    
    test_text(
        "Verzekering DL205078",
        "Polisnummer DL-format"
    )
    
    # Test 7: Namen
    test_text(
        "Jan Jansen heeft contact opgenomen",
        "Persoonsnaam"
    )
    
    test_text(
        "Maria de Vries uit Rotterdam",
        "Persoonsnaam met tussenvoegsel"
    )
    
    # Test 8: Organisaties
    test_text(
        "Via makelaar Vanbreda Risk & Benefits",
        "Organisatienaam"
    )
    
    # Test 9: Complexe tekst (zoals in vrije tekst veld)
    test_text(
        "De heer Jan Jansen (BSN 123456782) heeft contact opgenomen via jan.jansen@email.nl "
        "of 06-12345678. Hij woont op postcode 1234 AB en heeft polis V0019918 via makelaar Spithoff. "
        "Betaling via IBAN NL91ABNA0417164300.",
        "Complexe vrije tekst met meerdere PII types"
    )
    
    # Test 10: Edge cases
    test_text(
        "Geen PII in deze tekst, alleen nummers 12345 en woorden.",
        "Tekst zonder PII (negatieve test)"
    )
    
    print("\n" + "="*80)
    print("TEST SUITE VOLTOOID")
    print("="*80)
    print("\n✅ Controleer of alle verwachte entities zijn gedetecteerd")
    print("✅ BSN validatie moet alleen echte BSN nummers accepteren (11-proef)")
    print("✅ Confidence scores moeten >0.5 zijn voor betrouwbare detectie")
    print("\n")

if __name__ == "__main__":
    main()

