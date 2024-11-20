import React, { useState, useEffect, useRef, Suspense } from 'react';
import axios from 'axios';
import './Voice.css';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

const API_BASE_URL = 'http://localhost:3001';

export const VoiceDialog = () => {
  // State variables
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [responses, setResponses] = useState([]);
  const [countdown, setCountdown] = useState(0);

  const questions = [
    // First Q is an instruction and test phrase
    'Questa prova si svolge con un generatore vocale che ti pone delle domande. Rispondete a voce entro 10 secondi. Sei pronto?',
    'Mi sento calmo.',
    'Mi sento sicuro.',
    'Sono teso.',
    'Mi sento sotto pressione.',
    'Mi sento tranquillo.',
    'Mi sento turbato.',
    'Sono attualmente preoccupato per possibili disgrazie.',
    'Mi sento soddisfatto.',
    'Mi sento intimorito.',
    'Mi sento a mio agio.',
    'Mi sento sicuro di me.',
    'Mi sento nervoso.',
    'Sono agitato.',
    'Mi sento indeciso.',
    'Sono rilassato.',
    'Mi sento contento.',
    'Sono preoccupato.',
    'Mi sento confuso.',
    'Mi sento disteso.',
    'Mi sento bene.'
  ];

  // Refs to keep track of latest values
  const recognitionRef = useRef(null);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const responsesRef = useRef(responses);
  const startDialogRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recognitionTimeoutRef = useRef(null);
  const currentResponseRef = useRef(null); // New ref for current response
  const isListeningRef = useRef(isListening); // New ref for isListening

  // Refs for audio analysis
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const volumeRef = useRef(0);
  const audioDataRef = useRef([]); // Ref to collect audio data

  // Synchronize the refs with the state
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  // Synchronize isListeningRef with isListening state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    // Initialize Speech Recognition
    recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'it-IT';

    recognitionRef.current.onresult = (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);

      // Ignore the result if it matches the question
      if (
        currentTranscript.trim().toLowerCase() ===
        questions[currentQuestionIndexRef.current].trim().toLowerCase()
      ) {
        console.log('Ignored speech recognition result as it matches the question.');
        return;
      }

      // Get the latest volume measurement
      const volume = volumeRef.current || 0;

      // Update the current response
      if (currentResponseRef.current) {
        currentResponseRef.current.answer = currentTranscript;
        currentResponseRef.current.volume = volume;
      }
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended.');

      if (!currentResponseRef.current) {
        console.warn('No current response, skipping onend handler.');
        return;
      }

      setIsListening(false);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }

      // Record the end time
      currentResponseRef.current.endTime = new Date().toISOString();
      console.log('Recording ended at:', currentResponseRef.current.endTime);

      // Ensure audioDataRef.current is an array
      currentResponseRef.current.audioData = Array.isArray(audioDataRef.current)
        ? audioDataRef.current
        : [];

      // Reset the audio data ref for the next response
      audioDataRef.current = [];

      // Add the current response to the responses array
      setResponses((prevResponses) => {
        const updatedResponses = [...prevResponses, currentResponseRef.current];
        responsesRef.current = updatedResponses; // Update the ref
        console.log('Updated responses:', updatedResponses);
        return updatedResponses;
      });

      // Reset currentResponseRef for the next question
      currentResponseRef.current = null;

      // Move to the next question or finish
      if (currentQuestionIndexRef.current < questions.length - 1) {
        // Move to the next question
        const newIndex = currentQuestionIndexRef.current + 1;
        setCurrentQuestionIndex(newIndex);
        askQuestion(newIndex);
      } else {
        // All questions have been asked
        handleStopListening();
        handleSaveResults();
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      alert('Speech recognition error: ' + event.error);
    };

    // Function to start the dialog
    const startDialog = async () => {
      setTranscript('');
      setResponses([]);
      responsesRef.current = []; // Reset the ref as well
      setCurrentQuestionIndex(0);
      setIsListening(true);
      await startAudioAnalysis(); // Start audio analysis
      askQuestion(0);
    };

    // Store the startDialog function in a ref to access it outside useEffect
    startDialogRef.current = startDialog;

    // Cleanup function when component unmounts
    return () => {
      stopAudioAnalysis();
      recognitionRef.current && recognitionRef.current.abort();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  const startCountdown = (duration) => {
    setCountdown(duration);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown > 1) {
          return prevCountdown - 1;
        } else {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
      });
    }, 1000);
  };

  const askQuestion = (index) => {
    // Stop recognition before starting speech synthesis if it's active
    if (isListening) {
      recognitionRef.current.stop();
    }

    const question = questions[index];
    const speech = new SpeechSynthesisUtterance(question);
    speech.lang = 'it-IT';

    currentResponseRef.current = {
      question,
      startTime: null, // Will set later
      answer: null,
      volume: null,
      endTime: null,
      audioData: [], // Initialize as an empty array
    };

    speech.onstart = () => setIsSpeaking(true);

    speech.onend = () => {
      setIsSpeaking(false);
      // Reset audio data collection
      audioDataRef.current = [];
      // Start speech recognition
      recognitionRef.current.start();
      setIsListening(true);
      // Start countdown timer
      startCountdown(10); // 10 seconds
      // Record the start time
      currentResponseRef.current.startTime = new Date().toISOString();
      console.log('Recording started at:', currentResponseRef.current.startTime);
      // Stop recognition after 10 seconds
      recognitionTimeoutRef.current = setTimeout(() => {
        recognitionRef.current.stop();
        setIsListening(false);
      }, 10000); // 10000 milliseconds = 10 seconds
    };

    window.speechSynthesis.speak(speech);
  };

  const handleStartListening = () => {
    if (startDialogRef.current) {
      startDialogRef.current();
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    recognitionRef.current.stop();
    stopAudioAnalysis(); // Stop audio analysis
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
    }
  };

  const handleSaveResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const name = payload.name;

      // Exclude audioData from responses before sending to the server
      const responsesWithoutAudioData = responsesRef.current.map(({ audioData, ...rest }) => rest);

      const testResults = {
        name,
        responses: responsesWithoutAudioData,
        test: 'Voice Analysis',
        completionDate: new Date().toISOString(),
      };

      console.log('Final Responses without audioData:', responsesWithoutAudioData);

      const response = await axios.post(`${API_BASE_URL}/api/results`, testResults, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Results saved:', response.data);

      // After saving results, initiate CSV download
      downloadAudioDataAsCSV();

      alert('Results saved successfully!');
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Error saving results');
    }
  };

  const downloadAudioDataAsCSV = () => {
    // Initialize CSV content with headers
    let csvContent = 'data:text/csv;charset=utf-8,';

    // Add CSV headers
    csvContent += 'Question Number,Question,User Response,Start Time,End Time,Audio Data\n';

    // Filter out null or undefined responses
    const validResponses = responsesRef.current.filter(response => response != null);

    validResponses.forEach((response, index) => {
      if (Array.isArray(response.audioData) && response.audioData.length > 0) {
        // Prepare the header row for this response
        const headerRow = [
          index + 1, // Question Number
          `"${response.question}"`, // Question (quoted to handle commas)
          `"${response.answer}"`, // User Response (quoted)
          response.startTime,
          response.endTime,
          '' // Placeholder for Audio Data column
        ].join(',');

        csvContent += headerRow + '\n';

        // Add audio data rows
        response.audioData.forEach((dataArray, frameIndex) => {
          // Convert the dataArray to a comma-separated string
          const dataString = dataArray.join(',');
          csvContent += `,,,,,${dataString}\n`;
        });

        csvContent += '\n'; // Add an empty line between questions
      }
    });

    // Encode the CSV content
    const encodedUri = encodeURI(csvContent);

    // Create a temporary link element
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'audio_data.csv');
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Clean up
    document.body.removeChild(link);
  };

  // Functions for audio analysis
  const startAudioAnalysis = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support audio input.');
      return;
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      mediaStreamSourceRef.current.connect(analyserRef.current);

      // Start measuring volume
      measureVolume();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone');
    }
  };

  const stopAudioAnalysis = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const measureVolume = () => {
    const dataArray = new Float32Array(analyserRef.current.fftSize);
    let frameCount = 0;

    const updateVolume = () => {
      if (audioContextRef.current) {
        analyserRef.current.getFloatTimeDomainData(dataArray);
        let sum = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const value = dataArray[i];
          sum += value * value;
        }

        const rms = Math.sqrt(sum / dataArray.length);

        // Avoid log of zero by setting a minimum RMS value
        const minRms = 0.00001;
        const adjustedRms = Math.max(rms, minRms);

        // Convert RMS to decibels
        const db = 20 * Math.log10(adjustedRms);

        volumeRef.current = db * -1; // Update the volumeRef with the latest decibel value

        // Collect dataArray only if the user is listening
        if (isListeningRef.current && currentResponseRef.current) {
          // Collect data every 5 frames to reduce data size
          frameCount++;
          if (frameCount % 5 === 0) {
            // Copy the dataArray to avoid overwriting
            const dataArrayCopy = Array.from(dataArray);
            // Optionally, reduce precision
            const reducedPrecisionData = dataArrayCopy.map((num) =>
              parseFloat(num.toFixed(5))
            );
            audioDataRef.current.push(reducedPrecisionData);
          }
        }

        // Call updateVolume again on the next animation frame
        requestAnimationFrame(updateVolume);
      }
    };

    // Start the volume measurement loop
    updateVolume();
  };

  // 3D Avatar Component
  const Avatar = () => {
    const { scene } = useGLTF('/model.glb'); // Ensure the path is correct
    return <primitive object={scene} scale={2} />;
  };

  return (
    <div className="voice-container">
      <div className="avatar-container">
        <Canvas camera={{ position: [0, 1, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 5, 5]} />
          <Suspense fallback={null}>
            <Avatar />
          </Suspense>
          <OrbitControls enableZoom={true} />
        </Canvas>
      </div>

      <button onClick={handleStartListening} disabled={isListening || isSpeaking}>
        {isListening || isSpeaking ? 'In Progress...' : 'Start Dialog'}
      </button>

      {isListening && countdown > 0 && (
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${((10 - countdown) / 10) * 100}%` }}
          ></div>
        </div>
      )}

      <div className="transcript">
        <h2>Risposta Utente</h2>
        <p>{transcript}</p>
      </div>
      <div>
        Possibili risposte: Per nulla, Un po', Abbastanza, Moltissimo
      </div>
    </div>
  );
};

export default VoiceDialog;
