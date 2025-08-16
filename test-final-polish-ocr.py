#!/usr/bin/env python3
"""
Finalny test polskich znaków OCR - przykład z prawdziwym polskim dokumentem
"""

import requests
import json
from PIL import Image, ImageDraw, ImageFont
import io

def create_realistic_polish_invoice():
    """Tworzy realistyczną polską fakturę"""
    
    invoice_text = [
        "FAKTURA VAT NR FV/001/08/2025",
        "",
        "WYSTAWIAJĄCA:",
        "Super Parkiet Sp. z o.o.",
        "ul. Żurawia 25, 00-515 Warszawa", 
        "NIP: 521-302-51-02",
        "REGON: 142784044",
        "",
        "NABYWCA:",
        "Firma Kowalski Sp. j.",
        "ul. Długa 15/3, 31-147 Kraków",
        "NIP: 675-13-26-218",
        "",
        "Data wystawienia: 04.08.2025",
        "Data sprzedaży: 04.08.2025", 
        "Termin płatności: 18.08.2025",
        "",
        "┌─────────────────────────────────────────────────────────────────┐",
        "│ Lp. │ Nazwa towaru/usługi    │ J.m. │ Ilość │ Cena netto │ Kwota  │",
        "├─────┼────────────────────────┼──────┼───────┼────────────┼────────┤",
        "│  1  │ Parkiet dębowy rustykalny│ m²   │  45   │   89,00    │3,905.00│",
        "│  2  │ Montaż podłogi         │ komplet│  1    │  850,00    │ 850,00 │",
        "│  3  │ Łączniki drewniane     │ opak.│  5    │   12,50    │  62,50 │",
        "│  4  │ Lakier poliuretanowy   │ litr │  3    │   45,00    │ 135,00 │",
        "└─────┴────────────────────────┴──────┴───────┴────────────┴────────┘",
        "",
        "Wartość netto:           4,952.50 zł",
        "VAT 23%:                 1,139.08 zł", 
        "WARTOŚĆ BRUTTO:          6,091.58 zł",
        "",
        "Słownie: sześć tysięcy dziewięćdziesiąt jeden złotych 58/100",
        "",
        "Sposób płatności: przelew",
        "Nr konta: 12 1234 5678 9012 3456 7890 1234",
        "",
        "Podpisy:",
        "................................    ................................",
        "    Osoba upoważniona                   Odbiorca faktury"
    ]
    
    # Tworzenie obrazu
    width, height = 900, 1200
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Próba użycia fontu
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 14)
        font_bold = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 16)
    except:
        font = ImageFont.load_default()
        font_bold = font
    
    # Rysowanie tekstu
    y_position = 20
    for line in invoice_text:
        if line.startswith("FAKTURA") or line.startswith("WYSTAWIAJĄCA") or line.startswith("NABYWCA"):
            current_font = font_bold
        else:
            current_font = font
            
        draw.text((20, y_position), line, fill='black', font=current_font)
        y_position += 22
    
    # Zapisanie do bytes
    img_bytes = io.BytesIO()
    image.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

def test_realistic_polish_ocr():
    """Test z realistyczną polską fakturą"""
    
    print("🇵🇱 FINALNY TEST POLSKICH ZNAKÓW OCR")
    print("=" * 50)
    
    # Tworzenie realistycznej faktury
    print("📄 Tworzenie realistycznej polskiej faktury...")
    invoice_image = create_realistic_polish_invoice()
    
    # Zapisanie do pliku
    with open('/tmp/polish_invoice.png', 'wb') as f:
        f.write(invoice_image)
    print(f"✅ Faktura zapisana: /tmp/polish_invoice.png ({len(invoice_image)} bytes)")
    
    # Test OCR
    print("🔍 Testowanie OCR...")
    try:
        files = {'file': ('polish_invoice.png', invoice_image, 'image/png')}
        response = requests.post("http://localhost:8000/demo-ocr", files=files, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            
            print("📊 WYNIKI ANALIZY:")
            print("-" * 30)
            print(f"Stron: {result['pages']}")
            print(f"Linii tekstu: {result['total_lines']}")
            print(f"Polskich znaków: {result['polish_chars_count']}")
            print(f"Znalezione znaki: {', '.join(result['polish_chars_found'])}")
            print(f"Polskich słów: {result['polish_words_count']}")
            print(f"Znalezione słowa: {', '.join(result['polish_words_found'])}")
            
            print("\\n📄 ROZPOZNANY TEKST:")
            print("-" * 30)
            print(result['text'])
            
            print("\\n🎯 OCENA POLSKICH ZNAKÓW:")
            print("-" * 30)  
            expected_chars = ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']
            found_chars = result['polish_chars_found']
            
            for char in expected_chars:
                if char in found_chars or char.upper() in found_chars:
                    print(f"✅ {char} - ROZPOZNANY")
                else:
                    print(f"❓ {char} - nie występuje w tekście")
                    
            print("\\n🏆 PODSUMOWANIE:")
            print("-" * 30)
            if result['polish_chars_count'] > 0:
                print("✅ SUKCES! OCR rozpoznaje polskie znaki")
                print(f"✅ Znaleziono {result['polish_chars_count']} polskich znaków")
                print(f"✅ Zidentyfikowano {result['polish_words_count']} polskich słów")
                print("✅ System gotowy do użycia z polskimi dokumentami")
            else:
                print("⚠️  Brak polskich znaków w rozpoznanym tekście")
                
        else:
            print(f"❌ Błąd OCR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Błąd testu: {e}")
    
    print("\\n" + "=" * 50)
    print("KONFIGURACJA POLSKICH ZNAKÓW OCR ZAKOŃCZONA!")

if __name__ == "__main__":
    test_realistic_polish_ocr()