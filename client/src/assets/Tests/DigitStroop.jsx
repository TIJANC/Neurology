import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const trials = [
  { num1: '1', num2: '2', fontSize1: '48px', fontSize2: '24px' },
  { num1: '3', num2: '3', fontSize1: '36px', fontSize2: '36px' },
  { num1: '4', num2: '1', fontSize1: '24px', fontSize2: '48px' },
  { num1: '2', num2: '2', fontSize1: '48px', fontSize2: '48px' },
  // Add more trials as needed
];

const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    console.log('Decoded token:', decoded); // Added logging to debug
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

const DigitStroopTest = () => {
  const [name, setName] = useState('');
  const [shuffledTrials, setShuffledTrials] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isFixation, setIsFixation] = useState(true);
  const [completionDate, setCompletionDate] = useState(null); // State to store completion date
  const navigate = useNavigate(); // Use useNavigate hook

  useEffect(() => {
    setShuffledTrials(shuffleArray([...trials]));
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

  const handleButtonClick = (response) => {
    if (currentTrial >= shuffledTrials.length || isFixation) return;

    const reactionTime = Date.now() - startTime;
    const correctResponse = determineCorrectResponse(shuffledTrials[currentTrial]);
    const isCorrect = response === correctResponse;
    const trialResponse = {
      trial: shuffledTrials[currentTrial],
      reactionTime: reactionTime,
      userResponse: response,
      isCorrect: isCorrect,
    };

    setResponses([...responses, trialResponse]);
    setIsFixation(true);

    setTimeout(() => {
      setCurrentTrial(currentTrial + 1);
    }, 0);
  };

  const determineCorrectResponse = (trial) => {
    if (trial.num1 > trial.num2) return '>';
    if (trial.num1 < trial.num2) return '<';
    return '=';
  };

  useEffect(() => {
    if (currentTrial < shuffledTrials.length) {
      setIsFixation(true);
      setTimeout(() => {
        setIsFixation(false);
        setStartTime(Date.now());
      }, 1000);
    } else {
      // Test is completed, set completion date and send results to the backend
      const completionDate = new Date().toISOString();
      setCompletionDate(completionDate);

      if (name) {
        const API_BASE_URL = "https://neurology-server.onrender.com";
        //console.log('Sending results:', { name, responses, test: 'Digit Stroop', completionDate });
        // for development
        // axios.post('http://localhost:3001/api/results', {
        // for production
        axios.post(`${API_BASE_URL}/api/results`, {
          name,
          responses,
          test: 'Digit Stroop',
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
    }
  }, [currentTrial, shuffledTrials.length]);

  if (currentTrial >= shuffledTrials.length) {
    return (
      <div style={styles.centerContainer}>
        <h1>Test Completato!</h1>
        <p>Grazie della collaborazione.</p>
        <button onClick={() => navigate('/home')} style={styles.button}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div style={styles.centerContainer}>
      <div style={styles.trialContainer}>
        {isFixation ? (
          <div style={{ fontSize: '48px' }}>+</div>
        ) : (
          <div style={styles.numberContainer}>
            <div style={{ fontSize: shuffledTrials[currentTrial]?.fontSize1, margin: '0 20px' }}>
              {shuffledTrials[currentTrial]?.num1}
            </div>
            <div style={{ fontSize: shuffledTrials[currentTrial]?.fontSize2, margin: '0 20px' }}>
              {shuffledTrials[currentTrial]?.num2}
            </div>
          </div>
        )}
      </div>
      <div style={styles.buttonContainer}>
        <button onClick={() => handleButtonClick('<')} style={styles.button}>{'<'}</button>
        <button onClick={() => handleButtonClick('=')} style={styles.button}>{'='}</button>
        <button onClick={() => handleButtonClick('>')} style={styles.button}>{'>'}</button>
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
    height: '150px', // Fixed height for the trial display area
    marginBottom: '20px' // Margin to separate trial display and buttons
  },
  numberContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    margin: '0 10px',
    padding: '10px 20px',
    fontSize: '18px'
  },
  input: {
    marginBottom: '20px',
    padding: '10px',
    fontSize: '16px'
  }
};

export default DigitStroopTest;
