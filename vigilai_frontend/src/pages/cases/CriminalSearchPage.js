import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Table, 
  Alert, 
  Spinner, 
  Card, 
  Image, 
  Row, 
  Col,
  Modal,
  Badge,
  InputGroup,
  Container,
  Navbar,
  Tabs,
  Tab,
  ListGroup
} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, logout } from './services/Authservice';
import NotificationService from './services/NotificationService';

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

// Function to format contact info (from dashboard.js)
const formatContactInfo = (contactInfo) => {
  if (!contactInfo) return 'N/A';
  
  if (contactInfo.includes('@')) {
    return (
      <div>
        <div>{contactInfo}</div>
        <small>
          <a href={`mailto:${contactInfo}`} className="text-decoration-none">
            📧 Send Email
          </a>
        </small>
      </div>
    );
  }
  
  const cleaned = contactInfo.replace(/\D/g, '');
  if (cleaned.length === 10) {
    const formattedPhone = cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return (
      <div>
        <div>+91 {formattedPhone}</div>
        <small>
          <a href={`tel:+91${cleaned}`} className="text-decoration-none">
            📞 Call
          </a>
        </small>
      </div>
    );
  }
  
  return contactInfo;
};

// Service functions for fetching data (similar to dashboard.js)
const fetchCaseEvidence = async (caseId) => {
  const token = getToken();
  
  // FIXED: Correct endpoints that match Django exactly
  const endpoints = [
    `/api/evidences/?case=${caseId}`,
    `/api/evidences/by_case/?case=${caseId}`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Evidence from ${endpoint}:`, data);
        
        // Handle different response structures
        if (Array.isArray(data)) {
          return { data };
        } else if (data.results && Array.isArray(data.results)) {
          return { data: data.results };
        } else if (data.evidence && Array.isArray(data.evidence)) {
          return { data: data.evidence };
        } else if (typeof data === 'object' && data !== null) {
          // Try to extract array from object
          const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            return { data: possibleArrays[0] };
          }
        }
      }
    } catch (err) {
      console.error(`Error trying endpoint ${endpoint}:`, err);
    }
  }
  
  return { data: [] };
};

const fetchCaseWitnesses = async (caseId) => {
  const token = getToken();
  
  const endpoints = [
    `/api/witnesses/?case=${caseId}`,
    `/api/cases/${caseId}/witnesses/`,
    `/api/witnesses/by_case/${caseId}/`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return { data };
        } else if (data.results && Array.isArray(data.results)) {
          return { data: data.results };
        } else if (data.witnesses && Array.isArray(data.witnesses)) {
          return { data: data.witnesses };
        }
      }
    } catch (err) {
      console.error(`Error trying endpoint ${endpoint}:`, err);
    }
  }
  
  return { data: [] };
};

const fetchCaseCriminalRecords = async (caseId) => {
  const token = getToken();
  
  const endpoints = [
    `/api/criminal-records/?case=${caseId}`,
    `/api/cases/${caseId}/criminal-records/`,
    `/api/criminal-records/by_case/${caseId}/`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return { data };
        } else if (data.results && Array.isArray(data.results)) {
          return { data: data.results };
        } else if (data.criminal_records && Array.isArray(data.criminal_records)) {
          return { data: data.criminal_records };
        }
      }
    } catch (err) {
      console.error(`Error trying endpoint ${endpoint}:`, err);
    }
  }
  
  return { data: [] };
};

export default function CriminalSearchPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCriminal, setSelectedCriminal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [criminalCases, setCriminalCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedCaseDetails, setSelectedCaseDetails] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseEvidence, setCaseEvidence] = useState([]);
  const [caseWitnesses, setCaseWitnesses] = useState([]);
  const [caseCriminalRecords, setCaseCriminalRecords] = useState([]);
  const [apiDebug, setApiDebug] = useState('');

  useEffect(() => {
    // Try to get profile photo from localStorage
    try {
      const storedProfilePhoto = localStorage.getItem('profile_photo');
      if (storedProfilePhoto) {
        setProfilePhoto(storedProfilePhoto);
      }
    } catch (err) {
      console.error('Error getting profile photo:', err);
    }

    loadUnreadCount();

    const notificationInterval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(notificationInterval);
    };
  }, []);

  // Load criminal cases when criminal is selected
  useEffect(() => {
    if (selectedCriminal && selectedCriminal.criminal_id) {
      loadCriminalCases(selectedCriminal.criminal_id);
    }
  }, [selectedCriminal]);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Format date time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN');
  };

  // Load unread notification count
  const loadUnreadCount = async () => {
    try {
      const previousCount = unreadCount;
      const countData = await NotificationService.getUnreadCount();
      const newCount = countData.unread_count || 0;
      
      setUnreadCount(newCount);
      
      // Show red circle if new notifications arrived
      if (newCount > previousCount) {
        setHasNewNotifications(true);
        
        // Auto-hide the red circle after 10 seconds
        setTimeout(() => {
          setHasNewNotifications(false);
        }, 10000);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  // Load criminal cases
  const loadCriminalCases = async (criminalId) => {
    setLoadingCases(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/criminals/${criminalId}/cases/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCriminalCases(data.criminal.case_records || []);
        } else {
          setCriminalCases([]);
        }
      } else {
        console.error('Error loading criminal cases:', response.status, response.statusText);
        setCriminalCases([]);
      }
    } catch (err) {
      console.error('Error loading criminal cases:', err);
      setCriminalCases([]);
    } finally {
      setLoadingCases(false);
    }
  };

  // FIXED: Enhanced evidence loading with proper service functions
  const loadCaseDetails = async (caseId) => {
    setCaseLoading(true);
    setCaseEvidence([]);
    setCaseWitnesses([]);
    setCaseCriminalRecords([]);
    
    try {
      const debugMessages = [`Loading case details for case ID: ${caseId}`];
      
      // Use Promise.all to load all data simultaneously like in dashboard
      const [evidenceRes, witnessesRes, recordsRes] = await Promise.all([
        fetchCaseEvidence(caseId),
        fetchCaseWitnesses(caseId),
        fetchCaseCriminalRecords(caseId)
      ]);

      setCaseEvidence(evidenceRes.data || []);
      setCaseWitnesses(witnessesRes.data || []);
      setCaseCriminalRecords(recordsRes.data || []);
      
      debugMessages.push('=== FINAL LOADED DATA ===');
      debugMessages.push(`Evidence: ${evidenceRes.data?.length || 0} items`);
      debugMessages.push(`Witnesses: ${witnessesRes.data?.length || 0} items`);
      debugMessages.push(`Criminal Records: ${recordsRes.data?.length || 0} items`);
      
      setApiDebug(debugMessages.join('\n'));
      
    } catch (err) {
      console.error('Error loading case details:', err);
      setError(`Failed to load case details: ${err.message}`);
    } finally {
      setCaseLoading(false);
    }
  };

  // Handle view case click
  const handleViewCase = async (caseRecord) => {
    console.log('Viewing case:', caseRecord);
    setSelectedCaseDetails(caseRecord.case_details);
    setShowCaseModal(true);
    await loadCaseDetails(caseRecord.case);
  };

  // Reset new notification indicator when user clicks notifications
  const handleNotificationsClick = () => {
    setHasNewNotifications(false);
    navigate('/notifications');
  };

  // Basic search by name, Aadhaar, or district
  const searchCriminals = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const token = getToken();
      const url = `/api/criminals/search/?q=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.results || data.criminals || [];
        
        // Map district IDs to names for display
        const processedResults = results.map(criminal => ({
          ...criminal,
          districtName: getDistrictName(criminal.criminal_district)
        }));
        
        setSearchResults(processedResults);
        if (processedResults.length === 0) {
          setError('No criminals found matching your search criteria.');
        }
      } else if (response.status === 404) {
        setSearchResults([]);
        setError('No criminals found matching your search criteria.');
      } else {
        throw new Error(`Search failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Error searching criminals:', err);
      setError('Failed to search criminals. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchCriminals();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  };

  const viewCriminalDetails = (criminal) => {
    setSelectedCriminal(criminal);
    setShowDetailModal(true);
    setActiveTab('details'); // Reset to details tab
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Function to get badge color based on involvement type
  const getInvolvementBadge = (type) => {
    switch(type) {
      case 'SUSPECT': return 'warning';
      case 'ACCUSED': return 'danger';
      case 'CONVICTED': return 'dark';
      case 'WANTED': return 'danger';
      default: return 'secondary';
    }
  };

  // Function to get badge color based on case status (from dashboard.js)
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

  // Function to get criminal display info (from dashboard.js) - FIXED
  const getCriminalDisplayInfo = (record) => {
    if (record.suspect_details) {
      return {
        criminal_name: record.suspect_details.criminal_name || 'Unknown',
        criminal_age: record.suspect_details.criminal_age, // This should now work with the fixed serializer
        criminal_gender: record.suspect_details.criminal_gender,
        criminal_district: record.suspect_details.criminal_district,
        photo: record.suspect_details.photo,
        aadhaar_number: record.suspect_details.aadhaar_number
      };
    }
    
    if (record.suspect && typeof record.suspect === 'object') {
      return {
        criminal_name: record.suspect.criminal_name || 'Unknown',
        criminal_age: record.suspect.criminal_age, // This should now work with the fixed serializer
        criminal_gender: record.suspect.criminal_gender,
        criminal_district: record.suspect.criminal_district,
        photo: record.suspect.photo,
        aadhaar_number: record.suspect.aadhaar_number
      };
    }
    
    if (record.criminal_name || record.person_name) {
      return {
        criminal_name: record.criminal_name || record.person_name,
        criminal_age: record.criminal_age || record.age,
        criminal_gender: record.criminal_gender || record.gender,
        criminal_district: record.criminal_district || record.district,
        photo: record.photo,
        aadhaar_number: record.aadhaar_number
      };
    }
    
    return {
      criminal_name: 'Unknown Criminal',
      criminal_age: null,
      criminal_gender: null,
      criminal_district: null,
      photo: null,
      aadhaar_number: null
    };
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI - Criminal Search</Navbar.Brand>
          <div className="ms-auto d-flex align-items-center">
            <Link to="/dashboard" className="btn btn-primary btn-sm me-2">
              Dashboard
            </Link>
            {/* Notification Icon */}
            <button 
              onClick={handleNotificationsClick}
              className="btn btn-outline-secondary btn-sm me-2 position-relative"
              title="Notifications"
              style={{ border: 'none', background: 'transparent' }}
            >
              <i className="bi bi-bell" style={{ fontSize: '1.2rem' }}></i>
              
              {/* Red circle with exclamation mark for new notifications */}
              {hasNewNotifications && (
                <div 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#dc3545',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <i 
                    className="bi bi-exclamation text-white" 
                    style={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                  ></i>
                </div>
              )}
              
              {/* Regular unread count badge */}
              {unreadCount > 0 && !hasNewNotifications && (
                <Badge 
                  bg="danger" 
                  pill 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.6rem' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </button>

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
          <Col lg={12}>
            <div className="text-center mb-4">
              <h3 className="fw-bold text-dark">Criminal Database Search</h3>
              <p className="text-muted">
                Search criminal records by name, Aadhaar number, or district
              </p>
            </div>

            {error && (
              <Alert variant={error.includes('No criminals found') ? 'info' : 'danger'} className="text-center">
                {error}
              </Alert>
            )}

            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <Form onSubmit={handleSearch}>
                  <Row className="justify-content-center">
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Search Criminals</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="text"
                            placeholder="Search by criminal name, Aadhaar number, or district..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            required
                          />
                          <Button variant="primary" type="submit" disabled={searching}>
                            {searching ? <Spinner animation="border" size="sm" /> : 'Search'}
                          </Button>
                          {(searchTerm || searchResults.length > 0) && (
                            <Button 
                              variant="outline-secondary" 
                              onClick={clearSearch}
                              title="Clear search"
                            >
                              <i className="bi bi-x-circle"></i>
                            </Button>
                          )}
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Enter at least 3 characters to search by name, exact 12-digit Aadhaar number, or district name
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">
                    Search Results ({searchResults.length} criminals found)
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead className="table-dark">
                        <tr>
                          <th>Photo</th>
                          <th>Name</th>
                          <th>Aadhaar</th>
                          <th>Date of Birth</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>District</th>
                          <th>Created Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map(criminal => (
                          <tr 
                            key={criminal.criminal_id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => viewCriminalDetails(criminal)}
                            className="table-row-hover"
                          >
                            <td>
                              {criminal.photo ? (
                                <Image 
                                  src={criminal.photo} 
                                  alt={criminal.criminal_name}
                                  fluid 
                                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                  className="rounded"
                                />
                              ) : (
                                <div className="text-center text-muted">
                                  <i className="bi bi-person" style={{ fontSize: '2rem' }}></i>
                                  <div className="small">No photo</div>
                                </div>
                              )}
                            </td>
                            <td>
                              <strong>{criminal.criminal_name}</strong>
                            </td>
                            <td>
                              {criminal.aadhaar_number ? (
                                <Badge className="font-monospace" bg="info">
                                  {criminal.aadhaar_number}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {criminal.date_of_birth ? (
                                <span>{formatDate(criminal.date_of_birth)}</span>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {criminal.date_of_birth ? (
                                <Badge bg="secondary">{calculateAge(criminal.date_of_birth)} years</Badge>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {criminal.criminal_gender && (
                                <Badge bg={
                                  criminal.criminal_gender === 'Male' ? 'primary' : 
                                  criminal.criminal_gender === 'Female' ? 'danger' : 'warning'
                                }>
                                  {criminal.criminal_gender}
                                </Badge>
                              )}
                            </td>
                            <td>
                              {criminal.districtName ? (
                                <Badge bg="primary">
                                  {criminal.districtName}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {criminal.created_at ? (
                                <small>
                                  {formatDate(criminal.created_at)}
                                </small>
                              ) : (
                                'N/A'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Enhanced Criminal Detail Modal with Tabs */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCriminal ? selectedCriminal.criminal_name : 'Criminal Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCriminal && (
            <>
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabSelect}
                className="mb-3"
              >
                <Tab eventKey="details" title="Personal Details">
                  <Row>
                    <Col md={4} className="text-center">
                      {selectedCriminal.photo ? (
                        <Image 
                          src={selectedCriminal.photo} 
                          alt={selectedCriminal.criminal_name}
                          fluid 
                          className="rounded border"
                          style={{ maxHeight: '200px' }}
                        />
                      ) : (
                        <div className="text-muted py-4">
                          <i className="bi bi-person" style={{ fontSize: '4rem' }}></i>
                          <div>No photo available</div>
                        </div>
                      )}
                    </Col>
                    <Col md={8}>
                      <h5 className="mb-3">{selectedCriminal.criminal_name}</h5>
                      <Row>
                        <Col md={6}>
                          <strong>Aadhaar Number:</strong>
                          <div className="mb-2">
                            {selectedCriminal.aadhaar_number ? (
                              <Badge bg="info" className="font-monospace">
                                {selectedCriminal.aadhaar_number}
                              </Badge>
                            ) : (
                              'Not provided'
                            )}
                          </div>
                        </Col>
                        <Col md={6}>
                          <strong>Date of Birth:</strong>
                          <div className="mb-2">
                            {selectedCriminal.date_of_birth ? (
                              <span>{formatDate(selectedCriminal.date_of_birth)}</span>
                            ) : (
                              'Not provided'
                            )}
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        {/* REMOVED: Age section from modal */}
                        <Col md={6}>
                          <strong>Gender:</strong>
                          <div className="mb-2">
                            {selectedCriminal.criminal_gender ? (
                              <Badge bg={
                                selectedCriminal.criminal_gender === 'Male' ? 'primary' : 
                                selectedCriminal.criminal_gender === 'Female' ? 'danger' : 'warning'
                              }>
                                {selectedCriminal.criminal_gender}
                              </Badge>
                            ) : (
                              'Not provided'
                            )}
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <strong>District:</strong>
                          <div className="mb-2">
                            {selectedCriminal.districtName || getDistrictName(selectedCriminal.criminal_district) ? (
                              <span className="badge bg-primary">
                                {selectedCriminal.districtName || getDistrictName(selectedCriminal.criminal_district)}
                              </span>
                            ) : (
                              'Not provided'
                            )}
                            {selectedCriminal.criminal_district && (
                              <div className="small text-muted mt-1">
                                District ID: {selectedCriminal.criminal_district}
                              </div>
                            )}
                          </div>
                        </Col>
                        <Col md={6}>
                          <strong>Created Date:</strong>
                          <div className="mb-2">
                            {selectedCriminal.created_at ? (
                              formatDate(selectedCriminal.created_at)
                            ) : (
                              'Unknown'
                            )}
                          </div>
                        </Col>
                      </Row>
                      {selectedCriminal.updated_at && (
                        <Row>
                          <Col md={12}>
                            <strong>Last Updated:</strong>
                            <div className="mb-2">
                              {formatDate(selectedCriminal.updated_at)}
                            </div>
                          </Col>
                        </Row>
                      )}
                    </Col>
                  </Row>
                </Tab>
                
                <Tab eventKey="cases" title="Case History">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Cases Involving This Criminal</h6>
                    <Badge bg="primary">
                      {criminalCases.length} {criminalCases.length === 1 ? 'Case' : 'Cases'}
                    </Badge>
                  </div>
                  
                  {loadingCases ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">Loading case history...</p>
                    </div>
                  ) : criminalCases.length > 0 ? (
                    <div className="criminal-cases-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <ListGroup>
                        {criminalCases.map((caseRecord, index) => (
                          <ListGroup.Item key={caseRecord.record_id || index} className="mb-2 border">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">
                                  Case #{caseRecord.case_details?.case_number || 'N/A'}
                                  {caseRecord.case_details?.status && (
                                    <span className="ms-2">
                                      {getStatusBadge(caseRecord.case_details.status)}
                                    </span>
                                  )}
                                </h6>
                                <p className="mb-1">
                                  <strong>Crime Type:</strong> {caseRecord.case_details?.primary_type || 'N/A'}
                                </p>
                                <p className="mb-1">
                                  <strong>Location:</strong> {caseRecord.case_details?.location || 'N/A'}
                                </p>
                                <p className="mb-1">
                                  <strong>Date:</strong> {caseRecord.case_details?.date_time ? 
                                    formatDateTime(caseRecord.case_details.date_time) : 'N/A'}
                                </p>
                                <p className="mb-1">
                                  <strong>Involvement:</strong>{' '}
                                  <Badge bg={getInvolvementBadge(caseRecord.involvement_type)}>
                                    {caseRecord.involvement_type || 'Unknown'}
                                  </Badge>
                                </p>
                                <p className="mb-0">
                                  <strong>Offenses:</strong> {caseRecord.offenses || 'No specific offenses listed'}
                                </p>
                              </div>
                              <div className="text-end">
                                <small className="text-muted">
                                  Added: {formatDate(caseRecord.created_at)}
                                </small>
                                <br />
                                <div className="mt-2">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => handleViewCase(caseRecord)}
                                  >
                                    View Case
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  ) : (
                    <Alert variant="info" className="text-center">
                      <i className="bi bi-shield-check" style={{ fontSize: '2rem' }}></i>
                      <h6 className="mt-2">No Case Records</h6>
                      <p className="mb-0">
                        This criminal has no recorded cases in the system.
                      </p>
                    </Alert>
                  )}
                </Tab>
              </Tabs>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Case Details Modal */}
      <Modal show={showCaseModal} onHide={() => setShowCaseModal(false)} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            Case Details - {selectedCaseDetails?.case_number ? `#${selectedCaseDetails.case_number}` : 'Case Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCaseDetails && (
            <div>
              {caseLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading case details...</p>
                </div>
              ) : (
                <>
                  {/* Case Information */}
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Case Information</h5>
                      <Row>
                        <Col md={6}>
                          <p><strong>Case Number:</strong> {selectedCaseDetails.case_number ? `#${selectedCaseDetails.case_number}` : 'N/A'}</p>
                          <p><strong>Crime Type:</strong> {selectedCaseDetails.primary_type || 'N/A'}</p>
                          <p><strong>Status:</strong> {getStatusBadge(selectedCaseDetails.status)}</p>
                          <p><strong>Location:</strong> {selectedCaseDetails.location || 'N/A'}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>District:</strong> {getDistrictName(selectedCaseDetails.district)}</p>
                          <p><strong>Date & Time:</strong> {selectedCaseDetails.date_time ? formatDateTime(selectedCaseDetails.date_time) : 'N/A'}</p>
                          <p><strong>Investigator:</strong> {selectedCaseDetails.investigator || 'Not assigned'}</p>
                          {selectedCaseDetails.description && (
                            <div className="mt-2">
                              <strong>Description:</strong>
                              <p className="mt-1 small">{selectedCaseDetails.description}</p>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Evidence Section - FIXED */}
                  <h6 className="fw-bold mb-3">
                    Evidence 
                    {caseEvidence.length > 0 && (
                      <Badge bg="info" className="ms-2">
                        {caseEvidence.length} item(s)
                      </Badge>
                    )}
                  </h6>
                  {caseEvidence.length > 0 ? (
                    <Table striped bordered responsive size="sm" className="mb-4">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Type of Evidence</th>
                          <th>Details</th>
                          <th>File</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseEvidence.map((evidence, index) => (
                          <tr key={evidence.id || evidence.evidence_id || index}>
                            <td>{index + 1}</td>
                            <td>{evidence.type_of_evidence || evidence.evidence_type || 'Unknown'}</td>
                            <td>{evidence.details || evidence.description || 'No details provided'}</td>
                            <td>
                              {evidence.file || evidence.file_url ? (
                                <a 
                                  href={evidence.file || evidence.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <i className="bi bi-file-earmark me-1"></i>View File
                                </a>
                              ) : (
                                <span className="text-muted">No file</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="light" className="mb-4">
                      <div className="text-center text-muted">
                        <i className="bi bi-clipboard-x" style={{ fontSize: '2rem' }}></i>
                        <p className="mt-2 mb-0">No evidence recorded for this case.</p>
                      </div>
                    </Alert>
                  )}

                  {/* Witnesses Section */}
                  <h6 className="fw-bold mb-3">
                    Witnesses
                    {caseWitnesses.length > 0 && (
                      <Badge bg="info" className="ms-2">
                        {caseWitnesses.length} witness(es)
                      </Badge>
                    )}
                  </h6>
                  {caseWitnesses.length > 0 ? (
                    <Table striped bordered responsive size="sm" className="mb-4">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Aadhaar Number</th>
                          <th>Contact Information</th>
                          <th>Statement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseWitnesses.map((witness, index) => (
                          <tr key={witness.id || witness.witness_id || index}>
                            <td>
                              <strong>{witness.name || 'Unknown Witness'}</strong>
                            </td>
                            <td>
                              {witness.aadhaar_number ? (
                                <span className="font-monospace">{witness.aadhaar_number}</span>
                              ) : (
                                <span className="text-muted">Not provided</span>
                              )}
                            </td>
                            <td>
                              {witness.contact_info ? (
                                formatContactInfo(witness.contact_info)
                              ) : (
                                <span className="text-muted">Not provided</span>
                              )}
                            </td>
                            <td>
                              <div style={{ maxWidth: '200px' }}>
                                {witness.statement && witness.statement.length > 100 ? (
                                  <>
                                    {witness.statement.substring(0, 100)}...
                                    <br />
                                    <small>
                                      <button 
                                        className="btn btn-link p-0 text-decoration-none"
                                        onClick={() => alert(witness.statement)}
                                      >
                                        View full statement
                                      </button>
                                    </small>
                                  </>
                                ) : (
                                  witness.statement || 'No statement provided'
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="light" className="mb-4">
                      <div className="text-center text-muted">
                        <i className="bi bi-person-x" style={{ fontSize: '2rem' }}></i>
                        <p className="mt-2 mb-0">No witnesses recorded for this case.</p>
                      </div>
                    </Alert>
                  )}

                  {/* Criminal Records Section - FIXED AGE COLUMN */}
                  <h6 className="fw-bold mb-3">
                    Criminal Records
                    {caseCriminalRecords.length > 0 && (
                      <Badge bg="info" className="ms-2">
                        {caseCriminalRecords.length} record(s)
                      </Badge>
                    )}
                  </h6>
                  {caseCriminalRecords.length > 0 ? (
                    <Table striped bordered responsive size="sm" className="mb-4">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Aadhaar</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>District</th>
                          <th>Offenses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseCriminalRecords.map((record, index) => {
                          const criminalInfo = getCriminalDisplayInfo(record);
                          
                          return (
                            <tr key={record.record_id || record.id || index}>
                              <td>
                                <strong>{criminalInfo.criminal_name}</strong>
                              </td>
                              <td>
                                {criminalInfo.aadhaar_number ? (
                                  <span className="font-monospace">{criminalInfo.aadhaar_number}</span>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </td>
                              <td>
                                {/* FIXED: Display age properly */}
                                {criminalInfo.criminal_age ? (
                                  <Badge bg="secondary">{criminalInfo.criminal_age} years</Badge>
                                ) : criminalInfo.date_of_birth ? (
                                  <Badge bg="secondary">{calculateAge(criminalInfo.date_of_birth)} years</Badge>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td>
                                {criminalInfo.criminal_gender ? (
                                  <Badge bg={
                                    criminalInfo.criminal_gender === 'Male' ? 'primary' : 
                                    criminalInfo.criminal_gender === 'Female' ? 'danger' : 'warning'
                                  }>
                                    {criminalInfo.criminal_gender}
                                  </Badge>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td>
                                {criminalInfo.criminal_district ? getDistrictName(criminalInfo.criminal_district) : 'N/A'}
                              </td>
                              <td>
                                <div style={{ maxWidth: '200px' }}>
                                  {record.offenses && record.offenses.length > 50 ? (
                                    <>
                                      {record.offenses.substring(0, 50)}...
                                      <br />
                                      <small>
                                        <button 
                                          className="btn btn-link p-0 text-decoration-none"
                                          onClick={() => alert(record.offenses)}
                                        >
                                          View full offenses
                                        </button>
                                      </small>
                                    </>
                                  ) : (
                                    record.offenses || 'No offenses description'
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="light" className="mb-4">
                      <div className="text-center text-muted">
                        <i className="bi bi-shield-x" style={{ fontSize: '2rem' }}></i>
                        <p className="mt-2 mb-0">No criminal records recorded for this case.</p>
                      </div>
                    </Alert>
                  )}
                  
                  {/* Debug Info (Optional - remove in production) */}
                  {apiDebug && process.env.NODE_ENV === 'development' && (
                    <div className="mt-4">
                      <details>
                        <summary className="small text-muted">Debug Info</summary>
                        <pre className="mt-1 small bg-light p-2 rounded" style={{ fontSize: '10px', maxHeight: '100px', overflowY: 'auto' }}>
                          {apiDebug}
                        </pre>
                      </details>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCaseModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .table-row-hover:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .criminal-cases-list {
          scrollbar-width: thin;
          scrollbar-color: #adb5bd #f8f9fa;
        }
        
        .criminal-cases-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .criminal-cases-list::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .criminal-cases-list::-webkit-scrollbar-thumb {
          background-color: #adb5bd;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}