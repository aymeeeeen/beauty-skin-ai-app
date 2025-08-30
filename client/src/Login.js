import { useNavigate } from "react-router-dom";
import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = React.useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = React.useState("");
  const [isError, setIsError] = React.useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token); // Save token in context and localStorage
        setMessage("Login successful!");
        setFormData({ username: "", password: "" });
        login(data.token);
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);

        navigate("/dashboard"); // Redirect to dashboard
      } else {
        setMessage(data.message || "Login failed.");
        setIsError(true);
      }
    } catch (error) {
      setMessage("Error connecting to server.");
      setIsError(true);
    }
  };

  return (
    <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: "400px" }}>
      <h2 className="mb-3">Login</h2>
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
          <label htmlFor="loginUsername" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="loginUsername"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter username"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="loginPassword" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="loginPassword"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter password"
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
      </form>
    </div>
  );
}
export default Login;
