import React from 'react';
import { NavLink} from 'react-router-dom'
import { BrowserRouter as Router} from 'react-router-dom';

const NavBar = () => (
    <Router>
  <nav style={styles.nav}>
    <NavLink to="/" end style={styles.link} activeStyle={styles.active}>
      Home
    </NavLink>
    <NavLink to="/login" style={styles.link} activeStyle={styles.active}>
      Login
    </NavLink>
    <NavLink to="/register" style={styles.link} activeStyle={styles.active}>
      Register
    </NavLink>
  </nav>
  </Router>
);

const styles = {
  nav: {
    padding: '1rem',
    background: '#282c34',
  },
  link: {
    margin: '0 1rem',
    color: '#ccc',
    textDecoration: 'none',
  },
  active: {
    color: '#61dafb',
    fontWeight: 'bold',
  },
};

export default NavBar;
