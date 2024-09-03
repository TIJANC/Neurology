import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FlankerTask = () => {
  const [trialIndex, setTrialIndex] = useState(0);
  const [showFixation, setShowFixation] = useState(true);
  const [showFlanker, setShowFlanker] = useState(false);
  const [trialStartTime, setTrialStartTime] = useState(null);
  const [responses, setResponses] = useState([]);
  const [shuffledTrials, setShuffledTrials] = useState([]);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [name, setName] = useState('');
  const [initialDelay, setInitialDelay] = useState(true);
  const navigate = useNavigate();
  const buttonPressTime = useRef(null);

  const trials = [
    { condition: 'congruent', flanker: '>>>>>', target: '>', correctResponse: 'right' },
    { condition: 'congruent', flanker: '<<<<<', target: '<', correctResponse: 'left' },
    { condition: 'incongruent', flanker: '>>><>', target: '<', correctResponse: 'right' },
    { condition: 'incongruent', flanker: '<<><<', target: '>', correctResponse: 'right' },
    // Add more trials as needed
  ];

  useEffect(() => {
    const shuffledTrials = shuffleArray([...trials]);
    setShuffledTrials(shuffledTrials);

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
    if (trialIndex >= shuffledTrials.length) {
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
          test: 'Flanker Task',
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
    setShowFlanker(false);
    const fixationTimer = setTimeout(() => {
      setShowFixation(false);
      setShowFlanker(true);
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

  const handleResponse = (response) => {
    if (!buttonPressTime.current && trialIndex < shuffledTrials.length && !showFixation) {
      buttonPressTime.current = Date.now();
      setButtonPressed(true);

      const trialEndTime = Date.now();
      const reactionTime = trialEndTime - trialStartTime;
      const trial = shuffledTrials[trialIndex];
      const isCorrect = response === trial.correctResponse;

      setResponses(prevResponses => [
        ...prevResponses,
        {
          trial,
          reactionTime,
          userResponse: response,
          isCorrect,
          condition: trial.condition
        }
      ]);

      setShowFlanker(false);
      setTrialIndex(prevIndex => prevIndex + 1); // Move to the next trial
    }
  };

  if (trialIndex >= shuffledTrials.length) {
    return (
      <div style={styles.centerContainer}>
        <h1>Test Completed!</h1>
        <p>Thank you for participating.</p>
        <button onClick={() => navigate('/home')} style={styles.button}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div style={styles.centerContainer}>
      <div style={styles.trialContainer}>
        {showFixation ? (
          <div style={styles.fixation}>+</div>
        ) : showFlanker ? (
          <div style={styles.flankerContainer}>
            <div style={{ fontSize: '50px' }}>
              {shuffledTrials[trialIndex].flanker}
            </div>
          </div>
        ) : null}
      </div>
      <div style={styles.buttonContainer}>
        <button onClick={() => handleResponse('left')} style={styles.button}>
          S
        </button>
        <button onClick={() => handleResponse('right')} style={styles.button}>
          D
        </button>
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
  flankerContainer: {
    position: 'absolute',
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
    backgroundColor: '#007bff',
    color: '#fff',
  }
};

export default FlankerTask;
