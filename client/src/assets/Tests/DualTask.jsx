import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DualTask() {
  const [phase, setPhase] = useState('fixation'); // Current phase of the trial
  const [currentNumber, setCurrentNumber] = useState(null); // Number displayed
  const [reactionStart, setReactionStart] = useState(null); // Time when the red circle is displayed
  const [reactionTime, setReactionTime] = useState(null); // Time taken to press the button
  const [userResponses, setUserResponses] = useState([]); // Store the user's responses
  const [trialIndex, setTrialIndex] = useState(0); // Track the current trial
  const [showCircle, setShowCircle] = useState(false); // Whether the red circle is visible
  const [circleContainer, setCircleContainer] = useState(null); // Randomly chosen container for the circle
  const [initialDelay, setInitialDelay] = useState(true); // State to handle initial delay
  const navigate = useNavigate();
  const buttonPressTime = useRef(null);

  const displayNumbers = [1, 2, 3, '']; // Numbers that can be displayed (including empty string)
  const responseNumbers = [1, 2, 3, 'x']; // Numbers for the response buttons
  const totalTrials = 5; // Total number of trials

  // Function to generate a random delay between min and max milliseconds
  const getRandomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Function to start a new trial
  const startTrial = () => {
    setPhase('fixation');
    setShowCircle(false);

    // Select a random number from the displayNumbers array
    const randomIndex = Math.floor(Math.random() * displayNumbers.length);
    const selectedNumber = displayNumbers[randomIndex];
    setCurrentNumber(selectedNumber);

    // Randomly determine if the circle will appear in container 2 or 4
    const randomContainer = Math.random() > 0.5 ? 'container2' : 'container4';
    setCircleContainer(randomContainer);

    // Show fixation cross for 1s
    setTimeout(() => {
      setPhase('number'); // Change to number phase

      // Show number for 1s
      setTimeout(() => {
        setPhase('circleReady'); // Ready to show the circle but keep the number displayed

        // Apply a random delay before showing the circle
        const randomDelay = getRandomDelay(350, 500);
        setTimeout(() => {
          // Show the circle after the random delay
          setPhase('circle');
          setReactionStart(Date.now());
          setShowCircle(true);

          // Hide the circle after 150ms
          setTimeout(() => {
            setShowCircle(false);
          }, 150);

        }, randomDelay); // Random delay duration

      }, 1000); // Number display duration

    }, 1000); // Fixation duration
  };

  // Handle the response to the circle (measuring reaction time)
  const handleReaction = () => {
    if (phase === 'circle') {
      const reactionEndTime = Date.now();
      const reactionTime = reactionEndTime - reactionStart;
      setReactionTime(reactionTime);
      setPhase('response'); // Proceed to the response phase
    }
  };

  // Handle the user's number selection
  const handleNumberSelection = (number) => {
    let isCorrect;

    // Check if the number is correctly identified or if 'x' is pressed when the number is empty
    if (currentNumber === '' && number === 'x') {
      isCorrect = true;
    } else {
      isCorrect = String(number) === String(currentNumber);
    }

    // Capture the response including the current number
    const newResponse = {
      trial: trialIndex + 1,
      reactionTime,
      isCorrect,
      condition: currentNumber, // Renamed from displayedNumber to condition
      selectedNumber: number,
    };

    setUserResponses([...userResponses, newResponse]);

    // Reset currentNumber after response is handled
    setCurrentNumber(null);

    if (trialIndex < totalTrials - 1) {
      setTrialIndex(trialIndex + 1);
      startTrial();
    } else {
      setPhase('completed');
    }
  };

  // Start the trial when the component mounts or when a new trial begins
  useEffect(() => {
    startTrial();
  }, []);

  // Save results to backend once the test is completed
  useEffect(() => {
    if (phase === 'completed') {
      const completionDate = new Date().toISOString();
      const token = localStorage.getItem('token');
      const name = token ? decodeToken(token).name : 'Anonymous';

      if (name) {
        axios.post('http://localhost:3001/api/results', {
          name,
          responses: userResponses,
          test: 'DualTask',
          completionDate,
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(response => {
          console.log('Results saved:', response.data);
        }).catch(error => {
          console.error('Error saving results:', error);
        });
      }
    }
  }, [phase, userResponses]);

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

  if (phase === 'completed') {
    return (
      <div>
        <h1>Task Completed</h1>
        <p>Thank you for participating!</p>
        <ul>
          {userResponses.map((response, index) => (
            <li key={index}>
              Trial {response.trial}: 
              Condition: {response.condition || 'None'}, 
              Selected Number: {response.selectedNumber}, 
              {response.isCorrect ? 'Correct' : 'Incorrect'}, 
              Reaction Time: {response.reactionTime}ms
            </li>
          ))}
        </ul>
        <button onClick={() => navigate('/home')}>Go to Home</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Container 1 */}
      <div style={styles.emptyContainer}></div>

      {/* Container 2: Displays the number, circle (if chosen), and number selection */}
      <div style={styles.numberContainer}>
        {phase === 'fixation' && <div style={styles.fixation}>+</div>}
        {phase === 'number' && <div style={styles.number}>{currentNumber}</div>}
        {phase === 'circleReady' && <div style={styles.number}>{currentNumber}</div>}
        {showCircle && circleContainer === 'container2' && (
          <div style={styles.circleWrapper}>
            <div style={styles.circle}></div>
          </div>
        )}

        {phase === 'response' && (
          <div style={styles.selectionContainer}>
            {responseNumbers.map((number) => (
              <button
                key={number}
                style={styles.button}
                onClick={() => handleNumberSelection(number)}
              >
                {number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Container 3: Fixed position button */}
      <div style={styles.buttonContainer}>
        <button style={styles.reactionButton} onClick={handleReaction}>
          Press to Respond
        </button>
      </div>
      
      {/* Container 4: Displays the circle if chosen */}
      <div style={styles.container4}>
        {showCircle && circleContainer === 'container4' && (
          <div style={styles.circleWrapper}>
            <div style={styles.circle}></div>
          </div>
        )}
      </div>

      {/* Container 5 */}
      <div style={styles.emptyContainer}></div>
    </div>
  );
}

// Inline styles for the component
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  numberContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixation: {
    fontSize: '48px',
    fontWeight: 'bold',
  },
  number: {
    fontSize: '72px',
    fontWeight: 'bold',
  },
  circleWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'red',
  },
  selectionContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
  },
  button: {
    margin: '0 10px',
    padding: '10px 20px',
    fontSize: '24px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionButton: {
    padding: '15px 30px',
    fontSize: '24px',
    backgroundColor: '#808080',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  container4: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};
