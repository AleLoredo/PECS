# PECS for Luka

## Overall Description

PECS for Luka is an augmentative and alternative communication (AAC) built to be a free, interactive, customizable, lightweight, reliable tool for kids with a language expresssion disorder.
Designed as a Progressive Web App (PWA) it can be downloaded with a single click on any touchscreen handheld that has a modern browser and continue to be used even without an active internet connection by making use of build in Text to Speech engines present in modern devices.
PECS for Luka allows for operation in both english and spanish, and the customization of all voice settings suchs as: 
- Speed of speech
- Pitch
- Volume
The app also includes a dark mode setting to reduce potential eye strain.
PECS provides an audio-visual-tactile interactive experience with content organized in a phased approach to adress the needs of children like Luka and to help them communicate using images and sound. 
## Key Features

*   **Phased Interface**: Communication elements are organized into six distinct phases. Each phase can display images in multiple columns, allowing for a structured learning or communication progression.
*   **Image-Based Communication**: Users interact by selecting images. Clicking on an image triggers Text-to-Speech (TTS) output of the word or phrase associated with that image.
*   **Text-to-Speech (TTS) Customization**:
    *   **Language Selection**: Choose the preferred language for TTS voices (e.g., English, Spanish, with regional variations available based on browser support).
    *   **Voice Choice**: Select from a list of available voices, filtered by the chosen language.
    *   **Speech Adjustments**: Fine-tune the speech rate, pitch, and volume to suit user preference.
    *   **Persistent Settings**: TTS configurations are saved locally in the browser.
*   **Appearance Customization**:
    *   **Themes**: Select between Light, Dark, or System default themes for visual comfort.
    *   **Persistent Theme**: The chosen theme is saved locally.
*   **Progressive Web App (PWA)**:
    *   **Installable**: Can be installed on supported devices (desktops, mobile) for a native app-like experience directly from the browser.
    *   **Offline Capability**: Core application assets are cached using a Service Worker, allowing for offline use after the first visit.
*   **Multi-language Data**:
    *   Image descriptions, alt text, and speech text are available in English and Spanish.
    *   The application dynamically loads the appropriate language data from CSV files based on the selected TTS language.
*   **Application Reset/Refresh**:
    *   A dedicated button (labeled with the application title "PECS for Luka" in the header) allows users to reset the application.
    *   This action clears all cached application data (including images and CSV data) and unregisters the Service Worker, then performs a fresh reload of the application. A confirmation prompt is displayed to prevent accidental resets. This is useful for applying updates or troubleshooting.

## Technologies Used

*   **HTML5**: For the basic structure of the application.
*   **Tailwind CSS**: For modern and responsive styling.
*   **JavaScript (ES6+)**: For application logic, interactivity, and PWA features.
*   **Service Worker API**: For offline support, caching strategies, and PWA lifecycle management.
*   **CSV (Comma-Separated Values) files**: For managing and loading the image metadata, speech text, and language translations.

## Options Menu

The application features a comprehensive options menu (accessible via the hamburger icon in the header) allowing users to customize their experience:

*   **Appearance Settings**:
    *   **Modo de Visualización (Display Mode)**: Choose between "Claro" (Light), "Oscuro" (Dark), or "Automático (Sistema)" (System) themes.
*   **Voice (Text-to-Speech) Settings**:
    *   **Idioma para Voces (Language for Voices)**: Select the base language for TTS (e.g., English, Spanish). This filters the available voices and determines which data CSV is loaded.
    *   **Voz (Voice)**: Choose a specific voice from the list populated based on the selected language and browser capabilities.
    *   **Velocidad (Rate)**: Adjust the speed of the speech.
    *   **Tono (Pitch)**: Adjust the pitch of the speech.
    *   **Volumen (Volume)**: Adjust the volume of the speech.
    *   **Probar Voz (Test Voice)**: A button to test the current TTS settings with a sample phrase.
*   **Aplicar Cambios (Apply Changes)**: Saves all selected options to local storage and applies them. If the TTS language is changed, the relevant data CSV will be reloaded.

## Data Management

The application's content, specifically the images, their spoken text, and alternative text, is managed externally through CSV files:

*   `eng_fase_data.csv`: Contains data for the English language.
*   `esp_fase_data.csv`: Contains data for the Spanish language.
*   `langs.csv`: Contains a list of languages and their codes used to populate the TTS language selector.

When the TTS language is selected in the options menu, the application dynamically fetches and parses the corresponding CSV file (e.g., `esp_fase_data.csv` if Spanish is chosen) to populate the images and speech text for each phase.

## Refresh Functionality

The main application title "PECS for Luka" in the header of the main screen also functions as a **Reset/Refresh button**:

*   **Purpose**: This button is designed to provide a way to completely reset the application's cached state. This can be useful if new data or features have been deployed and the application isn't updating correctly, or for general troubleshooting.
*   **Action**:
    1.  A confirmation modal appears asking the user to confirm the action.
    2.  If confirmed, the application will:
        *   Delete the current Service Worker cache (e.g., `fases-app-cache-v1.2`).
        *   Unregister the active Service Worker.
        *   Force a full reload of the page from the server.
*   **Impact**: This ensures that all resources are freshly fetched from the network, and no outdated cached data or service worker logic interferes with the application.
