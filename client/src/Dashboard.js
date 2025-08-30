import React, { useContext } from "react";
import { AuthContext } from "./AuthContext";
import Login from "./Login";
import DashboardContent from "./DashboardContent";

function Dashboard() {
  const { token } = useContext(AuthContext);

  if (!token) {
    return <Login />;
  }
  return <DashboardContent />;
}

export default Dashboard;
