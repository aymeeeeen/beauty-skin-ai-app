import React, { useState } from "react";

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Signup successful! You can now login.");
        setFormData({ username: "", password: "" });
      } else {
        setMessage(data.message || "Signup failed.");
        setIsError(true);
      }
    } catch (error) {
      setMessage("Error connecting to server.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: "400px" }}>
      <h2 className="mb-3">Signup</h2>
      {message && (
        <div
          className={`alert ${isError ? "alert-danger" : "alert-success"}`}
          role="alert"
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="signupUsername" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="signupUsername"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter username"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="signupPassword" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="signupPassword"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter password"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default Signup;
