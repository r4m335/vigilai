import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Navbar, Button, Table, 
  ProgressBar, Alert, Spinner, Badge, Modal, Form,
  Dropdown, InputGroup, Image
} from 'react-bootstrap';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { getToken } from '../pages/cases/services/Authservice';

// Kerala districts array with fixed order
const KERALA_DISTRICTS = [
  { id: 1, name: 'Thiruvananthapuram' },
  { id: 2, name: 'Kollam' },
  { id: 3, name: 'Pathanamthitta' },
  { id: 4, name: 'Alappuzha' },
  { id: 5, name: 'Kottayam' },
  { id: 6, name: 'Idukki' },
  { id: 7, name: 'Ernakulam' },
  { id: 8, name: 'Thrissur' },
  { id: 9, name: 'Palakkad' },
  { id: 10, name: 'Malappuram' },
  { id: 11, name: 'Kozhikode' },
  { id: 12, name: 'Wayanad' },
  { id: 13, name: 'Kannur' },
  { id: 14, name: 'Kasaragod' }
];

// Function to get district name by ID
const getDistrictName = (districtId) => {
  if (!districtId) return 'N/A';
  
  const district = KERALA_DISTRICTS.find(d => d.id === parseInt(districtId));
  return district ? district.name : `District ${districtId}`;
};

