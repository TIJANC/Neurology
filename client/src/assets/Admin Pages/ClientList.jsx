import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AdminNavbar } from '../AdminNavbar';

function ClientList() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get('http://localhost:3001/admin-dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        // Filter out admins
        const users = response.data.employees.filter(
          (employee) => employee.role !== 'admin'
        );
        setEmployees(users);
        setFilteredEmployees(users); // Initialize filtered employees with all users
      })
      .catch((error) => {
        console.error('Access denied:', error);
        alert('Access denied. You do not have permission to view this page.');
        navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    // Filter employees based on search query
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  const handleNameClick = (name) => {
    navigate(`/user-information/${name}`);
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#001f3f', // Navy blue
      minHeight: '100vh',
      color: '#C0C0C0', // Silver
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px',
      fontSize: '2rem',
    },
    searchBar: {
      width: '20%',
      padding: '10px',
      marginBottom: '20px',
      fontSize: '1rem',
      borderRadius: '5px',
      border: '1px solid #ddd',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '20px',
    },
    th: {
      padding: '10px',
      border: '1px solid #ddd',
      backgroundColor: '#f4f4f4',
    },
    td: {
      padding: '10px',
      border: '1px solid #ddd',
    },
    clickableTd: {
      fontWeight: 'bold',
      padding: '10px',
      border: '1px solid #ddd',
      color: '#C0C0C0',
      cursor: 'pointer',
    },
    clickableTdHover: {
      color: '#007bff',
    },
  };

  return (
    <div style={styles.container}>
      <AdminNavbar />
      <h1 style={styles.header}>Patients</h1>
      <input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={styles.searchBar}
      />
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => (
            <tr key={employee._id}>
              <td
                style={styles.clickableTd}
                onClick={() => handleNameClick(employee.name)}
                onMouseOver={(e) => e.currentTarget.style.color = styles.clickableTdHover.color}
                onMouseOut={(e) => e.currentTarget.style.color = styles.clickableTd.color}
              >
                {employee.name}
              </td>
              <td style={styles.td}>{employee.email}</td>
              <td style={styles.td}>{employee.role}</td>
            </tr>
          ))}
          {filteredEmployees.length === 0 && (
            <tr>
              <td colSpan="3" style={styles.td}>No matching records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ClientList;
