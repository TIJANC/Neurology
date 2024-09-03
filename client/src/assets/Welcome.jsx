import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  const styles = {
    body: {
      display: 'flex', // Flex container for vertical layout
      flexDirection: 'column', // Stack children vertically
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh', // Full viewport height
      width: '100vw', // Full viewport width
      backgroundColor: '#f0f0f0', // Background color to differentiate from image
      textAlign: 'center',
    },
    imageContainer: {
      width: '50%', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: 'url(/Logo_universita_firenze.svg)', // Image path
      backgroundSize: 'contain', // Fit the image
      backgroundRepeat: 'no-repeat', // Prevent repeating
      backgroundPosition: 'left', // Center the image
      height: '30vh', // Adjust height as needed
    },
    content: {
      backgroundColor: '#001f3f',
      padding: '40px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      color: '#fff',
      marginTop: '20px', // Add space between image and content
    },
    title: {
      fontSize: '3rem',
      marginBottom: '20px',
      color: '#C0C0C0',
    },
    subtitle: {
      fontSize: '1.5rem',
      marginBottom: '15px',
    },
    university: {
      fontSize: '1rem',
      marginBottom: '30px',
    },
    buttons: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    button: {
      padding: '15px 30px',
      fontSize: '1rem',
      color: '#001f3f',
      backgroundColor: '#C0C0C0',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease, transform 0.3s ease',
    },
    buttonHover: {
      backgroundColor: '#A9A9A9',
    },
    buttonActive: {
      backgroundColor: '#808080',
    },
  };

  const handleButtonHover = (e) => {
    e.target.style.backgroundColor = styles.buttonHover.backgroundColor;
  };

  const handleButtonLeave = (e) => {
    e.target.style.backgroundColor = styles.button.backgroundColor;
  };

  const handleButtonClick = (path) => {
    navigate(path);
  };

  return (
    <div style={styles.body}>
      {/* Image Container */}
      <div style={styles.imageContainer}></div>
      
      {/* Content Container */}
      <div style={styles.content}>
        <h1 style={styles.title}>Welcome!</h1>
        <h2 style={styles.subtitle}>Testing Neurologico</h2>
        <div style={styles.buttons}>
          <button
            style={styles.button}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
            onClick={() => handleButtonClick('/register')}
          >
            Signup
          </button>
          <button
            style={styles.button}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
            onClick={() => handleButtonClick('/login')}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
