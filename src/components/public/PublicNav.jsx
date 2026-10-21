import React from 'react';
import { Link } from 'react-router-dom';

// The slim header shared by the public pages (About, Contact): wordmark, the
// two information pages, and the way into the app.
export default function PublicNav() {
  return (
    <nav className="lnd-nav">
      <div className="lnd-nav-in">
        <Link to="/" className="lnd-wordmark">
          SPOKEFOLIO
        </Link>
        <div className="lnd-nav-links">
          <Link to="/about" className="lnd-signin">
            About
          </Link>
          <Link to="/contact" className="lnd-signin">
            Contact
          </Link>
          <Link to="/login" className="lnd-signin">
            Sign in
          </Link>
          <Link to="/register" className="lnd-btn">
            Create your account
          </Link>
        </div>
      </div>
    </nav>
  );
}