import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Card, Row, Col, Navbar, Button, Badge, Accordion, Image, Form, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { 
  fetchCases, 
  deleteCase, 
  fetchEvidence, 
  fetchWitnesses, 
  fetchCriminalRecords 
} from './CaseService';
import { logout, getToken, isAdmin } from './services/Authservice';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [caseDetails, setCaseDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [predicting, setPredicting] = useState({}); // Track predicting state per case
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    crimeType: '',
    district: '',
    dateFrom: '',
    dateTo: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Check user role
    setUserIsAdmin(isAdmin());

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

  useEffect(() => {
    // Filter cases based on search term and filters
    let filtered = cases;

    // Apply search term filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(caseItem => 
        caseItem.case_number?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.id?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(caseItem => caseItem.status === filters.status);
    }

    // Apply crime type filter
    if (filters.crimeType) {
      filtered = filtered.filter(caseItem => 
        caseItem.primary_type?.toLowerCase().includes(filters.crimeType.toLowerCase())
      );
    }

    // Apply district filter
    if (filters.district) {
      filtered = filtered.filter(caseItem => 
        caseItem.district?.toString() === filters.district
      );
    }

    // Apply date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(caseItem => {
        const caseDate = new Date(caseItem.date_time || caseItem.date || caseItem.created_at);
        return caseDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of the day
      filtered = filtered.filter(caseItem => {
        const caseDate = new Date(caseItem.date_time || caseItem.date || caseItem.created_at);
        return caseDate <= toDate;
      });
    }

    setFilteredCases(filtered);
  }, [searchTerm, filters, cases]);

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
      const token = getToken();
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
        // Handle different response formats
        const casesData = Array.isArray(response.data) ? response.data : 
                         (response.data.results || response.data.cases || []);
        
        // ✅ FIX: Map case_id to id for compatibility
        const formattedCases = casesData.map(caseItem => ({
          ...caseItem,
          id: caseItem.case_id || caseItem.id // Use case_id as id for compatibility
        }));
        
        setCases(formattedCases);
        setFilteredCases(formattedCases); // Initialize filtered cases
        setLoading(false);
      })
      .catch(err => { 
        console.error('Error loading cases:', err);
        if (err.response && err.response.status === 401) {
          // Token is invalid, redirect to login
          logout();
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
          evidence: Array.isArray(evidenceRes.data) ? evidenceRes.data : 
                   (evidenceRes.data.results || evidenceRes.data.evidence || []),
          witnesses: Array.isArray(witnessesRes.data) ? witnessesRes.data : 
                    (witnessesRes.data.results || witnessesRes.data.witnesses || []),
          criminalRecords: Array.isArray(recordsRes.data) ? recordsRes.data : 
                         (recordsRes.data.results || recordsRes.data.criminal_records || [])
        }
      }));
    } catch (err) {
      console.error('Error loading case details:', err);
      setError('Failed to load case details.');
    }
  };

  // NEW: Extract criminal details from record with multiple data structure support
  const getCriminalDisplayInfo = (record) => {
    console.log('🔍 Processing criminal record:', record); // Debug log
    
    // Case 1: Record has suspect_details (from new serializer)
    if (record.suspect_details) {
      return {
        criminal_name: record.suspect_details.criminal_name || 'Unknown',
        criminal_age: record.suspect_details.criminal_age,
        criminal_gender: record.suspect_details.criminal_gender,
        criminal_district: record.suspect_details.criminal_district,
        photo: record.suspect_details.photo,
        aadhaar_number: record.suspect_details.aadhaar_number
      };
    }
    
    // Case 2: Record has suspect object (from old serializer or nested data)
    if (record.suspect && typeof record.suspect === 'object') {
      return {
        criminal_name: record.suspect.criminal_name || 'Unknown',
        criminal_age: record.suspect.criminal_age,
        criminal_gender: record.suspect.criminal_gender,
        criminal_district: record.suspect.criminal_district,
        photo: record.suspect.photo,
        aadhaar_number: record.suspect.aadhaar_number
      };
    }
    
    // Case 3: Record has direct criminal fields (legacy data)
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
    
    // Case 4: Fallback - no criminal data found
    return {
      criminal_name: 'Unknown Criminal',
      criminal_age: null,
      criminal_gender: null,
      criminal_district: null,
      photo: null,
      aadhaar_number: null
    };
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      crimeType: '',
      district: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };

  const getUniqueValues = (key) => {
    const values = cases.map(caseItem => caseItem[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const isFilterActive = () => {
    return Object.values(filters).some(value => value !== '') || searchTerm !== '';
  };

  const handlePredict = async (caseItem) => {
    setPredicting(prev => ({ ...prev, [caseItem.id]: true }));
    setError(null);
    
    try {
      const token = getToken();
      
      // Parse date and time from case data
      const caseDateTime = caseItem.date_time || caseItem.date || new Date().toISOString();
      const dateObj = new Date(caseDateTime);
      
      // Prepare prediction data that matches your backend's prepare_case_data function
      const predictionData = {
        // These fields will be transformed by prepare_case_data
        "crime_type": caseItem.primary_type || caseItem.type_of_crime || "THEFT",
        "description": caseItem.description || "GENERAL THEFT",
        "location": caseItem.location_description || caseItem.location || "STREET",
        "district": parseInt(caseItem.district) || 5,
        "ward": parseInt(caseItem.ward) || 10,
        "same_district": 1, // Default to 1
        "suspect_age": 30, // Default age
        
        // These fields are used by prepare_case_data for datetime parsing
        "datetime": caseDateTime,
        
        // Additional context fields
        "suspect_name": "Unknown",
        "previous_offenses": "No prior offenses"
      };

      console.log('Sending prediction data to backend:', predictionData);

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

      const predictionResult = await response.json();
      console.log('Prediction result:', predictionResult);
      
      // Navigate to prediction results page with the data
      navigate('/prediction-results', { 
        state: { 
          prediction: predictionResult,
          caseData: caseItem
        }
      });
      
    } catch (err) {
      console.error('Prediction error:', err);
      setError(`Failed to generate prediction: ${err.message}`);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setPredicting(prev => ({ ...prev, [caseItem.id]: false }));
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

  const handleCaseClick = (caseId, e) => {
    // Prevent click event if the click was on action buttons
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    
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
    logout();
    navigate('/login');
  };

  const handleAdminDashboard = () => {
    if (userIsAdmin) {
      navigate('/admin-dashboard');
    }
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

  const formatContactInfo = (contactInfo) => {
    if (!contactInfo) return 'N/A';
    
    // Check if it's an email
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
    
    // Format phone number for display
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

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm fixed-top">
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
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh', paddingTop: '80px' }}>
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
            {userIsAdmin && (
              <Button 
                variant="outline-warning" 
                size="sm" 
                className="me-2"
                onClick={handleAdminDashboard}
              >
                <i className="bi bi-shield-check me-1"></i>Admin Dashboard
              </Button>
            )}
            
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
            {/* 🔍 Criminal Search Button */}
            <Link to="/criminal-search" className="btn btn-primary btn-sm me-2">
              <i className="bi bi-search me-1"></i>Criminal Search
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

      <Container className="py-5 fixed-navbar-padding" style={{ paddingTop: '140px' }}>
        {error && (
          <Alert variant="danger" className="text-center">
            {error}
            <div className="mt-2">
              <Button variant="outline-danger" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </Alert>
        )}

        <Row className="justify-content-center mb-4">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="fw-bold text-dark mb-0">Cases Dashboard</h2>
                {userIsAdmin && (
                  <Badge bg="warning" className="ms-2">Administrator</Badge>
                )}
              </div>
              <span className="badge bg-primary">{filteredCases.length} {isFilterActive() ? 'filtered' : 'total'} cases</span>
            </div>
            <p className="text-muted">Manage and track all your cases in one place</p>

            {/* Search and Filters */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                {/* Search Bar */}
                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by case number or ID..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    {(searchTerm || isFilterActive()) && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={clearFilters}
                        title="Clear all filters"
                      >
                        <i className="bi bi-x-circle"></i> Clear All
                      </Button>
                    )}
                  </InputGroup>
                  <Form.Text className="text-muted">
                    {isFilterActive() && `Found ${filteredCases.length} case(s) matching your criteria`}
                  </Form.Text>
                </Form.Group>

                {/* Filters Row */}
                <Row className="g-3">
                  {/* Status Filter */}
                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Status</Form.Label>
                      <Form.Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {getUniqueValues('status').map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Crime Type Filter */}
                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Crime Type</Form.Label>
                      <Form.Select
                        value={filters.crimeType}
                        onChange={(e) => handleFilterChange('crimeType', e.target.value)}
                      >
                        <option value="">All Crime Types</option>
                        {getUniqueValues('primary_type').map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* District Filter */}
                  <Col md={6} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">District</Form.Label>
                      <Form.Select
                        value={filters.district}
                        onChange={(e) => handleFilterChange('district', e.target.value)}
                      >
                        <option value="">All Districts</option>
                        {getUniqueValues('district').map(district => (
                          <option key={district} value={district}>District {district}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Date From Filter */}
                  <Col md={6} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  {/* Date To Filter */}
                  <Col md={6} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={10}>
            {filteredCases.length > 0 ? (
              <Accordion activeKey={expandedCase}>
                {filteredCases.map(c => (
                  <Card 
                    key={c.id} 
                    className="border-0 shadow-sm auth-card mb-3"
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body 
                      className="p-4"
                      onClick={(e) => handleCaseClick(c.id, e)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h5 className="fw-bold">
                            {c.case_number ? `#${c.case_number}` : `Case #${c.id}`} - {c.primary_type || c.title || 'Untitled Case'}
                            {expandedCase === c.id ? (
                              <i className="bi bi-chevron-up text-muted ms-2" title="Click to collapse"></i>
                            ) : (
                              <i className="bi bi-chevron-down text-muted ms-2" title="Click to expand"></i>
                            )}
                          </h5>
                          <p className="text-muted mb-2">{c.description}</p>
                          <div className="d-flex gap-2 mb-2 flex-wrap">
                            {getStatusBadge(c.status)}
                            <Badge bg="light" text="dark">
                              {c.date_time ? new Date(c.date_time).toLocaleDateString() : 
                               c.date ? new Date(c.date).toLocaleDateString() : 'No date'}
                            </Badge>
                            <Badge bg="light" text="dark">
                              {c.location_description || c.location || 'No location'}
                            </Badge>
                            {c.district && (
                              <Badge bg="light" text="dark">
                                District {c.district}
                              </Badge>
                            )}
                            {c.ward && (
                              <Badge bg="light" text="dark">
                                Ward {c.ward}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div 
                          className="d-flex gap-2 flex-wrap ms-3"
                          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking buttons
                        >
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handlePredict(c)}
                            disabled={predicting[c.id]}
                          >
                            {predicting[c.id] ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-1" />
                                Predicting...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-robot me-1"></i>
                                Predict Suspects
                              </>
                            )}
                          </Button>
                          
                          {/* ✏️ Edit Button with Pencil Icon */}
                          <Link 
                            to={`/cases/edit/${c.id}`} 
                            className="btn btn-sm btn-outline-primary"
                            title="Edit Case"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          
                          {/* 🗑️ Delete Button with Trash Icon */}
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(c.id)}
                            title="Delete Case"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>

                      <Accordion.Collapse eventKey={c.id}>
                        <div className="mt-4">
                          {/* Evidence Section */}
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

                          {/* Witnesses Section - UPDATED with Aadhaar and Contact Info */}
                          <h6 className="fw-bold mb-3">Witnesses</h6>
                          {caseDetails[c.id]?.witnesses?.length > 0 ? (
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
                                {caseDetails[c.id].witnesses.map(witness => (
                                  <tr key={witness.id || witness.witness_id}>
                                    <td>
                                      <strong>{witness.name}</strong>
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
                                        {witness.statement.length > 100 ? (
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
                                          witness.statement
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          ) : (
                            <p className="text-muted mb-4">No witness statements recorded.</p>
                          )}

                          {/* UPDATED: Criminal Records Section - REMOVED Type and Photo columns */}
                          <h6 className="fw-bold mb-3">Criminal Records</h6>
                          {caseDetails[c.id]?.criminalRecords?.length > 0 ? (
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
                                {caseDetails[c.id].criminalRecords.map(record => {
                                  const criminalInfo = getCriminalDisplayInfo(record);
                                  
                                  return (
                                    <tr key={record.record_id || record.id}>
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
                                      <td>{criminalInfo.criminal_age || 'N/A'}</td>
                                      <td>{criminalInfo.criminal_gender || 'N/A'}</td>
                                      <td>
                                        {criminalInfo.criminal_district ? `District ${criminalInfo.criminal_district}` : 'N/A'}
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
                    <h5 className="mt-3 text-muted">
                      {isFilterActive() ? 'No cases found matching your filters' : 'No cases found'}
                    </h5>
                    <p className="text-muted">
                      {isFilterActive() ? 'Try adjusting your search criteria or clear filters' : 'Get started by creating your first case'}
                    </p>
                    {isFilterActive() && (
                      <Button 
                        variant="outline-primary" 
                        onClick={clearFilters}
                        className="me-2"
                      >
                        Clear All Filters
                      </Button>
                    )}
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