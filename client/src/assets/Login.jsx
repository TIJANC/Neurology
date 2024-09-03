import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

function Login() {    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing JWT token:', e);
            return null;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const API_BASE_URL = "https://neurology-server.onrender.com";

        // for development
        //axios.post("http://localhost:3001/login", { email, password })
        // for production
        axios.post(`${API_BASE_URL}/login`, { email, password })
            .then(result => {
                if (result.data.token) {
                    localStorage.setItem("token", result.data.token);
                    const decodedToken = parseJwt(result.data.token);
                    if (decodedToken && (decodedToken.role === "admin" || decodedToken.role === "superadmin")) {
                        navigate("/admin-dashboard");
                    } else {
                        navigate("/home");
                    }
                } else {
                    navigate("/register");
                    alert(result.data.message || "You are not registered to this service");
                }
            })
            .catch(err => {
                console.error(err);
                alert("An error occurred during login.");
            });
    };

    const styles = {
        container: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#001f3f', // Navy blue
        },
        formContainer: {
            backgroundColor: '#C0C0C0', // Silver
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            color: '#001f3f', // Navy blue text
            width: '300px',
        },
        title: {
            fontSize: '2rem',
            marginBottom: '20px',
            color: '#001f3f', // Navy blue
            textAlign: 'center',
        },
        input: {
            width: '100%',
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '5px',
            border: '1px solid #ccc',
        },
        button: {
            width: '100%',
            padding: '10px',
            fontSize: '1rem',
            color: '#fff',
            backgroundColor: '#001f3f', // Navy blue
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
        },
        buttonHover: {
            backgroundColor: '#00008b', // Darker navy blue
        },
        link: {
            display: 'block',
            marginTop: '10px',
            textAlign: 'center',
            color: '#001f3f', // Navy blue
            textDecoration: 'none',
        },
        linkHover: {
            textDecoration: 'underline',
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h2 style={styles.title}>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email">
                            <strong>Email</strong>
                        </label>
                        <input 
                            type="text" 
                            placeholder='Enter Email' 
                            autoComplete='on' 
                            name='email' 
                            className='form-control rounded-0' 
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password">
                            <strong>Password</strong>
                        </label>
                        <input 
                            type="password" 
                            placeholder='Enter Password' 
                            autoComplete='on' 
                            name='password' 
                            className='form-control rounded-0' 
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-success w-100 rounded-0"
                        style={styles.button}
                    >
                        Login
                    </button>
                </form>
                <p>Don't have an account?</p>
                <Link 
                    to="/register" 
                    className="btn btn-default border w-100 bg-light rounded-0 text-decoration-none"
                    style={{ ...styles.button, color: '#001f3f', backgroundColor: '#C0C0C0' }} 
                    onMouseEnter={(e) => e.target.style.backgroundColor = styles.buttonHover.backgroundColor}
                    onMouseLeave={(e) => e.target.style.backgroundColor = styles.button.backgroundColor}
                >
                    Sign Up
                </Link>
            </div>
        </div>
    );
}

export default Login;
