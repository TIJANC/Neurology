import React, { useState, useEffect, useRef, Suspense } from 'react';
import axios from 'axios';
import './Voice.css'; // Import the CSS file for styling

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three'; // Import THREE

const API_BASE_URL = 'http://localhost:3001';

export const VoiceDialog = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [responses, setResponses] = useState([]);

  const questions = [
    'Quanti anni hai?',
    'Come ti senti?',
    'Ti piace la pizza?',
    'Hai un colore preferito?',
  ];

  // Refs to keep track of latest values
  const recognitionRef = useRef(null);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const responsesRef = useRef(responses);
  const startDialogRef = useRef(null);

  // Refs for audio analysis
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const volumeRef = useRef(0);

  // Synchronize the refs with the state
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

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

      // Update responses state and ref
      setResponses((prevResponses) => {
        const updatedResponses = [
          ...prevResponses,
          {
            question: questions[currentQuestionIndexRef.current],
            answer: currentTranscript,
            volume,
          },
        ];
        responsesRef.current = updatedResponses; // Update the ref
        return updatedResponses;
      });

      recognitionRef.current.stop();
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);

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
    };
  }, []); // Empty dependency array ensures this runs only once

  const askQuestion = (index) => {
    // Stop recognition before starting speech synthesis
    recognitionRef.current.stop();

    const question = questions[index];
    const speech = new SpeechSynthesisUtterance(question);
    speech.lang = 'it-IT';

    speech.onstart = () => setIsSpeaking(true);

    speech.onend = () => {
      setIsSpeaking(false);
      // Delay starting recognition to avoid picking up speech synthesis
        recognitionRef.current.start();
        setIsListening(true);
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
  };

  const handleSaveResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const name = payload.name;

      const testResults = {
        name,
        responses: responsesRef.current, // Use the ref to get the latest responses
        test: 'Voice Analysis',
        completionDate: new Date().toISOString(),
      };

      const response = await axios.post(`${API_BASE_URL}/api/results`, testResults, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Results saved:', response.data);
      alert('Results saved successfully!');
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Error saving results');
    }
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

    const updateVolume = () => {
      if (audioContextRef.current) {
        analyserRef.current.getFloatTimeDomainData(dataArray);
        let sum = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const value = dataArray[i];
          sum += value * value;
        }

        const rms = Math.sqrt(sum / dataArray.length);
        volumeRef.current = rms; // Update the volumeRef with the latest volume

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

      <div className="transcript">
        <h2>User Response</h2>
        <p>{transcript}</p>
      </div>
    </div>
  );
};

export default VoiceDialog;