// Function to get district ID by name
const getDistrictId = (districtName) => {
  if (!districtName) return null;
  
  const district = KERALA_DISTRICTS.find(d => 
    d.name.toLowerCase() === districtName.toLowerCase().trim()
  );
  return district ? district.id : null;
};

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
  
  // Sorting and filtering states
  const [sortField, setSortField] = useState('probability');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterDataSource, setFilterDataSource] = useState('all');
  const [filterRiskLevel, setFilterRiskLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for manual prediction
  const [manualPrediction, setManualPrediction] = useState({
    primary_type: '',
    location_description: '',
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
      
      // Log the result for debugging
      console.log('Prediction result:', result);
      
      setPredictionData(result);
      
      // Fetch case details with more information
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
        primary_type: data.primary_type || "THEFT",
        description: data.description || "GENERAL THEFT",
        location_description: data.location_description || "STREET",
        district: parseInt(data.district) || 5,
        ward: parseInt(data.ward) || 10,
        datetime: new Date().toISOString(),
        same_district: 1,
        criminal_age: 30
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
        primary_type: data.primary_type,
        location_description: data.location_description,
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
    if (!manualPrediction.primary_type || !manualPrediction.district) {
      setError('Please fill in at least Crime Type and District');
      return;
    }
    await generatePrediction(manualPrediction);
  };

  const handleRowClick = (suspect) => {
    setSelectedSuspect(suspect);
    setShowDetails(true);
  };

  const handleAddToInvestigation = async (suspect) => {
    try {
      const token = getToken();
      
      // Create criminal record for this case
      const response = await fetch('/api/criminal-records/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          case: caseId,
          suspect: suspect.criminal_id,
          offenses: `Linked via AI prediction with ${(suspect.probability * 100).toFixed(1)}% probability`
        })
      });

      if (response.ok) {
        alert(`✅ ${suspect.criminal_name} has been added to the investigation for Case ${caseId}`);
      } else {
        throw new Error('Failed to add to investigation');
      }
    } catch (err) {
      console.error('Error adding to investigation:', err);
      alert(`❌ Failed to add ${suspect.criminal_name} to investigation: ${err.message}`);
    }
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

  const formatProbability = (prob) => prob ? (prob * 100).toFixed(1) : '0.0';
  const formatSimilarity = (sim) => sim ? (sim * 100).toFixed(1) : '0.0';

  // Get photo URL or default placeholder
  const getPhotoUrl = (suspect) => {
    if (!suspect) return getDefaultPhoto();
    
    // Check for photo in various possible fields
    if (suspect.photo) return suspect.photo;
    if (suspect.profile_photo) return suspect.profile_photo;
    if (suspect.criminal_photo) return suspect.criminal_photo;
    if (suspect.image_url) return suspect.image_url;
    
    // Return default placeholder based on gender
    return getDefaultPhoto(suspect.criminal_gender);
  };

  const getDefaultPhoto = (gender) => {
    const genderLower = gender?.toLowerCase();
    if (genderLower === 'female') {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGMzNTQ1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZmVtYWxlIj48cGF0aCBkPSJNMTIgMTJhNSA1IDAgMSAwIDAtMTAgNSA1IDAgMCAwIDAgMTBaIi8+PHBhdGggZD0iTTEyIDE2djciLz48cGF0aCBkPSJNOSAyMGg2Ii8+PC9zdmc+';
    }
    
    // Default male placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIzMzY2OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tYWxlIj48cGF0aCBkPSJNMTAuMjUgMTAuMzVBNS41IDUuNSAwIDEgMCAxMiA1YTUgNSAwIDAgMCAxLjc1IDEwLjM1Ii8+PHBhdGggZD0iTTEyIDEydiIvPjxwYXRoIGQ9Ik0xNCAxOWgtNCIvPjwvc3ZnPg==';
  };

  // Calculate age from date of birth if available
  const calculateAge = (suspect) => {
    if (!suspect) return 'N/A';
    
    // First check for direct age field
    if (suspect.age !== undefined) return suspect.age;
    if (suspect.criminal_age !== undefined) return suspect.criminal_age;
    
    // Calculate from date of birth
    if (suspect.date_of_birth) {
      try {
        const today = new Date();
        const birthDate = new Date(suspect.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      } catch (err) {
        console.error('Error calculating age:', err);
      }
    }
    
    return 'N/A';
  };

  // Safe getter for nested properties
  const safeGet = (obj, path, defaultValue = 'N/A') => {
    if (!obj) return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
      if (result === undefined) return defaultValue;
    }
    
    return result === null || result === undefined ? defaultValue : result;
  };

  // Get district name for display
  const getDisplayDistrict = (districtValue) => {
    if (!districtValue || districtValue === 'Unknown') return 'N/A';
    
    // Try to get district name
    const districtName = getDistrictName(districtValue);
    
    // If it's not a number or we got a district name
    if (isNaN(districtValue) || districtName !== `District ${districtValue}`) {
      return districtName;
    }
    
    return `District ${districtValue}`;
  };

  // Sorting and filtering functions
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedAndFilteredSuspects = () => {
    if (!predictionData?.suspects) return [];

    let filtered = [...predictionData.suspects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(suspect => {
        const name = safeGet(suspect, 'criminal_name', '').toLowerCase();
        const id = safeGet(suspect, 'criminal_id', '').toString();
        const aadhaar = safeGet(suspect, 'aadhaar_number', '');
        const district = getDisplayDistrict(safeGet(suspect, 'criminal_district')).toLowerCase();
        
        return name.includes(searchTerm.toLowerCase()) ||
               id.includes(searchTerm) ||
               aadhaar.includes(searchTerm) ||
               district.includes(searchTerm.toLowerCase());
      });
    }

    // Apply data source filter
    if (filterDataSource !== 'all') {
      filtered = filtered.filter(suspect => safeGet(suspect, 'data_source') === filterDataSource);
    }

    // Apply risk level filter
    if (filterRiskLevel !== 'all') {
      filtered = filtered.filter(suspect => {
        const risk = safeGet(suspect, 'risk_level', '').toLowerCase();
        return risk.includes(filterRiskLevel.toLowerCase());
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = safeGet(a, sortField, 0);
      let bValue = safeGet(b, sortField, 0);

      if (sortField === 'probability' || sortField === 'similarity_score') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (sortField === 'criminal_name' || sortField === 'risk_level' || sortField === 'data_source') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortField === 'criminal_district') {
        aValue = getDisplayDistrict(aValue).toLowerCase();
        bValue = getDisplayDistrict(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

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
                            value={manualPrediction.primary_type}
                            onChange={(e) => setManualPrediction({...manualPrediction, primary_type: e.target.value})}
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
                            value={manualPrediction.location_description}
                            onChange={(e) => setManualPrediction({...manualPrediction, location_description: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>District *</Form.Label>
                          <Form.Select
                            value={manualPrediction.district}
                            onChange={(e) => setManualPrediction({...manualPrediction, district: e.target.value})}
                          >
                            <option value="">Select District</option>
                            {KERALA_DISTRICTS.map(district => (
                              <option key={district.id} value={district.id}>
                                {district.name}
                              </option>
                            ))}
                          </Form.Select>
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

  const { suspects = [], analysis, ml_probability, total_candidates_found, model_version, success } = predictionData;
  const filteredSuspects = getSortedAndFilteredSuspects();

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
            {predictionData.details && (
              <pre className="mt-2 small bg-light p-2 rounded">
                {JSON.stringify(predictionData.details, null, 2)}
              </pre>
            )}
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
            <Link to="/dashboard" className="btn btn-primary btn-sm me-2">
              Dashboard
            </Link>
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
                {total_candidates_found !== undefined && (
                  <Badge bg="secondary">{total_candidates_found} candidates analyzed</Badge>
                )}
                {ml_probability !== undefined && (
                  <Badge bg="primary">ML Score: {formatProbability(ml_probability)}%</Badge>
                )}
              </div>
            </div>

            {/* Enhanced Case Information */}
            {caseData && (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Case Information</h5>
                    {caseData.case_number && (
                      <Badge bg="dark" className="fs-6">Case #: {caseData.case_number}</Badge>
                    )}
                  </div>
                  <Row>
                    <Col md={6}>
                      <p><strong>Crime Type:</strong> {caseData.primary_type || 'N/A'}</p>
                      <p><strong>Location:</strong> {caseData.location_description || 'N/A'}</p>
                      <p><strong>District:</strong> {getDisplayDistrict(caseData.district)}</p>
                      <p><strong>Ward:</strong> {caseData.ward || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Description:</strong> {caseData.description || 'N/A'}</p>
                      {caseData.date_time && (
                        <p><strong>Date & Time:</strong> {new Date(caseData.date_time).toLocaleString()}</p>
                      )}
                      {caseData.status && (
                        <p><strong>Status:</strong> <Badge bg={
                          caseData.status === 'Open' ? 'success' : 
                          caseData.status === 'In Progress' ? 'warning' : 
                          caseData.status === 'Closed' ? 'secondary' : 'info'
                        }>{caseData.status}</Badge></p>
                      )}
                      {caseData.investigator && (
                        <p><strong>Investigator:</strong> {caseData.investigator}</p>
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
                  <div className="d-flex gap-2">
                    <Badge bg="primary" className="fs-6">
                      {filteredSuspects.length} Matches
                    </Badge>
                    {filteredSuspects.length !== suspects.length && (
                      <Badge bg="warning" className="fs-6">
                        Filtered from {suspects.length}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Sorting and Filtering Controls */}
                <Row className="mb-3">
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text>🔍</InputGroup.Text>
                      <Form.Control
                        placeholder="Search by name, ID, Aadhaar, or district..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={4}>
                    <Form.Select
                      value={filterDataSource}
                      onChange={(e) => setFilterDataSource(e.target.value)}
                    >
                      <option value="all">All Data Sources</option>
                      <option value="criminal_database">Criminal Database</option>
                      <option value="training_data">Historical Data</option>
                      <option value="ai_generated">AI Generated</option>
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Select
                      value={filterRiskLevel}
                      onChange={(e) => setFilterRiskLevel(e.target.value)}
                    >
                      <option value="all">All Risk Levels</option>
                      <option value="high">High Risk</option>
                      <option value="medium">Medium Risk</option>
                      <option value="low">Low Risk</option>
                    </Form.Select>
                  </Col>
                </Row>
                
                {filteredSuspects.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <Table striped bordered hover responsive className="align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th width="5%" style={{cursor: 'pointer'}} onClick={() => handleSort('rank')}>
                              Rank {getSortIcon('rank')}
                            </th>
                            <th width="10%">Photo</th>
                            <th width="20%" style={{cursor: 'pointer'}} onClick={() => handleSort('criminal_name')}>
                              Suspect {getSortIcon('criminal_name')}
                            </th>
                            <th width="15%" style={{cursor: 'pointer'}} onClick={() => handleSort('probability')}>
                              Probability {getSortIcon('probability')}
                            </th>
                            <th width="10%" style={{cursor: 'pointer'}} onClick={() => handleSort('similarity_score')}>
                              Similarity {getSortIcon('similarity_score')}
                            </th>
                            <th width="8%" style={{cursor: 'pointer'}} onClick={() => handleSort('criminal_age')}>
                              Age {getSortIcon('criminal_age')}
                            </th>
                            <th width="17%" style={{cursor: 'pointer'}} onClick={() => handleSort('criminal_district')}>
                              Location {getSortIcon('criminal_district')}
                            </th>
                            <th width="15%">Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSuspects.map((suspect, index) => (
                            <tr 
                              key={suspect.criminal_id || index}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRowClick(suspect)}
                              className="hover-row"
                            >
                              <td className="text-center">
                                <Badge bg="dark" className="fs-6">#{safeGet(suspect, 'rank', index + 1)}</Badge>
                              </td>
                              <td className="text-center">
                                <div style={{ width: '60px', height: '60px', margin: '0 auto' }}>
                                  <Image
                                    src={getPhotoUrl(suspect)}
                                    alt={safeGet(suspect, 'criminal_name', 'Suspect')}
                                    fluid
                                    className="rounded border"
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      backgroundColor: '#f8f9fa'
                                    }}
                                    onError={(e) => {
                                      // Fallback to icon if image fails to load
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = `
                                        <div class="text-center text-muted" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                                          <i class="bi bi-person" style="font-size: 2rem;"></i>
                                        </div>
                                      `;
                                    }}
                                  />
                                </div>
                              </td>
                              <td>
                                <div>
                                  <strong>{safeGet(suspect, 'criminal_name', 'Unknown Suspect')}</strong>
                                  <br />
                                  <small className="text-muted">ID: {safeGet(suspect, 'criminal_id', 'N/A')}</small>
                                  {safeGet(suspect, 'aadhaar_number') && safeGet(suspect, 'aadhaar_number') !== 'Unknown' && (
                                    <>
                                      <br />
                                      <small className="text-muted">Aadhaar: {safeGet(suspect, 'aadhaar_number')}</small>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span className="fw-bold me-2">{formatProbability(safeGet(suspect, 'probability', 0))}%</span>
                                  <ProgressBar 
                                    now={safeGet(suspect, 'probability', 0) * 100} 
                                    variant={getVariant(safeGet(suspect, 'probability', 0))}
                                    style={{ width: '80px', height: '8px' }}
                                  />
                                </div>
                                <small className="text-muted">{safeGet(suspect, 'confidence', 'Medium')} confidence</small>
                              </td>
                              <td>
                                <Badge bg="info" className="w-100">
                                  {formatSimilarity(safeGet(suspect, 'similarity_score', 0))}% match
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="secondary">
                                  {calculateAge(suspect)} {typeof calculateAge(suspect) === 'number' ? 'yrs' : ''}
                                </Badge>
                              </td>
                              <td>
                                <div>
                                  <strong>{getDisplayDistrict(safeGet(suspect, 'criminal_district'))}</strong>
                                  {safeGet(suspect, 'ward') && safeGet(suspect, 'ward') !== 'Unknown' && (
                                    <div>
                                      <small>Ward: {safeGet(suspect, 'ward')}</small>
                                    </div>
                                  )}
                                  <br />
                                  <small className="text-muted">
                                    {safeGet(suspect, 'data_source') === 'criminal_database' ? 'Criminal DB' : 
                                     safeGet(suspect, 'data_source') === 'training_data' ? 'Historical Data' : 
                                     safeGet(suspect, 'data_source', 'Unknown')}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <Badge className={getRiskBadge(safeGet(suspect, 'risk_level')) + " w-100"}>
                                  {safeGet(suspect, 'risk_level', 'Medium')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

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
                      <Button 
                        variant="outline-secondary"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterDataSource('all');
                          setFilterRiskLevel('all');
                          setSortField('probability');
                          setSortDirection('desc');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert variant="info" className="text-center">
                    <h5>No Matches Found</h5>
                    <p className="mb-3">
                      {suspects.length === 0 
                        ? "The AI could not find strong suspect matches for this case pattern. This could be due to unique circumstances or limited data for this crime type."
                        : "No suspects match your current filters. Try adjusting your search criteria."
                      }
                    </p>
                    {suspects.length > 0 && (
                      <Button 
                        variant="primary" 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterDataSource('all');
                          setFilterRiskLevel('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
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
            Suspect Details - {safeGet(selectedSuspect, 'criminal_name', 'Unknown')}
            {selectedSuspect && (
              <Badge bg="secondary" className="ms-2">{safeGet(selectedSuspect, 'criminal_id', 'N/A')}</Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSuspect && (
            <Row>
              <Col md={4} className="text-center">
                <div style={{ width: '200px', height: '200px', margin: '0 auto 20px' }}>
                  <Image
                    src={getPhotoUrl(selectedSuspect)}
                    alt={safeGet(selectedSuspect, 'criminal_name', 'Suspect')}
                    fluid
                    className="rounded border"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      backgroundColor: '#f8f9fa'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="text-center text-muted" style="width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                          <i class="bi bi-person" style="font-size: 4rem;"></i>
                          <div class="mt-2">No photo available</div>
                        </div>
                      `;
                    }}
                  />
                </div>
                {safeGet(selectedSuspect, 'photo') && (
                  <small className="text-muted">Click image to view full size</small>
                )}
              </Col>
              <Col md={8}>
                <Row>
                  <Col md={6}>
                    <h6>Personal Information</h6>
                    <Table striped bordered size="sm">
                      <tbody>
                        <tr>
                          <td><strong>Name</strong></td>
                          <td>{safeGet(selectedSuspect, 'criminal_name', 'Unknown')}</td>
                        </tr>
                        <tr>
                          <td><strong>Age</strong></td>
                          <td>{calculateAge(selectedSuspect)} years</td>
                        </tr>
                        <tr>
                          <td><strong>Gender</strong></td>
                          <td>{safeGet(selectedSuspect, 'criminal_gender', 'Not specified')}</td>
                        </tr>
                        <tr>
                          <td><strong>District</strong></td>
                          <td>{getDisplayDistrict(safeGet(selectedSuspect, 'criminal_district'))}</td>
                        </tr>
                        <tr>
                          <td><strong>Ward</strong></td>
                          <td>{safeGet(selectedSuspect, 'ward', 'Unknown')}</td>
                        </tr>
                        {safeGet(selectedSuspect, 'aadhaar_number') && safeGet(selectedSuspect, 'aadhaar_number') !== 'Unknown' && (
                          <tr>
                            <td><strong>Aadhaar Number</strong></td>
                            <td className="font-monospace">{safeGet(selectedSuspect, 'aadhaar_number')}</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <h6>Risk Assessment</h6>
                    <Table striped bordered size="sm">
                      <tbody>
                        <tr>
                          <td><strong>Probability Score</strong></td>
                          <td>{formatProbability(safeGet(selectedSuspect, 'probability', 0))}%</td>
                        </tr>
                        <tr>
                          <td><strong>Similarity Score</strong></td>
                          <td>{formatSimilarity(safeGet(selectedSuspect, 'similarity_score', 0))}%</td>
                        </tr>
                        <tr>
                          <td><strong>Risk Level</strong></td>
                          <td>
                            <Badge className={getRiskBadge(safeGet(selectedSuspect, 'risk_level'))}>
                              {safeGet(selectedSuspect, 'risk_level', 'Medium')}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Confidence</strong></td>
                          <td>
                            <Badge className={getConfidenceBadge(safeGet(selectedSuspect, 'probability', 0))}>
                              {safeGet(selectedSuspect, 'confidence', 'Medium')}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Data Source</strong></td>
                          <td>
                            <Badge bg="secondary">
                              {safeGet(selectedSuspect, 'data_source') === 'criminal_database' ? 'Criminal Database' : 
                               safeGet(selectedSuspect, 'data_source') === 'training_data' ? 'Historical Cases' : 
                               safeGet(selectedSuspect, 'data_source', 'Unknown')}
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} className="mt-3">
                    <h6>Crime Pattern Information</h6>
                    <Card className="bg-light">
                      <Card.Body>
                        <p className="mb-1">
                          <strong>Associated Crime Type:</strong> {safeGet(selectedSuspect, 'primary_type', 'Various')}
                        </p>
                        <p className="mb-1">
                          <strong>Common Location:</strong> {safeGet(selectedSuspect, 'location_description', 'Various')}
                        </p>
                        <p className="mb-0">
                          <strong>Match Reason:</strong> {safeGet(selectedSuspect, 'match_reason', 'High similarity in crime patterns, geographic proximity, and demographic profile.')}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
          {caseId && selectedSuspect && safeGet(selectedSuspect, 'criminal_id') && (
            <Button variant="primary" onClick={() => {
              handleAddToInvestigation(selectedSuspect);
              setShowDetails(false);
            }}>
              Add to Investigation
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .hover-row:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
}

export default PredictionResults;