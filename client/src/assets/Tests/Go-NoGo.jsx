import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GoNoGo = () => {
  const [trialIndex, setTrialIndex] = useState(0);
  const [showArrow, setShowArrow] = useState(false);
  const [trialStartTime, setTrialStartTime] = useState(null);
  const [responses, setResponses] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [trialDuration] = useState(1000); 
  const [arrowDisplayTime] = useState(200); 
  const [name, setName] = useState(''); // State to store user name
  const [initialDelay, setInitialDelay] = useState(true); // State to handle initial delay
  const navigate = useNavigate();
  const buttonPressTime = useRef(null);

  useEffect(() => {
    // Initialize trials
    const trialArrows = generateTrials();
    setArrows(trialArrows);

    // Decode token to get user name
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.name) {
        setName(decoded.name);
      } else {
        console.error('Token does not contain a valid name');
      }
    } else {
      console.error('No token found');
    }
  }, []);

  useEffect(() => {
    if (trialIndex >= arrows.length) {
      // Test is completed, send results to the backend
      const completionDate = new Date().toISOString();

      if (name) {
        const API_BASE_URL = "https://neurology-server.onrender.com";
        // for development
        // axios.post('http://localhost:3001/api/results', {
        // for production
        axios.post(`${API_BASE_URL}/api/results`, {
          name,
          responses,
          test: 'GoNoGo',
          completionDate
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        }).then(response => {
          console.log('Results saved:', response.data);
        }).catch(error => {
          console.error('Error saving results:', error);
        });
      }

      return;
    }

    if (initialDelay) {
      // Apply initial delay before starting trials
      const delayTimer = setTimeout(() => {
        setInitialDelay(false);
      }, 2000); // 2 seconds initial delay

      return () => clearTimeout(delayTimer);
    }

    // Start a new trial
    setTrialStartTime(Date.now());
    setButtonPressed(false);
    buttonPressTime.current = null;

    // Show the arrow for 200ms
    setShowArrow(true);
    const arrowTimer = setTimeout(() => {
      setShowArrow(false);
    }, arrowDisplayTime);

    // Move to the next trial after 1 second
    const trialTimer = setTimeout(() => {
      const trialEndTime = Date.now();
      const reactionTime = buttonPressTime.current ? trialEndTime - buttonPressTime.current : null;
      const trial = arrows[trialIndex];
      const isGoTrial = trial === 'up';
      const isCorrect = (isGoTrial && buttonPressTime.current) || (!isGoTrial && !buttonPressTime.current);

      setResponses([...responses, {
        trial,
        reactionTime,
        userResponse: buttonPressTime.current ? 'pressed' : 'not pressed',
        isCorrect
      }]);

      setTrialIndex(trialIndex + 1); // Move to the next trial
    }, trialDuration);

    return () => {
      clearTimeout(arrowTimer);
      clearTimeout(trialTimer);
    };
  }, [trialIndex, arrows, responses, initialDelay]);

  const generateTrials = () => {
    const trialTypes = Array(8).fill('up').concat(Array(2).fill('down'));
    return shuffleArray(trialTypes);
  };

  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  const handleButtonClick = () => {
    if (!buttonPressTime.current) {
      buttonPressTime.current = Date.now();
      setButtonPressed(true);
    }
  };

  if (trialIndex >= arrows.length) {
    return (
      <div>
        <h1>Test Completato!</h1>
        <p>Grazie della collaborazione.</p>
        <button onClick={() => navigate('/home')}>Go to Home</button>
      </div>
    );
  }

  return (
    <div style={styles.centerContainer}>
      <div style={styles.trialContainer}>
        {showArrow ? (
          <div style={styles.arrowContainer}>
            <div style={styles.arrow}>
              {arrows[trialIndex] === 'up' ? '↑' : '↓'}
            </div>
          </div>
        ) : null}
      </div>
      <div style={styles.buttonContainer}>
        <button 
          onClick={handleButtonClick} 
          style={styles.button}
        />
      </div>
    </div>
  );
};

const styles = {
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    textAlign: 'center'
  },
  trialContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '150px',
    marginBottom: '20px'
  },
  arrowContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  arrow: {
    fontSize: '100px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    width: '50vh',
    height: '10vh', 
    fontSize: '24px', 
    borderRadius: '15px', 
    border: 'none',
    backgroundColor: '#808080', 
    cursor: 'pointer',
  }
};

export default GoNoGo;
