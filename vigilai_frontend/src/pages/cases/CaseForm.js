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

  // Function to format date for display (MM/DD/YYYY HH:MM:SS AM/PM)
  const formatDateTimeForDisplay = (date) => {
    try {
      const pad = (n) => n.toString().padStart(2, '0');
      
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? pad(hours) : '12';
      
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Function to convert Date to datetime-local input format (YYYY-MM-DDTHH:MM)
  const dateToInputFormat = (date) => {
    try {
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error converting date to input format:', error);
      return new Date().toISOString().slice(0, 16);
    }
  };

  const [formData, setFormData] = useState({
    case_number: '',
    primary_type: '',
    description: '',
    date_time: dateToInputFormat(new Date()),
    location_description: '',
    status: 'Open', // ✅ CHANGED: Use 'status' instead of 'case_status'
    arrest_status: 'Not Arrested', // ✅ This is the correct field name for backend
    district: '',
    ward: '',
    local_governance: 'Panchayat',
    governance_name: ''
  });
  const [displayDateTime, setDisplayDateTime] = useState(formatDateTimeForDisplay(new Date()));
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('case-details');
  const [newCaseId, setNewCaseId] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const caseStatusOptions = ['Open', 'In Progress', 'Pending', 'Closed', 'Reopened'];
  const arrestStatusOptions = ['Not Arrested', 'Arrested'];
  const localGovernanceOptions = ['Panchayat', 'Municipal Corporation'];
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
    const initializeForm = async () => {
      if (isEdit) {
        setLoading(true);
        try {
          const res = await fetchCase(id);
          const caseData = res.data;
          
          let dateTimeValue = dateToInputFormat(new Date());
          
          // Handle date_time from API
          if (caseData.date_time) {
            try {
              // If it's in display format, parse it back to Date object
              if (caseData.date_time.includes('/')) {
                const [datePart, timePart, ampm] = caseData.date_time.split(' ');
                if (datePart && timePart && ampm) {
                  const [month, day, year] = datePart.split('/');
                  const [hours, minutes, seconds] = timePart.split(':');
                  
                  let hour = parseInt(hours);
                  if (ampm === 'PM' && hour < 12) hour += 12;
                  if (ampm === 'AM' && hour === 12) hour = 0;
                  
                  const date = new Date(year, month - 1, day, hour, parseInt(minutes), parseInt(seconds));
                  dateTimeValue = dateToInputFormat(date);
                }
              } else {
                // Try to parse as ISO string or other format
                const parsedDate = new Date(caseData.date_time);
                if (!isNaN(parsedDate.getTime())) {
                  dateTimeValue = dateToInputFormat(parsedDate);
                }
              }
            } catch (parseError) {
              console.error('Error parsing date:', parseError);
            }
          }

          // ✅ CORRECTED: Use the actual field names from backend
          setFormData({
            case_number: caseData.case_number || '',
            primary_type: caseData.primary_type || '',
            description: caseData.description || '',
            date_time: dateTimeValue,
            location_description: caseData.location_description || '',
            status: caseData.status || 'Open', // ✅ Use 'status' directly
            arrest_status: caseData.arrest_status || 'Not Arrested', // ✅ Use 'arrest_status' directly
            district: caseData.district || '',
            ward: caseData.ward || '',
            local_governance: caseData.local_governance || 'Panchayat',
            governance_name: caseData.governance_name || ''
          });
          
          // Set display date time
          const inputDate = new Date(dateTimeValue);
          setDisplayDateTime(formatDateTimeForDisplay(inputDate));
        } catch (err) {
          console.error('Error fetching case:', err);
          setError('Failed to load case data.');
        } finally {
          setLoading(false);
        }
      }

      // Try to get profile photo from localStorage
      try {
        const storedProfilePhoto = localStorage.getItem('profile_photo');
        if (storedProfilePhoto) {
          setProfilePhoto(storedProfilePhoto);
        }
      } catch (err) {
        console.error('Error getting profile photo:', err);
      }
    };

    initializeForm();
  }, [id, isEdit]);

  // Redirect to dashboard when new case is created
  useEffect(() => {
    if (newCaseId && !isEdit) {
      // Show success message and redirect to dashboard after a short delay
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1500); // 1.5 second delay to show success message
      
      return () => clearTimeout(timer);
    }
  }, [newCaseId, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date_time') {
      // Update both the form data and display format
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Update the display format
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setDisplayDateTime(formatDateTimeForDisplay(date));
        }
      } catch (error) {
        console.error('Error updating display date:', error);
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

    // ✅ CORRECTED: Prepare data for submission with proper field names
    const submissionData = {
      case_number: formData.case_number,
      primary_type: formData.primary_type,
      description: formData.description,
      date_time: new Date(formData.date_time).toISOString(),
      location_description: formData.location_description,
      status: formData.status, // ✅ Use 'status' directly
      arrest_status: formData.arrest_status, // ✅ Use 'arrest_status' directly
      district: parseInt(formData.district),
      ward: parseInt(formData.ward),
      local_governance: formData.local_governance,
      governance_name: formData.governance_name
    };

    console.log('Submitting data:', submissionData); // Debug log

    const request = isEdit 
      ? updateCase(id, submissionData) 
      : createCase(submissionData);

    request
      .then((response) => {
        if (!isEdit) {
          // ✅ UPDATED: Use case_id instead of id with fallback
          const createdCaseId = response.data.case_id || response.data.id;
          setNewCaseId(createdCaseId);
          setError('Case created successfully! You can now add evidence, witnesses, and criminal records.');
          
          // Update form data with the created case ID for navigation
          setFormData(prev => ({ ...prev }));
        } else {
          setError('Case updated successfully!');
          setTimeout(() => setError(null), 3000);
        }
      })
      .catch(err => {
        console.error('Submission error:', err);
        console.error('Error details:', err.response?.data);
        setError(err.response?.data?.message || err.response?.data?.detail || 'Submission failed. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ FIXED: Conditional rendering for child components
  const renderTabContent = () => {
    const currentCaseId = isEdit ? id : newCaseId;

    switch (activeTab) {
      case 'evidence':
        if (!currentCaseId || currentCaseId === "undefined") {
          return (
            <div className="text-center py-4">
              <i className="bi bi-folder-plus text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="mt-3 text-muted">Create the case first to add evidence</h6>
              <p className="text-muted small">
                Please save the case details before adding evidence.
              </p>
            </div>
          );
        }
        return <EvidenceForm caseId={currentCaseId} />;

      case 'witnesses':
        if (!currentCaseId || currentCaseId === "undefined") {
          return (
            <div className="text-center py-4">
              <i className="bi bi-person-plus text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="mt-3 text-muted">Create the case first to add witnesses</h6>
              <p className="text-muted small">
                Please save the case details before adding witnesses.
              </p>
            </div>
          );
        }
        return <WitnessForm caseId={currentCaseId} />;

      case 'criminal-records':
        if (!currentCaseId || currentCaseId === "undefined") {
          return (
            <div className="text-center py-4">
              <i className="bi bi-file-earmark-person text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="mt-3 text-muted">Create the case first to add criminal records</h6>
              <p className="text-muted small">
                Please save the case details before adding criminal records.
              </p>
            </div>
          );
        }
        
        // Check if case is arrested
        if (formData.arrest_status !== 'Arrested') {
          return (
            <div className="text-center py-4">
              <i className="bi bi-shield-lock text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="mt-3 text-muted">Arrest Status must be marked as 'Arrested' to add criminal records</h6>
              <p className="text-muted small">
                Please update the Arrest Status to 'Arrested' in the Case Details tab to enable criminal record management.
              </p>
              <Button 
                variant="primary" 
                onClick={() => setActiveTab('case-details')}
                className="mt-2"
              >
                Go to Case Details
              </Button>
            </div>
          );
        }
        
        return <CriminalRecordForm caseId={currentCaseId} />;

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
                    value={formData.date_time}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                  <Form.Text className="text-muted">
                    Selected: {displayDateTime}
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
                  <Form.Label className="fw-semibold">Case Status *</Form.Label>
                  <Form.Select
                    name="status" // ✅ CHANGED: Use 'status' instead of 'case_status'
                    value={formData.status}
                    onChange={handleChange}
                    className="auth-input"
                    required
                  >
                    {caseStatusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="arrestStatus" className="mb-3">
                  <Form.Label className="fw-semibold">Arrest Status *</Form.Label>
                  <Form.Select
                    name="arrest_status" // ✅ This is the correct field name
                    value={formData.arrest_status}
                    onChange={handleChange}
                    className="auth-input"
                    required
                  >
                    {arrestStatusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                  {formData.arrest_status === 'Arrested' && (
                    <Form.Text className="text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      Case marked as arrested. Criminal records tab is now available.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
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
            </Row>

            <Row>
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
              <Col md={6}>
                <Form.Group controlId="localGovernance" className="mb-3">
                  <Form.Label className="fw-semibold">Local Governance *</Form.Label>
                  <Form.Select
                    name="local_governance"
                    value={formData.local_governance}
                    onChange={handleChange}
                    className="auth-input"
                    required
                  >
                    {localGovernanceOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select the type of local governance
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group controlId="governanceName" className="mb-3">
                  <Form.Label className="fw-semibold">
                    {formData.local_governance === 'Panchayat' ? 'Panchayat Name' : 'Municipal Corporation Name'}
                  </Form.Label>
                  <Form.Control
                    name="governance_name"
                    type="text"
                    placeholder={`Enter name of the ${formData.local_governance}`}
                    value={formData.governance_name}
                    onChange={handleChange}
                    className="auth-input"
                  />
                  <Form.Text className="text-muted">
                    Name of the {formData.local_governance}
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

  // ✅ FIXED: Disable tabs that require a valid caseId
  const isTabDisabled = (tabName) => {
    if (tabName === 'case-details') return false;
    
    // Criminal records tab is only available when case is arrested
    if (tabName === 'criminal-records') {
      return !isEdit && !newCaseId || (formData.arrest_status !== 'Arrested');
    }
    
    // Other tabs (evidence, witnesses) just need a valid case ID
    return !isEdit && !newCaseId;
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
            <Link to="/dashboard" className="btn btn-primary btn-sm me-2">
              Dashboard
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
              <Alert variant={error.includes('successfully') ? 'success' : 'danger'} className="text-center">
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
                    <button
                      className={`btn btn-link text-decoration-none ${activeTab === 'evidence' ? 'fw-bold text-primary border-bottom border-primary' : 'text-muted'} ${isTabDisabled('evidence') ? 'opacity-50' : ''}`}
                      onClick={() => !isTabDisabled('evidence') && setActiveTab('evidence')}
                      disabled={isTabDisabled('evidence')}
                      style={{ 
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'evidence' ? '3px solid #007bff' : '3px solid transparent',
                        cursor: isTabDisabled('evidence') ? 'not-allowed' : 'pointer'
                      }}
                      title={isTabDisabled('evidence') ? 'Create the case first to add evidence' : ''}
                    >
                      Evidence {isTabDisabled('evidence') && <i className="bi bi-lock ms-1"></i>}
                    </button>
                    <button
                      className={`btn btn-link text-decoration-none ${activeTab === 'witnesses' ? 'fw-bold text-primary border-bottom border-primary' : 'text-muted'} ${isTabDisabled('witnesses') ? 'opacity-50' : ''}`}
                      onClick={() => !isTabDisabled('witnesses') && setActiveTab('witnesses')}
                      disabled={isTabDisabled('witnesses')}
                      style={{ 
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'witnesses' ? '3px solid #007bff' : '3px solid transparent',
                        cursor: isTabDisabled('witnesses') ? 'not-allowed' : 'pointer'
                      }}
                      title={isTabDisabled('witnesses') ? 'Create the case first to add witnesses' : ''}
                    >
                      Witnesses {isTabDisabled('witnesses') && <i className="bi bi-lock ms-1"></i>}
                    </button>
                    <button
                      className={`btn btn-link text-decoration-none ${activeTab === 'criminal-records' ? 'fw-bold text-primary border-bottom border-primary' : 'text-muted'} ${isTabDisabled('criminal-records') ? 'opacity-50' : ''}`}
                      onClick={() => !isTabDisabled('criminal-records') && setActiveTab('criminal-records')}
                      disabled={isTabDisabled('criminal-records')}
                      style={{ 
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'criminal-records' ? '3px solid #007bff' : '3px solid transparent',
                        cursor: isTabDisabled('criminal-records') ? 'not-allowed' : 'pointer'
                      }}
                      title={isTabDisabled('criminal-records') ? 'Arrest Status must be marked as Arrested to add criminal records' : ''}
                    >
                      Criminal Records {isTabDisabled('criminal-records') && <i className="bi bi-lock ms-1"></i>}
                    </button>
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