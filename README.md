# E-Learning Platform - Web 3.0

Nowoczesna platforma edukacyjna dedykowana nauczaniu Web 3.0, oferująca kompleksowe kursy, interaktywne lekcje, quizy i system śledzenia postępów.

## Główne Cechy

- **Bezpieczna autentykacja** - Logowanie za pomocą magic link wysylanego na email
- **Kompleksowe kursy** - Strukturyzowane kursy z lekcjami i quizami
- **Interaktywne quizy** - Oceniane automatycznie testy z oceną i wyjaśnieniami
- **Śledzenie postępów** - Monitorowanie czytanych lekcji i przechodzonych quizów
- **Ranking globalny** - Tablica liderów pokazująca najlepszych uczestników
- **Dwujęzyczny interfejs** - Wsparcie dla angielskiego i polskiego

## Technologia

### Backend
- **Node.js** - Środowisko uruchomieniowe
- **Express.js** - Framework web
- **MongoDB** - Baza danych
- **Mongoose** - ODM do MongoDB
- **Google Gmail API** - Wysyłanie maili z magic linkkami
- **express-session** - Zarządzanie sesjami użytkownika

### Frontend
- **React** - Biblioteka UI (18.3.1)
- **React DOM** - Renderowanie w przeglądarce

### Bezpieczeństwo
- **bcrypt** - Haszowanie haseł
- **express-session** - Bezpieczne sesje z HttpOnly cookies

## Instalacja

### Wymagania
- Node.js (v16+)
- MongoDB
- Konto Google Cloud (dla Google Gmail API)

### Kroki instalacji

1. **Klonuj repozytorium**
```bash
git clone https://github.com/marekhennig/elearning_platform.git
cd elearning_platform
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Skonfiguruj zmienne środowiskowe**

Utwórz plik `.env` w głównym katalogu projektu:

```env
# Server Configuration
PORT=3000
HOST=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/elearning_platform

# Gmail Configuration
MAIL_USER=your-email@gmail.com
CLIENT_ID=your-google-client-id
CLIENT_SECRET=your-google-client-secret
REFRESH_TOKEN=your-google-refresh-token

# Session
SESSION_SECRET=your-secret-key
```

4. **Uruchom serwer**
```bash
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

## Konfiguracja Google Gmail API

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Stwórz nowy projekt
3. Włącz Gmail API
4. Utwórz OAuth 2.0 Client ID
5. Skonfiguruj refresh token
6. Dodaj dane do pliku `.env`

## Struktura Projektu

```
src/
├── server.js           # Główny plik serwera z routami
├── models/
│   ├── User.js         # Model użytkownika
│   ├── Course.js       # Model kursu
│   ├── Lesson.js       # Model lekcji
│   ├── Quiz.js         # Model quizu
│   └── QuizAttempt.js  # Model prób quizowych
└── public/
    ├── index.html      # Strona logowania
    └── dashboard.html  # Pulpit użytkownika
```

## API Endpoints

### Autentykacja
- `POST /auth` - Wysłanie magic link na email
- `GET /verify?token=<token>` - Weryfikacja magic link
- `POST /logout` - Wylogowanie

### Kursy
- `GET /api/courses` - Lista wszystkich kursów z postępami użytkownika
- `GET /api/courses/:id` - Szczegóły konkretnego kursu
- `GET /api/courses/:id/lessons` - Lekcje w kursie
- `GET /api/courses/:id/quiz` - Quiz przypisany do kursu

### Lekcje
- `GET /api/lessons/:id` - Szczegóły lekcji
- `POST /api/lessons/:id/read` - Oznaczenie lekcji jako przeczytanej

### Quizy
- `POST /api/quizzes/:id/submit` - Przesłanie odpowiedzi quizu
- `GET /api/quizzes/:id/results` - Historia prób quizowych

### Użytkownik
- `GET /api/user` - Informacje o aktualnym użytkowniku
- `GET /api/leaderboard` - Tablica liderów (top 10)

## Jak Używać

1. Zaloguj się - Podaj swój email, otrzymasz magic link
2. Otwórz dashboard - Przejdź do pulpitu użytkownika
3. Wybierz kurs - Przeglądaj dostępne kursy
4. Czytaj lekcje - Zapoznaj się z materiałami
5. Przejdź quiz - Oceń swoją wiedzę
6. Śledzenie postępów - Obserwuj swoje osiągnięcia

## Licencja

ISC

## Autor

Marek Hennig

## Wsparcie

W przypadku pytań lub problemów, prosimy otworzyć [GitHub Issue](https://github.com/marekhennig/elearning_platform/issues).

---

Uwaga: Ten projekt jest przeznaczony dla celów edukacyjnych. Pamiętaj o bezpiecznym przechowywaniu wrażliwych informacji oraz o konfiguracji CORS i bezpieczeństwa dla wdrożenia produkcyjnego.
