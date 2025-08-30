import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

function DashboardContent() {
  const { logout, token } = useContext(AuthContext);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await fetch("http://localhost:5000/uploads", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch uploads");
        }

        const data = await response.json();
        setUploads(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, [token]);

  return (
    <div className="dashboard-container">
      <h2>Welcome to your Dashboard!</h2>

      <button className="btn btn-danger mb-3" onClick={logout}>
        Logout
      </button>

      {loading && <p>Loading your uploads...</p>}

      {error && <p className="text-danger">Error: {error}</p>}

      {!loading && uploads.length === 0 && <p>No uploads found.</p>}

      <div className="upload-history">
        {uploads.map(({ filename, timestamp, analysis }, index) => (
          <div key={index} className="card mb-3" style={{ maxWidth: "400px" }}>
            <img
              src={`http://localhost:5000/uploads/${filename}`}
              alt="Skin upload"
              className="card-img-top"
              style={{ maxHeight: "300px", objectFit: "cover" }}
            />
            <div className="card-body">
              <p>
                <strong>Uploaded:</strong>{" "}
                {new Date(timestamp).toLocaleString()}
              </p>
              {analysis ? (
                <>
                  <p>
                    <strong>Skin Type:</strong> {analysis.skinType}
                  </p>
                  <p>
                    <strong>Issues:</strong> {analysis.issues.join(", ")}
                  </p>
                </>
              ) : (
                <p>Analysis pending...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardContent;
