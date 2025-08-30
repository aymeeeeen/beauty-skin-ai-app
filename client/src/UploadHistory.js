import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

function UploadHistory() {
  const { token } = useContext(AuthContext);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchUploads = async () => {
      setLoading(true);
      setError("");
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

  if (loading) return <p>Loading upload history...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (uploads.length === 0) return <p>No uploads found.</p>;

  return (
    <div>
      <h3>Your Upload History</h3>
      <div className="row">
        {uploads.map(({ filename, timestamp, analysis }, index) => (
          <div key={index} className="col-md-4 mb-4">
            <div className="card">
              <img
                src={`http://localhost:5000/uploads/${filename}`}
                alt="Skin upload"
                className="card-img-top"
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default UploadHistory;
