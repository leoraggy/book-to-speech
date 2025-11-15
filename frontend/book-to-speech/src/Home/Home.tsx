import React, { useState } from "react";
import styles from "./Home.module.css";

type Atmosphere = "Mysterious" | "Elated" | "Angry" | "Neutral";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [gender, setGender] = useState("female");
  const [mp3Name, setMp3Name] = useState("output.mp3");
  const [speed, setSpeed] = useState<number>(1);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("Neutral");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    if (f) setText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!file && !text.trim()) {
      setMessage("Please provide either a file or paste text.");
      return;
    }

    setIsLoading(true);
    setAudioUrl(null); // clear any previous audio

    const payload = {
      fileName: file?.name ?? null,
      text: text
        ? `${text.slice(0, 200)}${text.length > 200 ? "…" : ""}`
        : null,
      gender,
      mp3Name,
      speed,
      atmosphere,
    };

    console.log("Submitting payload:", payload);

    // 1) Call format-text to get annotated text
    const formatRes = await fetch("http://localhost:3000/api/format-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!formatRes.ok) {
      setIsLoading(false);
      setMessage("Error formatting text.");
      console.error(await formatRes.text());
      return;
    }

    const formatJson = await formatRes.json();
    const annotatedText = formatJson.annotatedText;
    console.log("Annotated text:", annotatedText);

    // 2) Call /api/elevens to get the MP3 file
    const elevensRes = await fetch("http://localhost:3000/api/elevens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: annotatedText,
      }),
    });

    if (!elevensRes.ok) {
      setIsLoading(false);
      console.error("Error from backend:", await elevensRes.text());
      setMessage("Error generating audio.");
      return;
    }

    // Get MP3 as a Blob and create an object URL
    const blob = await elevensRes.blob();
    const url = URL.createObjectURL(blob);

    setAudioUrl(url);
    setIsLoading(false);
    setMessage("✓ Your audio is ready!");
  };

  const handleReset = () => {
    setFile(null);
    setText("");
    setGender("female");
    setMp3Name("output.mp3");
    setSpeed(1);
    setAtmosphere("Neutral");
    setMessage(null);
    setAudioUrl(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <h1 className={styles.heading}>📚 Book to Speech</h1>
        <p className={styles.tagline}>
          Transform your text into natural-sounding audio
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Content Input Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Content</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <div className={styles.labelText}>Upload a file</div>
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              {file && (
                <span className={styles.fileName}>✓ {file.name}</span>
              )}
            </label>
          </div>

          <div className={styles.divider}>or</div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <div className={styles.labelText}>Paste your text</div>
              <textarea
                rows={6}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value) setFile(null);
                }}
                placeholder="Paste your book or text here..."
                className={styles.textarea}
              />
            </label>
            {text && (
              <div className={styles.charCount}>
                {text.length} characters
              </div>
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Voice Settings</h2>

          <div className={styles.gridTwoCol}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <div className={styles.labelText}>Narrator Gender</div>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={styles.select}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <div className={styles.labelText}>Atmosphere</div>
                <select
                  value={atmosphere}
                  onChange={(e) =>
                    setAtmosphere(e.target.value as Atmosphere)
                  }
                  className={styles.select}
                >
                  <option value="Neutral">Neutral</option>
                  <option value="Mysterious">Mysterious</option>
                  <option value="Elated">Elated</option>
                  <option value="Angry">Angry</option>
                </select>
              </label>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <div className={styles.labelText}>
                Narration Speed:{" "}
                <span className={styles.speedValue}>
                  {speed.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.speedHints}>
                <span>0.5×</span>
                <span>Normal</span>
                <span>2×</span>
              </div>
            </label>
          </div>
        </div>

        {/* Output Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Output</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <div className={styles.labelText}>MP3 Filename</div>
              <input
                type="text"
                value={mp3Name}
                onChange={(e) => setMp3Name(e.target.value)}
                className={styles.textInput}
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionButtons}>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? "Processing..." : "Create Audio"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetButton}
          >
            Reset
          </button>
        </div>

        {/* Message */}
        {message && <div className={styles.message}>{message}</div>}

        {/* Preview Card */}
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <h3>Preview</h3>
          </div>
          <div className={styles.previewGrid}>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>File</span>
              <span className={styles.previewValue}>
                {file ? file.name : "—"}
              </span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Text Length</span>
              <span className={styles.previewValue}>
                {text.length} chars
              </span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Gender</span>
              <span className={styles.previewValue}>{gender}</span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Speed</span>
              <span className={styles.previewValue}>
                {speed.toFixed(1)}×
              </span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Atmosphere</span>
              <span className={styles.previewValue}>{atmosphere}</span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Output</span>
              <span className={styles.previewValue}>{mp3Name}</span>
            </div>
          </div>
        </div>

        {/* 🔽 Download button at the bottom */}
        {audioUrl && (
          <div className={styles.downloadSection}>
            <a
              href={audioUrl}
              download={mp3Name || "output.mp3"}
              className={styles.submitButton}
            >
              ⬇️ Download MP3
            </a>
          </div>
        )}
      </form>
    </div>
  );
}
