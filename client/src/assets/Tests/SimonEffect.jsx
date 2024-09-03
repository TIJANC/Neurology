import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SimonEffect = () => {
  const [trialIndex, setTrialIndex] = useState(0);
  const [showFixation, setShowFixation] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [trialStartTime, setTrialStartTime] = useState(null);
  const [responses, setResponses] = useState([]);
  const [trials, setTrials] = useState([]);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [name, setName] = useState('');
  const [initialDelay, setInitialDelay] = useState(true);
  const navigate = useNavigate();
  const buttonPressTime = useRef(null);

  const images = {
    blue: 'src/assets/Tests/SimonEffectImages/blue_image.png',
    red: 'src/assets/Tests/SimonEffectImages/red_image.png',
  };

  useEffect(() => {
    // Initialize trials from predefined list
    const predefinedTrials = [
      { position: 'left', image: 'blue' },
      { position: 'right', image: 'red' },
      { position: 'left', image: 'red' },
      { position: 'right', image: 'blue' },
      // Add more predefined trials as needed
    ];

    // Add condition field to each trial
    const trialsWithCondition = predefinedTrials.map(trial => {
      const condition = (trial.position === 'left' && trial.image === 'red') || (trial.position === 'right' && trial.image === 'blue')
        ? 'congruent'
        : 'incongruent';
      return { ...trial, condition };
    });

    // Shuffle the trials
    const shuffledTrials = shuffleArray(trialsWithCondition);
    setTrials(shuffledTrials);

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
    if (initialDelay) {
      // Apply initial delay before starting trials
      const delayTimer = setTimeout(() => {
        setInitialDelay(false);
        startTrial();
      }, 2000); // 2 seconds initial delay

      return () => clearTimeout(delayTimer);
    } else {
      startTrial();
    }
  }, [trialIndex, initialDelay]);

  const startTrial = () => {
    if (trialIndex >= trials.length) {
      // Test is completed, send results to the backend
      const completionDate = new Date().toISOString();

      if (name) {
        const API_BASE_URL = "https://neurology-server.onrender.com";
        // for development
        //axios.post('http://localhost:3001/api/results', {
        // for production 
        axios.post(`${API_BASE_URL}/api/results`, {
          name,
          responses,
          test: 'SimonEffect',
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

    // Start a new trial with fixation cross
    setShowFixation(true);
    setShowImage(false);
    const fixationTimer = setTimeout(() => {
      setShowFixation(false);
      setShowImage(true);
      setTrialStartTime(Date.now());
      setButtonPressed(false);
      buttonPressTime.current = null;
    }, 1000); // Show fixation for 1 second

    return () => {
      clearTimeout(fixationTimer);
    };
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

  const handleButtonClick = (color) => {
    if (!buttonPressTime.current) {
      buttonPressTime.current = Date.now();
      setButtonPressed(color === 'blue');

      const trialEndTime = Date.now();
      const reactionTime = trialEndTime - trialStartTime;
      const trial = trials[trialIndex];
      const isCorrect = (trial.image === 'blue' && color === 'blue') || (trial.image === 'red' && color === 'red');

      setResponses(prevResponses => [
        ...prevResponses,
        {
          trial,
          reactionTime,
          userResponse: 'pressed',
          isCorrect,
          condition: trial.condition
        }
      ]);

      setShowImage(false);
      setTrialIndex(prevIndex => prevIndex + 1); // Move to the next trial
    }
  };

  if (trialIndex >= trials.length) {
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
        {showFixation ? (
          <div style={styles.fixation}>+</div>
        ) : showImage ? (
          <div style={{ ...styles.imageContainer, [trials[trialIndex].position]: '0' }}>
            <img src={images[trials[trialIndex].image]} alt={trials[trialIndex].image} style={styles.image} />
          </div>
        ) : null}
      </div>
      <div style={styles.buttonContainer}>
        <button onClick={() => handleButtonClick('red')} style={{ ...styles.button, backgroundColor: 'red' }} />
        <button onClick={() => handleButtonClick('blue')} style={{ ...styles.button, backgroundColor: 'blue' }} />
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
    marginBottom: '20px',
    position: 'relative',
    width: '100%',
  },
  fixation: {
    fontSize: '100px',
  },
  imageContainer: {
    position: 'absolute',
  },
  image: {
    width: '100px',
    height: '100px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '50%',
  },
  button: {
    width: '100px',
    height: '50px',
    fontSize: '24px',
    borderRadius: '15px',
    border: 'none',
    cursor: 'pointer',
  }
};

export default SimonEffect;
