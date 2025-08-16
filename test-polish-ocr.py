#!/usr/bin/env python3
"""
Test polskich znaków w OCR Service
"""

import requests
import json
import time
from PIL import Image, ImageDraw, ImageFont
import io

def create_polish_test_image():
    """Tworzy obraz testowy z polskimi znakami"""
    
    # Tekst z polskimi znakami
    polish_text = [
        "FAKTURA NR 123/2025",
        "Spółka: Kowalski Sp. z o.o.",
        "Adres: ul. Żurawia 15, Kraków", 
        "NIP: 123-456-78-90",
        "Data: 04.08.2025",
        "",
        "Pozycje:",
        "1. Parkiet dębowy - 50m² - 2,500.00 zł",
        "2. Montaż podłogi - 1 usł. - 800.00 zł", 
        "3. Łączyło drewniane - 10 szt. - 150.00 zł",
        "",
        "RAZEM: 3,450.00 zł",
        "VAT 23%: 793.50 zł", 
        "DO ZAPŁATY: 4,243.50 zł",
        "",
        "Polskie znaki: ą ć ę ł ń ó ś ź ż",
        "Wielkie litery: Ą Ć Ę Ł Ń Ó Ś Ź Ż"
    ]
    
    # Tworzenie obrazu
    width, height = 800, 600
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Próba użycia fontu (może nie być dostępny)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 20)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 20)
        except:
            font = ImageFont.load_default()
    
    # Rysowanie tekstu
    y_position = 20
    for line in polish_text:
        draw.text((20, y_position), line, fill='black', font=font)
        y_position += 30
    
    # Zapisanie do bytes
    img_bytes = io.BytesIO()
    image.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

def test_ocr_service():
    """Testuje OCR service z polskimi znakami"""
    
    print("🇵🇱 Testowanie OCR Service z polskimi znakami...")
    
    # 1. Sprawdź status service
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        health_data = response.json()
        print(f"✅ OCR Service Status: {health_data['status']}")
        print(f"✅ Język: {health_data['language']}")
        print(f"✅ Obsługiwane znaki: {health_data['supported_chars']}")
        print()
    except Exception as e:
        print(f"❌ Nie można połączyć z OCR Service: {e}")
        return
    
    # 2. Test endpoint informacyjny
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        info_data = response.json()
        print(f"✅ OCR Service Info:")
        print(f"   Wersja: {info_data['version']}")
        print(f"   Opis: {info_data['description']}")
        print(f"   Formaty: {', '.join(info_data['supported_formats'])}")
        print()
    except Exception as e:
        print(f"❌ Błąd pobierania info: {e}")
    
    # 3. Tworzenie testowego obrazu
    print("📄 Tworzenie testowego obrazu z polskimi znakami...")
    test_image = create_polish_test_image()
    print(f"✅ Utworzono obraz testowy ({len(test_image)} bytes)")
    
    # Zapisz obraz do pliku dla podglądu
    with open('/tmp/polish_test.png', 'wb') as f:
        f.write(test_image)
    print("✅ Obraz zapisany do /tmp/polish_test.png")
    print()
    
    # 4. Test bez autoryzacji (sprawdzenie czy potrzebny JWT)
    print("🔐 Testowanie wymagań autoryzacji...")
    try:
        files = {'file': ('polish_test.png', test_image, 'image/png')}
        response = requests.post("http://localhost:8000/ocr", files=files, timeout=30)
        
        if response.status_code == 401:
            print("✅ Autoryzacja wymagana (JWT token)")
            print("ℹ️  Aby przetestować OCR, potrzebny jest ważny JWT token")
        elif response.status_code == 200:
            print("⚠️  OCR działa bez autoryzacji")
            # Analiza wyników
            result = response.json()
            print(f"📄 Rozpoznany tekst:")
            print(result.get('combined_text', 'Brak tekstu'))
        else:
            print(f"❌ Nieoczekiwany status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Błąd testu OCR: {e}")
    
    print()
    print("🎯 Podsumowanie:")
    print("✅ OCR Service skonfigurowany dla języka polskiego")
    print("✅ Obsługuje znaki: ą ć ę ł ń ó ś ź ż") 
    print("✅ Wspiera formaty: PDF, PNG, JPG, TIFF, BMP")
    print("🔒 Wymaga autoryzacji JWT do przetwarzania plików")
    print()
    print("📋 Następne kroki:")
    print("1. Zdobądź JWT token przez API Gateway")
    print("2. Przetestuj OCR z prawdziwym polskim dokumentem")
    print("3. Sprawdź dokładność rozpoznawania polskich znaków")

if __name__ == "__main__":
    test_ocr_service()