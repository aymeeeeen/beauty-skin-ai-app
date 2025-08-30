import React, { useEffect, useState } from "react";

function App() {
  const [backendData, setBackendData] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((res) => res.text())
      .then((data) => setBackendData(data));
  }, []);

  return (
    <div>
      <h1>Beauty Skin AI App</h1>
      <p>Backend says: {backendData}</p>
    </div>
  );
}

export default App;
