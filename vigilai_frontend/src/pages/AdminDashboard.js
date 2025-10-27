import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Container, 
  Table, 
  Card, 
  Spinner, 
  Navbar, 
  Row, 
  Col, 
  Badge,
  Image,
  Button,
  Modal,
  Alert,
  Form,
  InputGroup
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getToken } from './cases/services/Authservice';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRankFilter, setUserRankFilter] = useState('');
  const [caseSearch, setCaseSearch] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState('');
  
  const navigate = useNavigate();

  // Simplified stats cards - only users and cases
  const statsCards = [
    { 
      title: 'Total Users', 
      value: users?.length || 0, 
      color: 'primary', 
      icon: '👥',
      key: 'users'
    },
    { 
      title: 'Total Cases', 
      value: cases?.length || 0, 
      color: 'success', 
      icon: '📁',
      key: 'cases'
    }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        navigate('/login');
        return;
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('🔄 Fetching admin dashboard data...');

      // Simplified endpoints - only users and cases
      const endpoints = [
        { key: 'users', url: '/api/admin-dashboard/users/' },
        { key: 'cases', url: '/api/admin-dashboard/cases/' }
      ];

      // Fetch data for each endpoint
      const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          try {
            const response = await axios.get(endpoint.url, { headers });
            const data = response.data || [];
            return { key: endpoint.key, data };
          } catch (err) {
            console.error(`❌ Error fetching ${endpoint.key}:`, err);
            return { key: endpoint.key, data: [], error: true };
          }
        })
      );

      // Process results safely
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { key, data, error } = result.value;
          if (!error && Array.isArray(data)) {
            switch (key) {
              case 'users':
                setUsers(data);
                setFilteredUsers(data);
                break;
              case 'cases':
                setCases(data);
                setFilteredCases(data);
                break;
              default:
                break;
            }
          }
        }
      });

    } catch (err) {
      console.error('❌ Error in fetchData:', err);
      setError('Failed to load admin dashboard. Please check your connection and permissions.');
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedProfilePhoto = localStorage.getItem('profile_photo');
    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }

    fetchData();
  }, [navigate]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (userSearch.trim() !== '') {
      filtered = filtered.filter(user => 
        user.staff_id?.toString().toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(userSearch.toLowerCase())
      );
    }

    // Apply rank filter
    if (userRankFilter) {
      filtered = filtered.filter(user => user.rank === userRankFilter);
    }

    setFilteredUsers(filtered);
  }, [userSearch, userRankFilter, users]);

  // Filter cases based on search and filters
  useEffect(() => {
    let filtered = cases;

    // Apply search filter
    if (caseSearch.trim() !== '') {
      filtered = filtered.filter(caseItem => 
        caseItem.case_number?.toString().toLowerCase().includes(caseSearch.toLowerCase()) ||
        caseItem.id?.toString().toLowerCase().includes(caseSearch.toLowerCase())
      );
    }

    // Apply type filter
    if (caseTypeFilter) {
      filtered = filtered.filter(caseItem => caseItem.primary_type === caseTypeFilter);
    }

    setFilteredCases(filtered);
  }, [caseSearch, caseTypeFilter, cases]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleVerifyUser = async (userId) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `/api/admin-dashboard/users/${userId}/verify/`, 
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const updatedUser = response.data.user;
      
      // Update user list
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      
      // Update selected user if it's the same
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(updatedUser);
      }
      
      setSuccess('User verified successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error verifying user:', err);
      setError(err.response?.data?.detail || 'Failed to verify user. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleUnverifyUser = async (userId) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `/api/admin-dashboard/users/${userId}/unverify/`, 
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const updatedUser = response.data.user;
      
      // Update user list
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      
      // Update selected user if it's the same
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(updatedUser);
      }
      
      setSuccess('User unverified successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error unverifying user:', err);
      setError(err.response?.data?.detail || 'Failed to unverify user. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchData();
  };

  const clearUserFilters = () => {
    setUserSearch('');
    setUserRankFilter('');
  };

  const clearCaseFilters = () => {
    setCaseSearch('');
    setCaseTypeFilter('');
  };

  const getUniqueValues = (data, key) => {
    const values = data.map(item => item[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const getStatusVariant = (status) => {
    if (!status) return 'secondary';
    
    const statusStr = String(status).toLowerCase();
    switch (statusStr) {
      case 'open': return 'success';
      case 'closed': return 'secondary';
      case 'in progress': 
      case 'investigating': return 'warning';
      case 'pending': return 'info';
      case 'reopened': return 'danger';
      default: return 'light';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  // CORRECTED case data accessor functions based on your Django model
  const getCaseType = (caseItem) => {
    return caseItem?.primary_type || 'N/A';
  };

  const getCaseStatus = (caseItem) => {
    return caseItem?.status || 'Open';
  };

  const getCaseLocation = (caseItem) => {
    return caseItem?.location_description || `District ${caseItem?.district || 'N/A'}`;
  };

  const getCaseInvestigator = (caseItem) => {
    if (caseItem?.investigator) {
      if (typeof caseItem.investigator === 'object') {
        return `${caseItem.investigator.first_name || ''} ${caseItem.investigator.last_name || ''}`.trim() || 'Unknown';
      }
      return caseItem.investigator;
    }
    return 'Unknown';
  };

  const getCaseDate = (caseItem) => {
    return caseItem?.date_time || caseItem?.created_at;
  };

  const getCaseId = (caseItem) => {
    return caseItem?.case_id || caseItem?.id || 'N/A';
  };

  const getCaseNumber = (caseItem) => {
    return caseItem?.case_number || `#${getCaseId(caseItem)}`;
  };

  const renderOverview = () => (
    <div>
      <Row className="mb-4">
        {statsCards.map((stat, index) => (
          <Col md={6} lg={6} key={stat.key || index} className="mb-3">
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="d-flex flex-column justify-content-center">
                <div className="mb-2" style={{ fontSize: '2rem' }}>{stat.icon}</div>
                <Card.Title className={`text-${stat.color} fw-bold`}>
                  {stat.value}
                </Card.Title>
                <Card.Text className="text-muted small">{stat.title}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Recent Users</h5>
              <Button variant="outline-primary" size="sm" onClick={refreshData} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : '🔄 Refresh'}
              </Button>
            </Card.Header>
            <Card.Body>
              {!users || users.length === 0 ? (
                <div className="text-center text-muted py-3">
                  No users found
                </div>
              ) : (
                <Table borderless hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Rank</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map(user => (
                      <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => handleUserClick(user)}>
                        <td>{user.first_name || ''} {user.last_name || ''}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>
                          <Badge bg="info">{user.rank || 'User'}</Badge>
                        </td>
                        <td>
                          <Badge bg={user.is_verified ? 'success' : 'warning'}>
                            {user.is_verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fw-bold">Recent Cases</h5>
            </Card.Header>
            <Card.Body>
              {!cases || cases.length === 0 ? (
                <div className="text-center text-muted py-3">
                  No cases found
                </div>
              ) : (
                <Table borderless hover responsive>
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.slice(0, 5).map(caseItem => (
                      <tr key={getCaseId(caseItem)}>
                        <td className="fw-semibold">{getCaseNumber(caseItem)}</td>
                        <td>{getCaseType(caseItem)}</td>
                        <td>
                          <Badge bg={getStatusVariant(getCaseStatus(caseItem))}>
                            {getCaseStatus(caseItem)}
                          </Badge>
                        </td>
                        <td>{formatDate(getCaseDate(caseItem))}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderUsers = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0 fw-bold">All Users ({filteredUsers?.length || 0})</h5>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="success" className="me-2">
            Verified: {users?.filter(u => u.is_verified).length || 0}
          </Badge>
          <Badge bg="warning" className="me-2">
            Pending: {users?.filter(u => !u.is_verified).length || 0}
          </Badge>
          <Button variant="outline-primary" size="sm" onClick={refreshData} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : '🔄 Refresh'}
          </Button>
        </div>
      </Card.Header>
      
      {/* User Search and Filters */}
      <Card.Body className="border-bottom">
        <Row className="g-3">
          <Col md={8}>
            <Form.Group>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search users by staff ID, email, or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {(userSearch || userRankFilter) && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={clearUserFilters}
                    title="Clear filters"
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                )}
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Select
                value={userRankFilter}
                onChange={(e) => setUserRankFilter(e.target.value)}
              >
                <option value="">All Ranks</option>
                {getUniqueValues(users, 'rank').map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        {(userSearch || userRankFilter) && (
          <div className="mt-2">
            <small className="text-muted">
              Showing {filteredUsers.length} of {users.length} users
              {userSearch && ` matching "${userSearch}"`}
              {userRankFilter && ` with rank "${userRankFilter}"`}
            </small>
          </div>
        )}
      </Card.Body>

      <Card.Body>
        {!filteredUsers || filteredUsers.length === 0 ? (
          <div className="text-center text-muted py-5">
            <div className="mb-3">No users found {userSearch || userRankFilter ? 'matching your criteria' : 'in the system'}</div>
            {(userSearch || userRankFilter) && (
              <Button variant="outline-primary" onClick={clearUserFilters} className="me-2">
                Clear Filters
              </Button>
            )}
            <Button variant="primary" onClick={refreshData}>
              Try Again
            </Button>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Staff ID</th>
                <th>Rank</th>
                <th>Verified</th>
                <th>Date Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => handleUserClick(user)}>
                  <td>{user.id}</td>
                  <td>{user.first_name || ''} {user.last_name || ''}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.phone_number || 'N/A'}</td>
                  <td>
                    <Badge bg="secondary">{user.staff_id || 'N/A'}</Badge>
                  </td>
                  <td>
                    <Badge bg="info">{user.rank || 'User'}</Badge>
                  </td>
                  <td>
                    <Badge bg={user.is_verified ? 'success' : 'warning'}>
                      {user.is_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </td>
                  <td>{formatDate(user.date_joined)}</td>
                  <td>
                    {user.is_verified ? (
                      <Button 
                        size="sm" 
                        variant="warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnverifyUser(user.id);
                        }}
                      >
                        Unverify
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerifyUser(user.id);
                        }}
                      >
                        Verify
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );

  const renderCases = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold">All Cases ({filteredCases?.length || 0})</h5>
        <Button variant="outline-primary" size="sm" onClick={refreshData} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : '🔄 Refresh'}
        </Button>
      </Card.Header>
      
      {/* Case Search and Filters */}
      <Card.Body className="border-bottom">
        <Row className="g-3">
          <Col md={8}>
            <Form.Group>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search cases by case number or ID..."
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                />
                {(caseSearch || caseTypeFilter) && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={clearCaseFilters}
                    title="Clear filters"
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                )}
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Select
                value={caseTypeFilter}
                onChange={(e) => setCaseTypeFilter(e.target.value)}
              >
                <option value="">All Crime Types</option>
                {getUniqueValues(cases, 'primary_type').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        {(caseSearch || caseTypeFilter) && (
          <div className="mt-2">
            <small className="text-muted">
              Showing {filteredCases.length} of {cases.length} cases
              {caseSearch && ` matching "${caseSearch}"`}
              {caseTypeFilter && ` with type "${caseTypeFilter}"`}
            </small>
          </div>
        )}
      </Card.Body>

      <Card.Body>
        {!filteredCases || filteredCases.length === 0 ? (
          <div className="text-center text-muted py-5">
            <div className="mb-3">No cases found {caseSearch || caseTypeFilter ? 'matching your criteria' : 'in the system'}</div>
            {(caseSearch || caseTypeFilter) && (
              <Button variant="outline-primary" onClick={clearCaseFilters} className="me-2">
                Clear Filters
              </Button>
            )}
            <Button variant="primary" onClick={refreshData}>
              Try Again
            </Button>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Investigator</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(caseItem => (
                <tr key={getCaseId(caseItem)}>
                  <td className="fw-semibold">{getCaseNumber(caseItem)}</td>
                  <td>{getCaseType(caseItem)}</td>
                  <td>
                    <Badge bg={getStatusVariant(getCaseStatus(caseItem))}>
                      {getCaseStatus(caseItem)}
                    </Badge>
                  </td>
                  <td>{getCaseLocation(caseItem)}</td>
                  <td>{getCaseInvestigator(caseItem)}</td>
                  <td>{formatDate(getCaseDate(caseItem))}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users': return renderUsers();
      case 'cases': return renderCases();
      case 'overview':
      default: return renderOverview();
    }
  };

  if (loading && (!users || users.length === 0)) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI Admin</Navbar.Brand>
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
            <p className="text-muted">Loading admin dashboard...</p>
            <small className="text-muted">Fetching data from server</small>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI Admin</Navbar.Brand>
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
            <button onClick={handleLogout} className="btn btn-outline-primary btn-sm">
              Logout
            </button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-4">
        {error && (
          <Alert variant="danger" className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Button variant="outline-danger" size="sm" onClick={() => setError(null)}>
              ×
            </Button>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="d-flex justify-content-between align-items-center">
            <span>{success}</span>
            <Button variant="outline-success" size="sm" onClick={() => setSuccess(null)}>
              ×
            </Button>
          </Alert>
        )}

        <div className="text-center mb-4">
          <h3 className="fw-bold text-dark">Admin Dashboard</h3>
          <p className="text-muted">Manage users, cases, and system data</p>
        </div>

        {/* Tab Navigation */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-0">
            <div className="d-flex border-bottom">
              {['overview', 'users', 'cases'].map(tab => (
                <button
                  key={tab}
                  className={`btn btn-link text-decoration-none ${
                    activeTab === tab ? 'fw-bold text-primary border-bottom border-primary' : 'text-muted'
                  }`}
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    padding: '1rem 1.5rem',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === tab ? '3px solid #007bff' : '3px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Tab Content */}
        {renderTabContent()}

        {/* User Detail Modal */}
        <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>User Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser && (
              <Row>
                <Col md={6}>
                  <p><strong>ID:</strong> {selectedUser.id}</p>
                  <p><strong>Name:</strong> {selectedUser.first_name || ''} {selectedUser.last_name || ''}</p>
                  <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                  <p><strong>Username:</strong> {selectedUser.username || 'N/A'}</p>
                  <p><strong>Phone Number:</strong> {selectedUser.phone_number || 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Staff ID:</strong> {selectedUser.staff_id || 'N/A'}</p>
                  <p><strong>Rank:</strong> {selectedUser.rank || 'User'}</p>
                  <p><strong>Verified:</strong> 
                    <Badge bg={selectedUser.is_verified ? 'success' : 'warning'} className="ms-2">
                      {selectedUser.is_verified ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                  <p><strong>Date Joined:</strong> {formatDate(selectedUser.date_joined)}</p>
                  <p><strong>Last Login:</strong> {selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Never'}</p>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            {selectedUser && (
              <>
                {selectedUser.is_verified ? (
                  <Button 
                    variant="warning" 
                    onClick={() => handleUnverifyUser(selectedUser.id)}
                  >
                    Unverify User
                  </Button>
                ) : (
                  <Button 
                    variant="success" 
                    onClick={() => handleVerifyUser(selectedUser.id)}
                  >
                    Verify User
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setShowUserModal(false)}>
                  Close
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default AdminDashboard;