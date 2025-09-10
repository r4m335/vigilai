import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Spinner, Alert, Card, Row, Col, Navbar, Image } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchCase, createCase, updateCase } from './CaseService';
import { logout } from './services/Authservice';
import EvidenceForm from './EvidenceForm';
import WitnessForm from './WitnessForm';
import CriminalRecordForm from './CriminalRecordForm';

export default function CaseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    crime_id: '',
    case_number: '', // Changed from title to case_number
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    status: 'Open',
    investigator: '',
    type_of_crime: ''
  });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('case-details');
  const [newCaseId, setNewCaseId] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const statusOptions = ['Open', 'In Progress', 'Pending', 'Closed', 'Reopened'];
  const crimeTypeOptions = [
    'Burglary',
    'Robbery',
    'Assault',
    'Theft',
    'Fraud',
    'Homicide',
    'Cyber Crime',
    'Drug Offense',
    'Domestic Violence',
    'Vandalism',
    'Other'
  ];

  // Fetch existing case data if in edit mode
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      fetchCase(id)
        .then(res => {
          setFormData({
            crime_id: res.data.crime_id || '',
            case_number: res.data.case_number || res.data.title || '', // Handle both old and new field names
            description: res.data.description || '',
            date: res.data.date || new Date().toISOString().split('T')[0],
            location: res.data.location || '',
            status: res.data.status || 'Open',
            investigator: res.data.investigator || '',
            type_of_crime: res.data.type_of_crime || ''
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching case:', err);
          setError('Failed to load case data.');
          setLoading(false);
        });
    }

    // Try to get profile photo from localStorage
    const storedProfilePhoto = localStorage.getItem('profile_photo');
    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }
  }, [id, isEdit]);

  // Redirect to evidence tab when new case is created
  useEffect(() => {
    if (newCaseId && !isEdit) {
      setActiveTab('evidence');
    }
  }, [newCaseId, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const request = isEdit 
      ? updateCase(id, formData) 
      : createCase(formData);

    request
      .then((response) => {
        if (!isEdit) {
          // Store the new case ID and let the useEffect handle the redirect
          setNewCaseId(response.data.id);
          setError('Case created successfully! You can now add evidence.');
        } else {
          setError('Case updated successfully!');
          setTimeout(() => setError(null), 3000);
        }
      })
      .catch(err => {
        console.error('Submission error:', err);
        setError(err.response?.data?.message || 'Submission failed. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'evidence':
        return <EvidenceForm caseId={isEdit ? id : newCaseId} />;
      case 'witnesses':
        return <WitnessForm caseId={isEdit ? id : newCaseId} />;
      case 'criminal-records':
        return <CriminalRecordForm caseId={isEdit ? id : newCaseId} />;
      case 'case-details':
      default:
        return (
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group controlId="crimeId" className="mb-3">
                  <Form.Label className="fw-semibold">Crime ID *</Form.Label>
                  <Form.Control
                    name="crime_id"
                    type="text"
                    placeholder="Enter crime ID"
                    value={formData.crime_id}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="caseDate" className="mb-3">
                  <Form.Label className="fw-semibold">Date *</Form.Label>
                  <Form.Control
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="caseNumber" className="mb-3">
                  <Form.Label className="fw-semibold">Case Number *</Form.Label>
                  <Form.Control
                    name="case_number"
                    type="text"
                    placeholder="Enter case number"
                    value={formData.case_number}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="typeOfCrime" className="mb-3">
                  <Form.Label className="fw-semibold">Type of Crime *</Form.Label>
                  <Form.Select
                    name="type_of_crime"
                    value={formData.type_of_crime}
                    onChange={handleChange}
                    className="auth-input"
                    required
                  >
                    <option value="">Select type of crime</option>
                    {crimeTypeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="caseLocation" className="mb-3">
              <Form.Label className="fw-semibold">Location</Form.Label>
              <Form.Control
                name="location"
                type="text"
                placeholder="Enter crime location"
                value={formData.location}
                onChange={handleChange}
                className="auth-input"
              />
            </Form.Group>

            <Form.Group controlId="caseInvestigator" className="mb-3">
              <Form.Label className="fw-semibold">Investigator</Form.Label>
              <Form.Control
                name="investigator"
                type="text"
                placeholder="Enter investigator name"
                value={formData.investigator}
                onChange={handleChange}
                className="auth-input"
              />
            </Form.Group>

            <Form.Group controlId="caseDescription" className="mb-3">
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                name="description"
                as="textarea"
                rows={4}
                placeholder="Enter case description"
                value={formData.description}
                onChange={handleChange}
                className="auth-input"
              />
            </Form.Group>

            <Form.Group controlId="caseStatus" className="mb-4">
              <Form.Label className="fw-semibold">Status *</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="auth-input"
                required
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                type="submit" 
                disabled={submitting}
                className="auth-button py-2 fw-bold"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEdit ? 'Update Case' : 'Create Case'
                )}
              </Button>
            </div>
          </Form>
        );
    }
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
            <p className="text-muted">Loading case data...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
          <div className="ms-auto d-flex align-items-center">
            <Link to="/dashboard" className="btn btn-outline-secondary btn-sm me-2">
              Dashboard
            </Link>
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
            <button onClick={handleLogout} className="btn btn-outline-primary btn-sm">
              Logout
            </button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="text-center mb-4">
              <h3 className="fw-bold text-dark">
                {isEdit ? 'Edit Case' : newCaseId ? 'Add Case Details' : 'Add New Case'}
              </h3>
              <p className="text-muted">
                {isEdit ? 'Manage case details and related information' : 
                 newCaseId ? 'Add evidence, witnesses, and criminal records' : 
                 'Create a new case to track'}
              </p>
            </div>

            {error && (
              <Alert variant={error.includes('success') ? 'success' : 'danger'} className="text-center">
                {error}
              </Alert>
            )}

            <Card className="border-0 shadow-sm auth-card">
              <Card.Body className="p-4">
                {/* Custom Tab Navigation */}
                <div className="mb-4">
                  <div className="d-flex border-bottom">
                    <button
                      className={`btn btn-link text-decoration-none ${activeTab === 'case-details' ? 'fw-bold text-primary border-bottom border-primary' : 'text-muted'}`}
                      onClick={() => setActiveTab('case-details')}
                      style={{ 
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'case-details' ? '3px solid #007bff' : '3px solid transparent'
                      }}
                    >
                      Case Details
                    </button>
                    {(isEdit || newCaseId) && (
                      <>
                        <button
                          className={`btn btn-link text-decoration-none ${activeTab === 'evidence' ? 'fw-bold text-primary border-bottom border-primary' : 'text-muted'}`}
                          onClick={() => setActiveTab('evidence')}
                          style={{ 
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'evidence' ? '3px solid #007bff' : '3px solid transparent'
                          }}
                        >
                          Evidence
                        </button>
                        <button
                          className={`btn btn-link text-decoration-none ${activeTab === 'witnesses' ? 'fw-bold text-primary border-bottom border-primary' : 'text-muted'}`}
                          onClick={() => setActiveTab('witnesses')}
                          style={{ 
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'witnesses' ? '3px solid #007bff' : '3px solid transparent'
                          }}
                        >
                          Witnesses
                        </button>
                        <button
                          className={`btn btn-link text-decoration-none ${activeTab === 'criminal-records' ? 'fw-bold text-primary border-bottom border-primary' : 'text-muted'}`}
                          onClick={() => setActiveTab('criminal-records')}
                          style={{ 
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'criminal-records' ? '3px solid #007bff' : '3px solid transparent'
                          }}
                        >
                          Criminal Records
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Tab Content */}
                {renderTabContent()}

                {!isEdit && !newCaseId && activeTab === 'case-details' && (
                  <div className="text-center mt-3">
                    <p className="text-muted">
                      After creating the case, you can add evidence, witnesses, and criminal records.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}