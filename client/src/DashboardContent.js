import React, { useContext, useState } from "react";
import { AuthContext } from "./AuthContext";

function DashboardContent() {
  const { logout, token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadMessage("");
    setUploadError("");
    setAnalysis(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadMessage("File uploaded successfully!");
        setUploadError("");
        setFile(null);

        // Call analyze API with the uploaded filename
        const analysisResponse = await fetch("http://localhost:5000/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: data.filename }),
        });

        const analysisData = await analysisResponse.json();

        if (analysisResponse.ok) {
          setAnalysis(analysisData.analysis);
        } else {
          setUploadError("Analysis failed: " + (analysisData.message || ""));
          setAnalysis(null);
        }
      } else {
        setUploadError(data.message || "Upload failed.");
        setUploadMessage("");
      }
    } catch (error) {
      setUploadError("Error uploading file.");
      setUploadMessage("");
      setAnalysis(null);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome to your Dashboard!</h2>

      <button className="btn btn-danger mb-3" onClick={logout}>
        Logout
      </button>

      <div className="mb-3">
        <input type="file" onChange={handleFileChange} />
        <button className="btn btn-primary ms-2" onClick={handleUpload}>
          Upload Photo
        </button>
      </div>

      {uploadMessage && <p className="text-success">{uploadMessage}</p>}
      {uploadError && <p className="text-danger">{uploadError}</p>}

      {analysis && (
        <div className="mt-4 p-3 border rounded bg-light">
          <h4>Skin Analysis Results</h4>
          <p>
            <strong>Skin Type:</strong> {analysis.skinType}
          </p>
          <p>
            <strong>Issues:</strong> {analysis.issues.join(", ")}
          </p>
          <p>
            <strong>Recommended Routine:</strong>
          </p>
          <ul>
            {analysis.routine.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DashboardContent;
