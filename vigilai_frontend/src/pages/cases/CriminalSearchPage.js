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
  Navbar
} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, logout } from './services/Authservice';
import NotificationService from './services/NotificationService';

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

  // NEW: Load unread notification count
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

  // NEW: Reset new notification indicator when user clicks notifications
  const handleNotificationsClick = () => {
    setHasNewNotifications(false);
    navigate('/notifications');
  };

  // Basic search by name or Aadhaar
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
        setSearchResults(data.results || data.criminals || []);
        if ((data.results || data.criminals || []).length === 0) {
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
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const exportToCSV = () => {
    if (searchResults.length === 0) {
      setError('No data to export');
      return;
    }

    const headers = ['Name', 'Aadhaar', 'Age', 'Gender', 'District', 'Created Date'];
    const csvData = searchResults.map(criminal => [
      criminal.criminal_name,
      criminal.aadhaar_number || 'N/A',
      criminal.criminal_age || 'N/A',
      criminal.criminal_gender || 'N/A',
      criminal.criminal_district ? `District ${criminal.criminal_district}` : 'N/A',
      criminal.created_at ? new Date(criminal.created_at).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `criminal_search_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
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
                Search criminal records by name or Aadhaar number
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
                            placeholder="Search by criminal name or Aadhaar number..."
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
                          Enter at least 3 characters to search by name or exact 12-digit Aadhaar number
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
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    Search Results ({searchResults.length} criminals found)
                  </h6>
                  <Button variant="outline-success" size="sm" onClick={exportToCSV}>
                    📊 Export to CSV
                  </Button>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead className="table-dark">
                        <tr>
                          <th>Photo</th>
                          <th>Name</th>
                          <th>Aadhaar</th>
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
                                <Badge className="font-monospace">
                                  {criminal.aadhaar_number}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {criminal.criminal_age ? (
                                <Badge bg="secondary">{criminal.criminal_age}</Badge>
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
                              {criminal.criminal_district ? (
                                <Badge bg="secondary">
                                  District {criminal.criminal_district}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {criminal.created_at ? (
                                <small>
                                  {new Date(criminal.created_at).toLocaleDateString()}
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

      {/* Criminal Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Criminal Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCriminal && (
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
                    <strong>Age:</strong>
                    <div className="mb-2">
                      {selectedCriminal.criminal_age || 'Not provided'}
                    </div>
                  </Col>
                </Row>
                <Row>
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
                  <Col md={6}>
                    <strong>District:</strong>
                    <div className="mb-2">
                      {selectedCriminal.criminal_district ? (
                        <Badge bg="outline-primary">
                          District {selectedCriminal.criminal_district}
                        </Badge>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <strong>Ward:</strong>
                    <div className="mb-2">
                      {selectedCriminal.criminal_ward ? (
                        <Badge bg="outline-secondary">
                          Ward {selectedCriminal.criminal_ward}
                        </Badge>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  </Col>
                  <Col md={6}>
                    <strong>Created Date:</strong>
                    <div className="mb-2">
                      {selectedCriminal.created_at ? (
                        new Date(selectedCriminal.created_at).toLocaleDateString()
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
                        {new Date(selectedCriminal.updated_at).toLocaleDateString()}
                      </div>
                    </Col>
                  </Row>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            // Navigate to case creation with this criminal pre-selected
            navigate('/cases/new', { state: { selectedCriminal: selectedCriminal } });
          }}>
            Use in New Case
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
      `}</style>
    </div>
  );
}