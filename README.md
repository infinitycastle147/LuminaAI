<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lumina AI - Presentation Generator

Lumina AI is a powerful presentation engine that uses Google's Gemini Models to automatically generate PowerPoint presentations from a simple topic or a file. It creates:

- **Structure**: A complete outline with slide titles and content.
- **Visuals**: AI-generated images for each slide.
- **Speech**: Professional voiceovers (TTS) for each slide.
- **Export**: Downloadable `.pptx` files.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- A Google Gemini API Key. Get one [here](https://aistudio.google.com/app/apikey).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd LuminaAI
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Setup:**

    - Copy `.env.example` to `.env.local`:
      ```bash
      cp .env.example .env.local
      ```
    - Open `.env.local` and paste your `GEMINI_API_KEY`.

4.  **Run Locally:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🛠️ Project Structure

- `App.tsx`: Main application component.
- `hooks/`: Custom hooks (e.g., `usePresentation`) for business logic.
- `components/`: UI components (`InputSection`, `SlidePreview`, etc.).
- `services/`: API integrations (`gemini.ts`) and utilities.
- `types.ts`: TypeScript definitions.

## 🐳 Deployment with Docker

You can containerize this application for easy deployment.

1.  **Build the Docker image:**
    You must provide your API key as a build argument because Vite embeds environment variables at build time.

    ```bash
    docker build --build-arg GEMINI_API_KEY=your_key_here -t lumina-ai .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 8080:80 lumina-ai
    ```
    Access the app at [http://localhost:8080](http://localhost:8080).

## 🔒 Security Note

This is a client-side application. The `GEMINI_API_KEY` is embedded in the browser code. This is suitable for:

- Local usage.
- Private deployments (internal tools).
- Demos.

**Do not** deploy this to a public URL without adding a backend proxy if you want to keep your API key secret.

## 📄 License

[MIT](LICENSE)
