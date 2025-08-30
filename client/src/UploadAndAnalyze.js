import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

function UploadAndAnalyze() {
  const { token } = useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage("");
    setAnalysis(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setAnalysis(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      // Upload image
      const uploadResponse = await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error("Upload failed:", errorData);
        setMessage(errorData.message || "Upload failed.");
        setLoading(false);
        return;
      }

      const uploadData = await uploadResponse.json();
      console.log("Upload response:", uploadData);

      setMessage("Image uploaded successfully! Analyzing...");

      // Analyze uploaded image
      const analyzeResponse = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: uploadData.filename }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        console.error("Analysis failed:", errorData);
        setMessage(errorData.message || "Analysis failed.");
        setLoading(false);
        return;
      }

      const analyzeData = await analyzeResponse.json();
      console.log("Analysis response:", analyzeData);

      setMessage("Analysis completed!");
      setAnalysis(analyzeData.analysis);
    } catch (error) {
      console.error("Upload or analysis error:", error);
      setMessage("Error uploading or analyzing image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload Skin Photo</h2>

      {message && (
        <p
          style={{
            color:
              message.includes("failed") || message.includes("Error")
                ? "red"
                : "green",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
        />
        <br />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Upload and Analyze"}
        </button>
      </form>

      {loading && <p>Loading, please wait...</p>}

      {analysis && (
        <div>
          <h3>Skin Analysis Results:</h3>
          <p>
            <strong>Skin Type:</strong> {analysis.skinType}
          </p>
          <p>
            <strong>Issues:</strong> {analysis.issues.join(", ")}
          </p>
          <h4>Recommended Routine:</h4>
          <ul>
            {analysis.routine.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UploadAndAnalyze;
