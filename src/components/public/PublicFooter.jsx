import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="lnd-footer">
      <div className="lnd-wrap lnd-foot-in">
        <span className="lnd-wordmark">SPOKEFOLIO</span>
        <p>
          <Link to="/about" className="lnd-signin">
            About
          </Link>{' '}
          ·{' '}
          <Link to="/contact" className="lnd-signin">
            Contact
          </Link>{' '}
          · The career knowledge base · Made by XFH Game Studio
        </p>
      </div>
    </footer>
  );
}