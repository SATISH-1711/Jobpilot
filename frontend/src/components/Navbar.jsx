import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">JobPilot</span>
        <nav className="nav-links">
          <NavLink to="/" end>
            Board
          </NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/analyzer">Analyzer</NavLink>
        </nav>
        <div className="nav-user">
          <NotificationBell />
          <span className="muted">{user.username}</span>
          <button className="btn" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}