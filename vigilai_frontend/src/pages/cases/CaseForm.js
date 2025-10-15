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

  // Function to format date to "MM/DD/YYYY HH:MM:SS AM/PM"
  const formatDateTime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? pad(hours) : '12'; // the hour '0' should be '12'
    
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  // Function to parse date string back to Date object for input
  const parseDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return new Date();
    
    try {
      // Parse "MM/DD/YYYY HH:MM:SS AM/PM" format
      const [datePart, timePart, ampm] = dateTimeString.split(' ');
      if (!datePart || !timePart || !ampm) return new Date();
      
      const [month, day, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');
      
      let hour = parseInt(hours);
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      
      const date = new Date(year, month - 1, day, hour, parseInt(minutes), parseInt(seconds));
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date();
    }
  };

  // Function to convert Date to datetime-local input format
  const dateToInputFormat = (date) => {
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    case_number: '',
    primary_type: '',
    description: '',
    date_time: formatDateTime(new Date()),
    location_description: '',
    status: 'Open',
    district: '',
    ward: ''
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
  const districtOptions = Array.from({ length: 14 }, (_, i) => (i + 1).toString());
  const wardOptions = Array.from({ length: 42 }, (_, i) => (i + 1).toString());

  // Fetch existing case data if in edit mode
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      fetchCase(id)
        .then(res => {
          const caseData = res.data;
          setFormData({
            case_number: caseData.case_number || '',
            primary_type: caseData.primary_type || '',
            description: caseData.description || '',
            date_time: caseData.date_time || formatDateTime(new Date()),
            location_description: caseData.location_description || '',
            status: caseData.status || 'Open',
            district: caseData.district || '',
            ward: caseData.ward || ''
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
    
    if (name === 'date_time') {
      // For datetime-local input, convert to desired format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setFormData(prev => ({ ...prev, [name]: formatDateTime(date) }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate district
    if (formData.district && (parseInt(formData.district) < 1 || parseInt(formData.district) > 14)) {
      setError('District must be between 1 and 14.');
      setSubmitting(false);
      return;
    }

    // Validate ward
    if (formData.ward && (parseInt(formData.ward) < 1 || parseInt(formData.ward) > 42)) {
      setError('Ward must be between 1 and 42.');
      setSubmitting(false);
      return;
    }

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
        setError(err.response?.data?.message || err.response?.data?.detail || 'Submission failed. Please try again.');
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
                <Form.Group controlId="caseNumber" className="mb-3">
                  <Form.Label className="fw-semibold">Case Number</Form.Label>
                  <Form.Control
                    name="case_number"
                    type="text"
                    placeholder="Case number will be auto-generated if left blank"
                    value={formData.case_number}
                    onChange={handleChange}
                    className="auth-input"
                  />
                  <Form.Text className="text-muted">
                    Leave blank to auto-generate a case number
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="caseDate" className="mb-3">
                  <Form.Label className="fw-semibold">Date and Time *</Form.Label>
                  <Form.Control
                    name="date_time"
                    type="datetime-local"
                    value={dateToInputFormat(parseDateTimeForInput(formData.date_time))}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                  <Form.Text className="text-muted">
                    Selected: {formData.date_time}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="primaryType" className="mb-3">
                  <Form.Label className="fw-semibold">Type of Crime *</Form.Label>
                  <Form.Select
                    name="primary_type"
                    value={formData.primary_type}
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
              <Col md={6}>
                <Form.Group controlId="caseStatus" className="mb-3">
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
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="district" className="mb-3">
                  <Form.Label className="fw-semibold">District (1-14) *</Form.Label>
                  <Form.Select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="auth-input"
                    required
                  >
                    <option value="">Select district</option>
                    {districtOptions.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    District must be between 1 and 14
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="ward" className="mb-3">
                  <Form.Label className="fw-semibold">Ward (1-42) *</Form.Label>
                  <Form.Select
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    className="auth-input"
                    required
                  >
                    <option value="">Select ward</option>
                    {wardOptions.map(ward => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Ward must be between 1 and 42
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="locationDescription" className="mb-3">
              <Form.Label className="fw-semibold">Location Description</Form.Label>
              <Form.Control
                name="location_description"
                type="text"
                placeholder="Enter crime location description"
                value={formData.location_description}
                onChange={handleChange}
                className="auth-input"
              />
            </Form.Group>

            <Form.Group controlId="caseDescription" className="mb-4">
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