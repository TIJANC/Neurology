import React from 'react';
import { AdminNavbar } from './AdminNavbar';

function AdminDashboard() {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#001f3f', // Navy blue
      color: '#C0C0C0', // Silver
    },
    header: {
      fontSize: '2.5rem',
      marginBottom: '20px',
    },
  };

  return (
    <div style={styles.container}>
      <AdminNavbar />
      <h1 style={styles.header}>Welcome Doctor!</h1>
    </div>
  );
}

export default AdminDashboard;
