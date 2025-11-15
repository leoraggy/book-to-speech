import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTextToSpeech = async () => {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`
      );
    } catch (error) {
    } finally {
    }
  };

  return (
    <>
      <h1>Hello</h1>
    </>
  );
}

export default App;
