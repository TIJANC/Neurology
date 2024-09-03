import React from 'react';
import { Link } from 'react-router-dom';

export const AdminNavbar = () => {
  const styles = {
    nav: {
      width: '100%',
      backgroundColor: '#001f3f', // Navy blue
      padding: '10px 0',
    },
    ul: {
      display: 'flex',
      listStyleType: 'none',
      padding: '0',
      margin: '0',
      justifyContent: 'center',
    },
    li: {
      marginRight: '20px',
    },
    link: {
      color: '#C0C0C0', // Silver
      textDecoration: 'none',
      fontSize: '1.2rem',
      transition: 'color 0.3s',
    },
    linkHover: {
      color: '#ffffff', // White on hover
    },
  };

  return (
    <nav style={styles.nav}>
      <ul style={styles.ul}>
        <li style={styles.li}>
          <Link
            to="/admin-dashboard"
            style={styles.link}
            onMouseEnter={(e) => (e.target.style.color = styles.linkHover.color)}
            onMouseLeave={(e) => (e.target.style.color = styles.link.color)}
          >
            Dashboard
          </Link>
        </li>
        <li style={styles.li}>
          <Link
            to="/ClientList"
            style={styles.link}
            onMouseEnter={(e) => (e.target.style.color = styles.linkHover.color)}
            onMouseLeave={(e) => (e.target.style.color = styles.link.color)}
          >
            Patient List
          </Link>
        </li>
      </ul>
    </nav>
  );
};
