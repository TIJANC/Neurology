import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminNavbar } from '../AdminNavbar';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

function UserInformation() {
  const { userName } = useParams();
  const [tests, setTests] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [expandedTestId, setExpandedTestId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get(`http://localhost:3001/api/user-tests/${userName}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        const testData = response.data.tests;

        //console.log('Fetched test data:', testData); // Log the fetched data
        
        setTests(testData);

        // Prepare data for the chart
        const labels = testData.map(test => new Date(test.completionDate).toLocaleDateString());
        const datasets = testData.map(test => {
          const avgResponseTime = calculateMetrics(test.responses).avgResponseTime;
          return {
            label: test.test,
            data: [avgResponseTime],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false,
          };
        });

        setChartData({
          labels,
          datasets
        });
      })
      .catch(error => {
        console.error('Error fetching user tests:', error);
        alert('Error fetching user tests.');
      });
  }, [userName, navigate]);

  const calculateMetrics = (responses) => {
    if (responses.length === 0) return { avgResponseTime: 0, numCorrect: 0, fractionCorrect: '0/0' };

    let totalResponseTime = 0;
    let correctResponses = 0;

    responses.forEach(response => {
      totalResponseTime += response.reactionTime;
      if (response.isCorrect) correctResponses += 1;
    });

    const avgResponseTime = totalResponseTime / responses.length;
    const fractionCorrect = `${correctResponses}/${responses.length}`;
    return { avgResponseTime, numCorrect: correctResponses, fractionCorrect };
  };

  const toggleDetails = (testId) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  const convertToCSV = () => {
    let headers = [];
    let rows = [];
  
    tests.forEach(test => {
      const testType = test.test;
  
      // Create rows based on test type
      test.responses.forEach((response, index) => {
        let row = [testType, new Date(test.completionDate).toLocaleString(), index + 1];
        
        switch (testType) {
          case 'GoNoGo':
            row.push(response.trial || 'N/A', response.reactionTime || 'N/A', response.userResponse || 'N/A', response.isCorrect ? 'Yes' : 'No');
            break;
          case 'DualTask':
            row.push(response.condition || '', response.selectedNumber || 'N/A', response.reactionTime || 'N/A', response.isCorrect ? 'Yes' : 'No');
            break;
          case 'SimonEffect':
            row.push(response.trial.condition || 'N/A', response.reactionTime || 'N/A', response.userResponse || 'N/A', response.isCorrect ? 'Yes' : 'No');
            break;
          case 'Flanker Task':
            row.push(response.trial.condition || 'N/A', response.reactionTime || 'N/A', response.userResponse || 'N/A', response.isCorrect ? 'Yes' : 'No');
            break;
          case 'Digit Stroop':
            row.push(response.trial.num1 || 'N/A', response.trial.num2 || 'N/A', response.trial.fontSize1 || 'N/A', response.trial.fontSize2 || 'N/A', response.reactionTime || 'N/A', response.userResponse || 'N/A', response.isCorrect ? 'Yes' : 'No');
            break;
          default:
            row.push(response.reactionTime || 'N/A', response.userResponse || 'N/A', response.isCorrect ? 'Yes' : 'No');
        }
        
        rows.push(row);
      });
    });
  
    const csvContent = [
      headers.join(','), 
      ...rows.map(row => row.join(','))
    ].join('\n');
  
    return csvContent;
  };

  const downloadCSV = () => {
    const csvContent = convertToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `test_results_${userName}.csv`);
    link.click();
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#001f3f', // Navy blue
      minHeight: '100vh',
      color: '#C0C0C0', // Silver
    },
    header: {
      textAlign: 'center',
      color: '#C0C0C0', // Silver
      marginBottom: '20px',
      fontSize: '2rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '20px',
    },
    th: {
      padding: '10px',
      border: '1px solid #ddd',
      backgroundColor: '#001f3f', // Dark blue for header
      color: '#fff', // White text
    },
    td: {
      padding: '10px',
      border: '1px solid #ddd',
      backgroundColor: '#fff', // Dark navy blue for table cells
      color: '#000', // Black text
    },
    button: {
      padding: '10px 20px',
      fontSize: '16px',
      backgroundColor: '#007bff', // Blue for buttons
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '20px',
      textAlign: 'center',
    },
    buttonHover: {
      backgroundColor: '#0056b3', // Darker blue for hover
    },
    expandedRow: {
      backgroundColor: '#001f3f', // Darker navy blue for expanded rows
      color: '#fff', // White text
    },
  };

  return (
    <div style={styles.container}>
      <AdminNavbar />
      <h1 style={styles.header}>User Information</h1>
      <h2 style={styles.header}>Tests Completed by {userName}</h2>
      <button
        onClick={downloadCSV}
        style={styles.button}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
      >
        Download CSV
      </button>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Test</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Details</th>
          </tr>
        </thead>
        <tbody>
          {tests.map(test => {
            const { avgResponseTime, numCorrect, fractionCorrect } = calculateMetrics(test.responses);
            const isExpanded = expandedTestId === test._id;
            return (
              <React.Fragment key={test._id}>
                <tr>
                  <td style={styles.td}>{test.test}</td>
                  <td style={styles.td}>{new Date(test.completionDate).toLocaleString()}</td>
                  <td style={styles.td}>
                    <div>
                      <strong>Average Response Time:</strong> {avgResponseTime.toFixed(2)} ms
                    </div>
                    <div>
                      <strong>Correct Responses:</strong> {fractionCorrect}
                    </div>
                    <button
                      onClick={() => toggleDetails(test._id)}
                      style={styles.button}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr style={styles.expandedRow}>
                    <td colSpan="3" style={styles.td}>
                      <h4>Detailed Results</h4>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Trial</th>
                            {/* Add columns specific to GoNoGo test */}
                            {test.test === 'GoNoGo' && (
                            <>
                              <th style={styles.th}>Arrow</th>
                              <th style={styles.th}>Reaction Time (ms)</th>
                              <th style={styles.th}>Response</th>
                              <th style={styles.th}>Correct</th>
                            </>
                            )}
                            {/* Add columns specific to GoNoGo test */}
                            {test.test === 'DualTask' && (
                            <>                              
                              <th style={styles.th}>Number</th>
                              <th style={styles.th}>Response</th>
                              <th style={styles.th}>Reaction Time (ms)</th>
                              <th style={styles.th}>Correct</th>
                            </>
                            )}
                            {/* Add columns specific to Simon Effect test */}
                            {test.test === 'SimonEffect' && (
                              <>
                              <th style={styles.th}>Condition</th>
                              <th style={styles.th}>Reaction Time (ms)</th>
                              <th style={styles.th}>Response</th>
                              <th style={styles.th}>Correct</th>
                              </>
                            )}
                            {/* Add columns specific to Flanker Task test */}
                            {test.test === 'Flanker Task' && (
                              <>
                              <th style={styles.th}>Condition</th>
                              <th style={styles.th}>Reaction Time (ms)</th>
                              <th style={styles.th}>Response</th>
                              <th style={styles.th}>Correct</th>
                              </>
                            )}
                            {/* Add columns specific to Digit Stroop test */}
                            {test.test === 'Digit Stroop' && (
                              <>
                              <th style={styles.th}>Num1</th>
                              <th style={styles.th}>Num2</th>
                              <th style={styles.th}>Font 1</th>
                              <th style={styles.th}>Font 2</th>
                              <th style={styles.th}>Reaction Time (ms)</th>
                              <th style={styles.th}>Response</th>
                              <th style={styles.th}>Correct</th>
                              </>
                            )}
                            
                          </tr>
                        </thead>
                        <tbody>
                          {test.responses.map((response, index) => (
                            <tr key={index}>
                              <td style={styles.td}>{index + 1}</td>
                              {/* Render GoNoGo specific data */}
                              {test.test === 'GoNoGo' && (
                                <>
                                <td style={styles.td}>{response.trial || 'N/A'}</td>
                                <td style={styles.td}>{response.reactionTime || 'N/A'}</td>
                                <td style={styles.td}>{response.userResponse || 'N/A'}</td>
                                <td style={styles.td}>{response.isCorrect ? 'Yes' : 'No'}</td>
                                </>
                              )}
                              {/* Render Simon Effect specific data */}
                              {test.test === 'SimonEffect' && (
                                <>
                                <td style={styles.td}>{response.trial.condition || 'N/A'}</td>
                                <td style={styles.td}>{response.reactionTime || 'N/A'}</td>
                                <td style={styles.td}>{response.userResponse || 'N/A'}</td>
                                <td style={styles.td}>{response.isCorrect ? 'Yes' : 'No'}</td>
                                </>
                              )}
                              {/* Render Dual Task specific data */}
                              {test.test === 'DualTask' && (
                                <>
                                <td style={styles.td}>{response.condition || ''}</td>
                                <td style={styles.td}>{response.selectedNumber || 'N/A'}</td>
                                <td style={styles.td}>{response.reactionTime || 'N/A'}</td>
                                <td style={styles.td}>{response.isCorrect ? 'Yes' : 'No'}</td>
                                </>
                              )}
                              {/* Render Flanker Task specific data */}
                              {test.test === 'Flanker Task' && (
                                <>
                                <td style={styles.td}>{response.trial.condition || 'N/A'}</td>
                                <td style={styles.td}>{response.reactionTime || 'N/A'}</td>
                                <td style={styles.td}>{response.userResponse || 'N/A'}</td>
                                <td style={styles.td}>{response.isCorrect ? 'Yes' : 'No'}</td>
                                </>
                              )}
                              {/* Render Digit Stroop specific data */}
                              {test.test === 'Digit Stroop' && (
                                <>
                                <td style={styles.td}>{response.trial.num1 || 'N/A'}</td>
                                <td style={styles.td}>{response.trial.num2 || 'N/A'}</td>
                                <td style={styles.td}>{response.trial.fontSize1 || 'N/A'}</td>
                                <td style={styles.td}>{response.trial.fontSize2 || 'N/A'}</td>
                                <td style={styles.td}>{response.reactionTime || 'N/A'}</td>
                                <td style={styles.td}>{response.userResponse || 'N/A'}</td>
                                <td style={styles.td}>{response.isCorrect ? 'Yes' : 'No'}</td>
                                </>
                              )}
              
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <button
        onClick={() => navigate('/ClientList')}
        style={styles.button}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
      >
        Back to Patient List
      </button>
    </div>
  );
}

export default UserInformation;
