import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Card, Row, Col, Navbar, Button, Badge, Accordion, Image } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { 
  fetchCases, 
  deleteCase, 
  fetchEvidence, 
  fetchWitnesses, 
  fetchCriminalRecords 
} from './CaseService';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [caseDetails, setCaseDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch cases data
    loadCases();
    
    // Load profile photo
    loadProfilePhoto();
    
    // Set up storage event listener to detect profile photo updates
    const handleStorageChange = (e) => {
      if (e.key === 'profile_photo') {
        setProfilePhoto(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const loadProfilePhoto = () => {
    // Try to get profile photo from localStorage
    const storedProfilePhoto = localStorage.getItem('profile_photo');
    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    } else {
      // If not in localStorage, try to fetch from API
      fetchProfilePhoto();
    }
  };

  const fetchProfilePhoto = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/profile/', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const profileData = await response.json();
        if (profileData.profile_photo) {
          // Make sure we have the full URL for the profile photo
          const photoUrl = profileData.profile_photo.startsWith('http') 
            ? profileData.profile_photo 
            : `${window.location.origin}${profileData.profile_photo}`;
          
          setProfilePhoto(photoUrl);
          localStorage.setItem('profile_photo', photoUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching profile photo:', err);
    }
  };

  const loadCases = () => {
    setLoading(true);
    fetchCases()
      .then(response => {
        setCases(response.data);
        setLoading(false);
      })
      .catch(err => { 
        console.error(err);
        if (err.response && err.response.status === 401) {
          // Token is invalid, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('profile_photo');
          navigate('/login');
        } else {
          setError('Failed to load cases.');
        }
        setLoading(false);
      });
  };

  const loadCaseDetails = async (caseId) => {
    try {
      const [evidenceRes, witnessesRes, recordsRes] = await Promise.all([
        fetchEvidence(caseId),
        fetchWitnesses(caseId),
        fetchCriminalRecords(caseId)
      ]);

      setCaseDetails(prev => ({
        ...prev,
        [caseId]: {
          evidence: evidenceRes.data,
          witnesses: witnessesRes.data,
          criminalRecords: recordsRes.data
        }
      }));
    } catch (err) {
      console.error('Error loading case details:', err);
      setError('Failed to load case details.');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      deleteCase(id)
        .then(() => {
          // Remove the case from the local state
          setCases(cases.filter(c => c.id !== id));
          // Remove from caseDetails if exists
          const newCaseDetails = { ...caseDetails };
          delete newCaseDetails[id];
          setCaseDetails(newCaseDetails);
        })
        .catch(err => {
          console.error('Error deleting case:', err);
          setError('Failed to delete case.');
        });
    }
  };

  const handleExpandCase = (caseId) => {
    if (expandedCase === caseId) {
      setExpandedCase(null);
    } else {
      setExpandedCase(caseId);
      if (!caseDetails[caseId]) {
        loadCaseDetails(caseId);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('profile_photo');
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const variant = {
      'Open': 'success',
      'In Progress': 'primary',
      'Pending': 'warning',
      'Closed': 'secondary',
      'Reopened': 'info'
    }[status] || 'secondary';
    
    return <Badge bg={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
            <div className="ms-auto d-flex align-items-center">
              <Link to="/profile" className="text-decoration-none me-3">
                {profilePhoto ? (
                  <Image
                    src={profilePhoto}
                    alt="Profile"
                    roundedCircle
                    style={{ width: '35px', height: '35px', objectFit: 'cover' }}
                    className="border"
                  />
                ) : (
                  <div
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                    style={{ width: '35px', height: '35px', border: '1px solid #dee2e6' }}
                  >
                    <i className="bi bi-person text-muted"></i>
                  </div>
                )}
              </Link>
              <button onClick={handleLogout} className="btn btn-outline-primary btn-sm">
                Logout
              </button>
            </div>
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Loading cases...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
          <div className="ms-auto d-flex align-items-center">
            <Link to="/profile" className="text-decoration-none me-3" title="Profile">
              {profilePhoto ? (
                <Image
                  src={profilePhoto}
                  alt="Profile"
                  roundedCircle
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  className="border"
                />
              ) : (
                <div
                  className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', border: '1px solid #dee2e6' }}
                  title="Profile"
                >
                  <i className="bi bi-person text-muted"></i>
                </div>
              )}
            </Link>
            <Link to="/cases/new" className="btn btn-primary btn-sm me-2">
              <i className="bi bi-plus-circle me-1"></i>Create New Case
            </Link>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline-primary btn-sm"
            >
              Logout
            </button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-5">
        {error && (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        )}

        <Row className="justify-content-center mb-4">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="fw-bold text-dark mb-0">Cases Dashboard</h2>
              <span className="badge bg-primary">{cases.length} cases</span>
            </div>
            <p className="text-muted">Manage and track all your cases in one place</p>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={10}>
            {cases.length > 0 ? (
              <Accordion activeKey={expandedCase}>
                {cases.map(c => (
                  <Card key={c.id} className="border-0 shadow-sm auth-card mb-3">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="fw-bold">#{c.crime_id} - {c.case_number || 'Untitled Case'}</h5>
                          <p className="text-muted mb-2">{c.description}</p>
                          <div className="d-flex gap-2 mb-2">
                            {getStatusBadge(c.status)}
                            <Badge bg="light" text="dark">
                              Type: {c.type_of_crime || 'Not specified'}
                            </Badge>
                            <Badge bg="light" text="dark">
                              {new Date(c.date).toLocaleDateString()}
                            </Badge>
                            <Badge bg="light" text="dark">
                              {c.location}
                            </Badge>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <Link 
                            to={`/cases/edit/${c.id}`} 
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(c.id)}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleExpandCase(c.id)}
                          >
                            {expandedCase === c.id ? 'Collapse' : 'View Details'}
                          </Button>
                        </div>
                      </div>

                      <Accordion.Collapse eventKey={c.id}>
                        <div className="mt-4">
                          {/* Evidence Section - Updated to show Type of Evidence */}
                          <h6 className="fw-bold mb-3">Evidence</h6>
                          {caseDetails[c.id]?.evidence?.length > 0 ? (
                            <Table striped bordered responsive size="sm" className="mb-4">
                              <thead>
                                <tr>
                                  <th>Type of Evidence</th>
                                  <th>Details</th>
                                  <th>File</th>
                                </tr>
                              </thead>
                              <tbody>
                                {caseDetails[c.id].evidence.map(evidence => (
                                  <tr key={evidence.id}>
                                    <td>{evidence.type_of_evidence}</td>
                                    <td>{evidence.details}</td>
                                    <td>
                                      {evidence.file ? (
                                        <a href={evidence.file} target="_blank" rel="noopener noreferrer">
                                          View File
                                        </a>
                                      ) : (
                                        'No file'
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          ) : (
                            <p className="text-muted mb-4">No evidence recorded.</p>
                          )}

                          {/* Witnesses Section */}
                          <h6 className="fw-bold mb-3">Witnesses</h6>
                          {caseDetails[c.id]?.witnesses?.length > 0 ? (
                            <Table striped bordered responsive size="sm" className="mb-4">
                              <thead>
                                <tr>
                                  <th>Statement</th>
                                </tr>
                              </thead>
                              <tbody>
                                {caseDetails[c.id].witnesses.map(witness => (
                                  <tr key={witness.id}>
                                    <td>{witness.statement}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          ) : (
                            <p className="text-muted mb-4">No witness statements recorded.</p>
                          )}

                          {/* Criminal Records Section */}
                          <h6 className="fw-bold mb-3">Criminal Records</h6>
                          {caseDetails[c.id]?.criminalRecords?.length > 0 ? (
                            <Table striped bordered responsive size="sm" className="mb-4">
                              <thead>
                                <tr>
                                  <th>Details of Past Offense</th>
                                </tr>
                              </thead>
                              <tbody>
                                {caseDetails[c.id].criminalRecords.map(record => (
                                  <tr key={record.id}>
                                    <td>{record.details}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          ) : (
                            <p className="text-muted">No criminal records recorded.</p>
                          )}
                        </div>
                      </Accordion.Collapse>
                    </Card.Body>
                  </Card>
                ))}
              </Accordion>
            ) : (
              <Card className="border-0 shadow-sm auth-card">
                <Card.Body className="p-4">
                  <div className="text-center py-5">
                    <i className="bi bi-folder-x text-muted" style={{ fontSize: '3rem' }}></i>
                    <h5 className="mt-3 text-muted">No cases found</h5>
                    <p className="text-muted">Get started by creating your first case</p>
                    <Link to="/cases/new" className="btn btn-primary mt-2">
                      Create New Case
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Stats Cards */}
        {cases.length > 0 && (
          <Row className="mt-5 justify-content-center">
            <Col lg={10}>
              <h5 className="fw-bold mb-4">Case Overview</h5>
              <Row>
                <Col md={3} className="mb-3">
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h3 className="fw-bold text-primary">{cases.filter(c => c.status === 'Open').length}</h3>
                      <p className="text-muted mb-0">Open Cases</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h3 className="fw-bold text-warning">{cases.filter(c => c.status === 'Pending').length}</h3>
                      <p className="text-muted mb-0">Pending Cases</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h3 className="fw-bold text-success">{cases.filter(c => c.status === 'Closed').length}</h3>
                      <p className="text-muted mb-0">Closed Cases</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h3 className="fw-bold text-info">{cases.length}</h3>
                      <p className="text-muted mb-0">Total Cases</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}