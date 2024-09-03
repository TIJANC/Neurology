import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';

const tests = [
  { 
    name: 'Digit Stroop', 
    path: '/digit-stroop',
    instructions: [
      "1. Vedrà coppie di numeri di diverse dimensioni.",
      "2. Prema il tasto corrispondente alla relazion matematica dei due numeri.",
      "(< - minore, = - uguale, > - maggiore)",
      "3. Risponda più velocemente possibile."
    ],
    image: 'src/assets/Example Images/DigitStroop_ex.png' 
  },
  { 
    name: 'Go-NoGo', 
    path: '/Go-NoGo',
    instructions: [
      "1. Vedrà una serie di frecce che puntano verso l'alto o verso il basso.",
      "2. Prema il tasto se la freccia indica verso l'alto.",
      "3. Se la freccia punta verso il basso non prema il tasto.",
      "4. Risponda più velocemente possibile."
    ],
    image: 'src/assets/Example Images/GNG_ex.png' 
  },
  { 
    name: 'Simon Effect', 
    path: '/SimonEffect',
    instructions: [
      "1. Vedrà una serie di stimoli a destra o a sinistra rispetto alla crocietta.",
      "2. Se lo stimolo è rosso prema il tasto sinistro, se lo stimolo è blu prema il tasto destro.",
      "3. Risponda più velocemente possibile."
    ],
    image: 'src/assets/Example Images/SE_ex.png' 
  },
  { 
    name: 'Flanker Task', 
    path: '/FlankerTask',
    instructions: [
      "1. Ad ogni schermata verranno presentate 5 figure uguali orientate verso dx o verso sinistra.",
      "2. Deve indicare la direzione verso cui è orientata la figura centrale premendo la freccia corrispondente senza considerare l’orientamento delle figure laterali.",
      "3. Risponda più velocemente possibile."
    ],
    image: 'src/assets/Example Images/Flanker_ex.png' 
  },
  { 
    name: 'Dual Task', 
    path: '/DualTask',
    instructions: [
      "1. Fissa la crocetta al centro dello schermo, dopo un breve intervallo nella metà dei casi comparirà un numero, cerca di ricordarlo perché poi ti verrà chiesto di indicarlo, nell’altra metà dei casi lo schermo resterà vuoto.",
      "2. In ogni caso, comparirà poi, nella parte alta o nella parte bassa dello schermo, un cerchietto rosso: appena lo vedi premi il più velocemente possibile il tasto di risposta.",
      "3. Dopo aver emesso la risposta comparirà una schermata in cui ti verrà chiesto di indicare quale numero era stato presentato prima del cerchietto rosso: per rispondere premi il tasto corrispondente; nel caso non fosse stato presentato alcun numero, premi X."
    ],
    image: 'src/assets/Example Images/Dual_ex1.png', 
    image2: 'src/assets/Example Images/Dual_ex2.png'
  },
];

export const Home = () => {
  const navigate = useNavigate();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const openModal = (test) => {
    setSelectedTest(test);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedTest(null);
  };

  const startTest = () => {
    if (selectedTest) {
      navigate(selectedTest.path);
      closeModal();
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#001f3f', // Navy blue
      color: '#C0C0C0', // Silver
    },
    header: {
      fontSize: '2.5rem',
      marginBottom: '20px',
    },
    buttonsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px',
      width: '80%',
    },
    button: {
      padding: '20px',
      fontSize: '1.2rem',
      color: '#fff',
      backgroundColor: '#001f3f', // Navy blue
      border: '2px solid #C0C0C0', // Silver border
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'background-color 0.3s, color 0.3s',
    },
    buttonHover: {
      backgroundColor: '#00008b', // Darker navy blue
      color: '#fff',
    },
    modal: {
      content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px',
        textAlign: 'center',
      },
    },
    modalImagesContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px', // Gap between images
    },
    modalImage: {
      maxWidth: '45%', // Adjust width to fit both images side by side
      height: 'auto',
    },
    modalButton: {
      padding: '10px 20px',
      margin: '10px',
      fontSize: '1rem',
      color: '#fff',
      backgroundColor: '#001f3f', // Navy blue
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    modalButtonHover: {
      backgroundColor: '#00008b', // Darker navy blue
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Neurological Tests</h1>
      <div style={styles.buttonsContainer}>
        {tests.map((test, index) => (
          <button
            key={index}
            style={styles.button}
            onMouseEnter={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
            onClick={() => openModal(test)}
          >
            {test.name}
          </button>
        ))}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Instructions Modal"
        style={styles.modal}
      >
        <h2>{selectedTest ? selectedTest.name : 'Test'}</h2>
        <div>
          <p>Istruzioni per il {selectedTest ? selectedTest.name : 'test'}:</p>
          {selectedTest && selectedTest.instructions.map((instruction, idx) => (
            <p key={idx}>{instruction}</p>
          ))}
          {/* Render images side-by-side for Dual Task */}
          {selectedTest && selectedTest.name === 'Dual Task' && (
            <div style={styles.modalImagesContainer}>
              <img src={selectedTest.image} alt={`${selectedTest.name} Example 1`} style={styles.modalImage} />
              <img src={selectedTest.image2} alt={`${selectedTest.name} Example 2`} style={styles.modalImage} />
            </div>
          )}
          {/* Render a single image for other tests */}
          {selectedTest && selectedTest.image && selectedTest.name !== 'Dual Task' && (
            <img src={selectedTest.image} alt={`${selectedTest.name}`} style={styles.modalImage} />
          )}
        </div>
        <button 
          style={styles.modalButton}
          onMouseEnter={(e) => (e.target.style.backgroundColor = styles.modalButtonHover.backgroundColor)}
          onMouseLeave={(e) => (e.target.style.backgroundColor = styles.modalButton.backgroundColor)}
          onClick={startTest}
        >
          Start Test
        </button>
        <button 
          style={styles.modalButton}
          onMouseEnter={(e) => (e.target.style.backgroundColor = styles.modalButtonHover.backgroundColor)}
          onMouseLeave={(e) => (e.target.style.backgroundColor = styles.modalButton.backgroundColor)}
          onClick={closeModal}
        >
          Cancel
        </button>
      </Modal>
    </div>
  );
};

export default Home;
