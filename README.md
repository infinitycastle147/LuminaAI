<div align="center">
  <img width="1200" height="475" alt="Lumina AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  <br />
  <br />

  <h1>✨ Lumina AI - Presentation Engine</h1>
  <p>
    <b>Turn ideas into professional PowerPoint presentations in seconds using Google Gemini.</b>
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-deployment">Deployment</a> •
    <a href="#-license">License</a>
  </p>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

</div>

<br />

## 📖 About

**Lumina AI** is a next-generation presentation generator. It leverages the multimodal capabilities of **Google's Gemini 2.5 Flash** models to understand topics, structure content, design slide visuals, and even narrate your presentation.

Whether you have a simple topic idea or a complex source document, Lumina AI crafts a complete slide deck ready for export.

## 🚀 Features

- **🧠 Intelligent Outlining**: Automatically breaks down topics into logical slide structures (Title, Content, Speaker Notes).
- **🎨 AI Image Generation**: dynamic image prompting to generate unique, relevant visuals for every slide using Gemini's image generation capabilities.
- **🗣️ AI Voiceovers**: Synthesizes professional-grade speech for speaker notes using Gemini's TTS.
- **📄 Document Support**: Upload `.txt`, `.md`, or `.pdf` (text-based) files to generate presentations directly from your source material.
- **💾 PPTX Export**: One-click export to editable PowerPoint (`.pptx`) format using `pptxgenjs`.
- **⚡ Real-time Preview**: Interactive slide deck preview with navigation and audio playback.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI Models**: Google Gemini (`gemini-2.5-flash`, `gemini-2.5-flash-image`, `preview-tts`)
- **Icons**: Lucide React
- **Export**: PptxGenJS

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- A **Google Gemini API Key**. You can get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/lumina-ai.git
    cd lumina-ai
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment:**

    - Create a `.env.local` file in the root directory.
    - Add your API key:
      ```env
      GEMINI_API_KEY=your_actual_api_key_here
      ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```
    The application will start at **[http://localhost:3000](http://localhost:3000)**.

## 🐳 Deployment (Docker)

Lumina AI is container-ready. You can build and run it using Docker.

**Note:** Since this is a client-side app (SPA), the API key must be embedded at build time for the Vite build process.

1.  **Build the Image:**

    ```bash
    docker build --build-arg GEMINI_API_KEY=your_key_here -t lumina-ai .
    ```

2.  **Run the Container:**
    ```bash
    docker run -d -p 8080:80 lumina-ai
    ```
    Your app is now running at `http://localhost:8080`.

## 📂 Project Structure

```
LuminaAI/
├── src/
│   ├── components/      # UI Components (Input, Preview, VideoPlayer)
│   ├── hooks/           # Custom React Hooks (usePresentation)
│   ├── services/        # API Handling (Gemini, Audio, PPTX)
│   ├── types.ts         # TypeScript Definitions
│   ├── App.tsx          # Main Application Entry
│   └── index.css        # Tailwind Imports
├── public/              # Static Assets
├── Dockerfile           # Production Build Configuration
├── nginx.conf           # Nginx Configuration for SPA
├── vite.config.ts       # Vite Configuration
└── README.md            # Project Documentation
```

## 🔒 Security & Best Practices

- **Client-Side Keys**: This project currently uses client-side API calls. This is perfect for hackathons, demos, and internal tools.
- **Production Use**: For public-facing production apps, it is highly recommended to move the API calls to a backend server (Node/Express, Python, etc.) to keep your `GEMINI_API_KEY` secret.

## 🤝 Contributing

Contributions are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
