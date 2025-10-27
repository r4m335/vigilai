import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Navbar, Button, Table, 
  ProgressBar, Alert, Spinner, Badge, Modal, Form 
} from 'react-bootstrap';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getToken } from '../pages/cases/services/Authservice';

function PredictionResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { caseId } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [caseData, setCaseData] = useState(null);
  
  // State for manual prediction
  const [manualPrediction, setManualPrediction] = useState({
    crime_type: '',
    location: '',
    district: '',
    ward: '',
    description: ''
  });

  // Load prediction data
  useEffect(() => {
    const loadPredictionData = async () => {
      const stateData = location.state || {};
      
      if (stateData.prediction) {
        // Data passed via navigation
        setPredictionData(stateData.prediction);
        setCaseData(stateData.caseData);
      } else if (caseId) {
        // Fetch prediction by case ID
        await fetchCasePrediction(caseId);
      } else {
        setError('No prediction data available. Please generate a new prediction.');
      }
    };

    loadPredictionData();
  }, [location.state, caseId]);

  const fetchCasePrediction = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      const response = await fetch(`/api/cases/${id}/generate_prediction/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prediction: ${response.status}`);
      }

      const result = await response.json();
      setPredictionData(result);
      
      // Fetch case details
      const caseResponse = await fetch(`/api/cases/${id}/`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (caseResponse.ok) {
        const caseDetails = await caseResponse.json();
        setCaseData(caseDetails);
      }
      
    } catch (err) {
      console.error('Error fetching prediction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async (data) => {
    setRegenerating(true);
    setError(null);
    
    try {
      const token = getToken();
      
      const predictionData = {
        crime_type: data.crime_type || "THEFT",
        description: data.description || "GENERAL THEFT",
        location: data.location || "STREET",
        district: parseInt(data.district) || 5,
        ward: parseInt(data.ward) || 10,
        datetime: new Date().toISOString(),
        same_district: 1,
        suspect_age: 30
      };

      console.log('Generating prediction with data:', predictionData);

      const response = await fetch('/api/predict/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(predictionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Prediction failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      setPredictionData(result);
      setCaseData({
        crime_type: data.crime_type,
        location: data.location,
        district: data.district,
        ward: data.ward,
        description: data.description
      });
      
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleManualPrediction = async () => {
    if (!manualPrediction.crime_type || !manualPrediction.district) {
      setError('Please fill in at least Crime Type and District');
      return;
    }
    await generatePrediction(manualPrediction);
  };

  const handleViewSuspectDetails = (suspect) => {
    setSelectedSuspect(suspect);
    setShowDetails(true);
  };

  const handleAddToInvestigation = (suspect) => {
    // Implement add to investigation logic
    console.log('Adding to investigation:', suspect);
    alert(`Added ${suspect.name} to investigation list`);
  };

  // Helper functions
  const getVariant = (probability) => {
    if (probability >= 0.8) return 'danger';
    if (probability >= 0.6) return 'warning';
    if (probability >= 0.4) return 'info';
    return 'success';
  };

  const getRiskBadge = (riskLevel) => {
    const risk = riskLevel?.toLowerCase() || 'medium';
    if (risk.includes('high')) return 'bg-danger';
    if (risk.includes('medium')) return 'bg-warning';
    return 'bg-success';
  };

  const getConfidenceBadge = (probability) => {
    if (probability >= 0.8) return 'bg-danger';
    if (probability >= 0.7) return 'bg-warning';
    if (probability >= 0.6) return 'bg-info';
    if (probability >= 0.5) return 'bg-primary';
    return 'bg-secondary';
  };

  const formatProbability = (prob) => (prob * 100).toFixed(1);
  const formatSimilarity = (sim) => (sim * 100).toFixed(1);

  // Loading state
  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
            <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Container>
        </Navbar>
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h5>Loading Prediction Results</h5>
            <p className="text-muted">Analyzing case data and searching criminal databases...</p>
          </div>
        </Container>
      </div>
    );
  }

  // Error state
  if (error && !predictionData) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
            <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Container>
        </Navbar>
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="danger" className="text-center">
                <h5>Prediction Error</h5>
                <p className="mb-3">{error}</p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Button variant="primary" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </Alert>
              
              {/* Manual Prediction Form */}
              <Card className="mt-4">
                <Card.Header>
                  <h5 className="mb-0">Generate New Prediction</h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Crime Type *</Form.Label>
                          <Form.Select 
                            value={manualPrediction.crime_type}
                            onChange={(e) => setManualPrediction({...manualPrediction, crime_type: e.target.value})}
                          >
                            <option value="">Select Crime Type</option>
                            <option value="THEFT">Theft</option>
                            <option value="ROBBERY">Robbery</option>
                            <option value="ASSAULT">Assault</option>
                            <option value="BURGLARY">Burglary</option>
                            <option value="VANDALISM">Vandalism</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Location</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="e.g., STREET, GAS STATION, RESIDENCE"
                            value={manualPrediction.location}
                            onChange={(e) => setManualPrediction({...manualPrediction, location: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>District *</Form.Label>
                          <Form.Control 
                            type="number"
                            placeholder="e.g., 5"
                            value={manualPrediction.district}
                            onChange={(e) => setManualPrediction({...manualPrediction, district: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ward</Form.Label>
                          <Form.Control 
                            type="number"
                            placeholder="e.g., 10"
                            value={manualPrediction.ward}
                            onChange={(e) => setManualPrediction({...manualPrediction, ward: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control 
                        as="textarea"
                        rows={3}
                        placeholder="Describe the crime incident..."
                        value={manualPrediction.description}
                        onChange={(e) => setManualPrediction({...manualPrediction, description: e.target.value})}
                      />
                    </Form.Group>
                    <Button 
                      variant="primary" 
                      onClick={handleManualPrediction}
                      disabled={regenerating}
                    >
                      {regenerating ? 'Generating...' : 'Generate Prediction'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // No data state
  if (!predictionData) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
            <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Container>
        </Navbar>
        <Container className="py-5">
          <Alert variant="info" className="text-center">
            <h5>No Prediction Data</h5>
            <p>Please generate a prediction first or select a case.</p>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  const { suspects, analysis, ml_probability, total_candidates_found, model_version, success } = predictionData;

  if (!success) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
          </Container>
        </Navbar>
        <Container className="py-5">
          <Alert variant="danger">
            <h5>Prediction Failed</h5>
            <p>{predictionData.error || 'Unknown error occurred'}</p>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI - Suspect Prediction</Navbar.Brand>
          <div className="ms-auto">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/dashboard')} 
              className="me-2"
            >
              Dashboard
            </Button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={12}>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="fw-bold text-dark mb-2">AI Suspect Predictions</h2>
              <p className="text-muted mb-3">
                Top suspect matches from criminal databases and historical patterns
              </p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                {model_version && (
                  <Badge bg="info">Model: {model_version}</Badge>
                )}
                {total_candidates_found && (
                  <Badge bg="secondary">{total_candidates_found} candidates analyzed</Badge>
                )}
                {ml_probability && (
                  <Badge bg="primary">ML Score: {formatProbability(ml_probability)}%</Badge>
                )}
              </div>
            </div>

            {/* Case Information */}
            {caseData && (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Case Information</h5>
                  </div>
                  <Row>
                    <Col md={6}>
                      <p><strong>Crime Type:</strong> {caseData.primary_type || caseData.crime_type || 'N/A'}</p>
                      <p><strong>Location:</strong> {caseData.location_description || caseData.location || 'N/A'}</p>
                      <p><strong>District:</strong> {caseData.district || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Description:</strong> {caseData.description || 'N/A'}</p>
                      <p><strong>Ward:</strong> {caseData.ward || 'N/A'}</p>
                      {caseData.date_time && (
                        <p><strong>Date:</strong> {new Date(caseData.date_time).toLocaleDateString()}</p>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Prediction Results */}
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Top Suspect Matches</h5>
                  <Badge bg="primary" className="fs-6">
                    {suspects.length} High-Probability Matches
                  </Badge>
                </div>
                
                {suspects.length > 0 ? (
                  <>
                    <Table striped bordered hover responsive className="align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th width="5%">Rank</th>
                          <th width="15%">Suspect</th>
                          <th width="15%">Probability</th>
                          <th width="10%">Similarity</th>
                          <th width="10%">Age</th>
                          <th width="15%">Location</th>
                          <th width="10%">Risk</th>
                          <th width="20%">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suspects.map((suspect, index) => (
                          <tr key={suspect.suspect_id || index}>
                            <td className="text-center">
                              <Badge bg="dark" className="fs-6">#{suspect.rank}</Badge>
                            </td>
                            <td>
                              <div>
                                <strong>{suspect.name}</strong>
                                <br />
                                <small className="text-muted">ID: {suspect.suspect_id}</small>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="fw-bold me-2">{formatProbability(suspect.probability)}%</span>
                                <ProgressBar 
                                  now={suspect.probability * 100} 
                                  variant={getVariant(suspect.probability)}
                                  style={{ width: '80px', height: '8px' }}
                                />
                              </div>
                              <small className="text-muted">{suspect.confidence} confidence</small>
                            </td>
                            <td>
                              <Badge bg="info" className="w-100">
                                {formatSimilarity(suspect.similarity_score)}% match
                              </Badge>
                            </td>
                            <td>{suspect.age}</td>
                            <td>
                              <div>
                                <small>D: {suspect.district}</small>
                                {suspect.ward && suspect.ward !== 'Unknown' && (
                                  <>, W: {suspect.ward}</>
                                )}
                                <br />
                                <small className="text-muted">{suspect.data_source}</small>
                              </div>
                            </td>
                            <td>
                              <Badge className={getRiskBadge(suspect.risk_level) + " w-100"}>
                                {suspect.risk_level}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleViewSuspectDetails(suspect)}
                                >
                                  Details
                                </Button>
                                <Button 
                                  variant="outline-success" 
                                  size="sm"
                                  onClick={() => handleAddToInvestigation(suspect)}
                                >
                                  Investigate
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {/* AI Analysis */}
                    {analysis && (
                      <div className="mt-4">
                        <h6 className="fw-bold mb-3">AI Analysis</h6>
                        <Card className="bg-light border-0">
                          <Card.Body>
                            <p className="mb-0">{analysis}</p>
                          </Card.Body>
                        </Card>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 mt-4 flex-wrap">
                      <Button 
                        variant="primary" 
                        onClick={() => navigate('/dashboard')}
                      >
                        Back to Dashboard
                      </Button>
                      <Button 
                        variant="success" 
                        onClick={() => window.print()}
                      >
                        Print Report
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert variant="info" className="text-center">
                    <h5>No Strong Matches Found</h5>
                    <p className="mb-3">
                      The AI could not find strong suspect matches for this case pattern. 
                      This could be due to unique circumstances or limited data for this crime type.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>
                      Back to Dashboard
                    </Button>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Suspect Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Suspect Details - {selectedSuspect?.name}
            {selectedSuspect && (
              <Badge bg="secondary" className="ms-2">{selectedSuspect.suspect_id}</Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSuspect && (
            <Row>
              <Col md={6}>
                <h6>Personal Information</h6>
                <Table striped bordered size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Name</strong></td>
                      <td>{selectedSuspect.name}</td>
                    </tr>
                    <tr>
                      <td><strong>Age</strong></td>
                      <td>{selectedSuspect.age}</td>
                    </tr>
                    <tr>
                      <td><strong>Gender</strong></td>
                      <td>{selectedSuspect.gender}</td>
                    </tr>
                    <tr>
                      <td><strong>District</strong></td>
                      <td>{selectedSuspect.district}</td>
                    </tr>
                    <tr>
                      <td><strong>Ward</strong></td>
                      <td>{selectedSuspect.ward}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6>Risk Assessment</h6>
                <Table striped bordered size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Probability Score</strong></td>
                      <td>{formatProbability(selectedSuspect.probability)}%</td>
                    </tr>
                    <tr>
                      <td><strong>Similarity Score</strong></td>
                      <td>{formatSimilarity(selectedSuspect.similarity_score)}%</td>
                    </tr>
                    <tr>
                      <td><strong>Risk Level</strong></td>
                      <td>
                        <Badge className={getRiskBadge(selectedSuspect.risk_level)}>
                          {selectedSuspect.risk_level}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Confidence</strong></td>
                      <td>
                        <Badge className={getConfidenceBadge(selectedSuspect.probability)}>
                          {selectedSuspect.confidence}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Data Source</strong></td>
                      <td>
                        <Badge bg="secondary">
                          {selectedSuspect.data_source === 'training_data' ? 'Historical Cases' : 'Active Suspect List'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={12} className="mt-3">
                <h6>Crime Pattern Information</h6>
                <Card className="bg-light">
                  <Card.Body>
                    <p className="mb-1">
                      <strong>Associated Crime Type:</strong> {selectedSuspect.crime_type}
                    </p>
                    <p className="mb-1">
                      <strong>Common Location:</strong> {selectedSuspect.location}
                    </p>
                    <p className="mb-0">
                      <strong>Match Reason:</strong> High similarity in crime patterns, geographic proximity, and demographic profile.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            handleAddToInvestigation(selectedSuspect);
            setShowDetails(false);
          }}>
            Add to Investigation
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PredictionResults;