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
  Form,
  Alert
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getToken } from './cases/services/Authservice';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [witnesses, setWitnesses] = useState([]);
  const [criminalRecords, setCriminalRecords] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const statsCards = [
    { title: 'Total Users', value: users.length, color: 'primary', icon: '👥' },
    { title: 'Total Cases', value: cases.length, color: 'success', icon: '📁' },
    { title: 'Evidence Items', value: evidence.length, color: 'warning', icon: '🔍' },
    { title: 'Witnesses', value: witnesses.length, color: 'info', icon: '👤' },
    { title: 'Criminal Records', value: criminalRecords.length, color: 'danger', icon: '📋' },
    { title: 'Predictions', value: predictions.length, color: 'secondary', icon: '🤖' }
  ];

  const fetchData = async () => {
    try {
      const token = getToken();
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const [
        userRes, 
        caseRes, 
        evidenceRes, 
        witnessRes, 
        criminalRes, 
        predictionRes
      ] = await Promise.all([
        axios.get('/api/admin-dashboard/users/', { headers }),
        axios.get('/api/admin-dashboard/cases/', { headers }),
        axios.get('/api/admin-dashboard/evidence/', { headers }),
        axios.get('/api/admin-dashboard/witnesses/', { headers }),
        axios.get('/api/admin-dashboard/criminal-records/', { headers }),
        axios.get('/api/admin-dashboard/predictions/', { headers })
      ]);
      
      setUsers(userRes.data);
      setCases(caseRes.data);
      setEvidence(evidenceRes.data);
      setWitnesses(witnessRes.data);
      setCriminalRecords(criminalRes.data);
      setPredictions(predictionRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data. Please check your permissions.');
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
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
      const response = await axios.patch(`/api/admin-dashboard/users/${userId}/verify/`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Use the updated user data from the response
      const updatedUser = response.data.user;
      
      // Update user list with the fresh data from server
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      
      // Update selected user if it's the same
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(updatedUser);
      }
      
      setSuccess('User verified successfully!');
      setShowUserModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error verifying user:', err);
      setError('Failed to verify user. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUnverifyUser = async (userId) => {
    try {
      const token = getToken();
      const response = await axios.patch(`/api/admin-dashboard/users/${userId}/unverify/`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Use the updated user data from the response
      const updatedUser = response.data.user;
      
      // Update user list with the fresh data from server
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      
      // Update selected user if it's the same
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(updatedUser);
      }
      
      setSuccess('User unverified successfully!');
      setShowUserModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error unverifying user:', err);
      setError('Failed to unverify user. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Refresh data function
  const refreshData = () => {
    setLoading(true);
    fetchData();
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'success';
      case 'closed': return 'secondary';
      case 'in progress': return 'warning';
      case 'pending': return 'info';
      case 'reopened': return 'danger';
      default: return 'light';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOverview = () => (
    <div>
      <Row className="mb-4">
        {statsCards.map((stat, index) => (
          <Col md={4} lg={2} key={index} className="mb-3">
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="d-flex flex-column justify-content-center">
                <div className="mb-2" style={{ fontSize: '2rem' }}>{stat.icon}</div>
                <Card.Title className={`text-${stat.color} fw-bold`}>{stat.value}</Card.Title>
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
              <Button variant="outline-primary" size="sm" onClick={refreshData}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              <Table borderless hover>
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
                      <td>{user.first_name} {user.last_name}</td>
                      <td>{user.email}</td>
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
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fw-bold">Recent Cases</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless hover>
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.slice(0, 5).map(caseItem => (
                    <tr key={caseItem.id}>
                      <td className="fw-semibold">{caseItem.crime_id}</td>
                      <td>{caseItem.type_of_crime}</td>
                      <td>
                        <Badge bg={getStatusVariant(caseItem.status)}>
                          {caseItem.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
          <h5 className="mb-0 fw-bold">All Users ({users.length})</h5>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="success" className="me-2">
            Verified: {users.filter(u => u.is_verified).length}
          </Badge>
          <Badge bg="warning" className="me-2">
            Pending: {users.filter(u => !u.is_verified).length}
          </Badge>
          <Button variant="outline-primary" size="sm" onClick={refreshData}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
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
            {users.map(user => (
              <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => handleUserClick(user)}>
                <td>{user.id}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.phone_number}</td>
                <td>
                  <Badge bg="secondary">{user.staff_id}</Badge>
                </td>
                <td>
                  <Badge bg="info">{user.rank}</Badge>
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
      </Card.Body>
    </Card>
  );

  const renderCases = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white">
        <h5 className="mb-0 fw-bold">All Cases ({cases.length})</h5>
      </Card.Header>
      <Card.Body>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>District</th>
              <th>Ward</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(caseItem => (
              <tr key={caseItem.id}>
                <td className="fw-semibold">{caseItem.crime_id}</td>
                <td>{caseItem.title}</td>
                <td>{caseItem.type_of_crime}</td>
                <td>
                  <Badge bg={getStatusVariant(caseItem.status)}>
                    {caseItem.status}
                  </Badge>
                </td>
                <td>{caseItem.district}</td>
                <td>{caseItem.ward}</td>
                <td>{formatDate(caseItem.date)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
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

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Loading admin dashboard...</p>
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
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="text-center">
            {success}
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
                    borderBottom: activeTab === tab ? '3px solid #007bff' : '3px solid transparent'
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
                  <p><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Username:</strong> {selectedUser.username}</p>
                  <p><strong>Phone Number:</strong> {selectedUser.phone_number}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Staff ID:</strong> {selectedUser.staff_id}</p>
                  <p><strong>Rank:</strong> {selectedUser.rank}</p>
                  <p><strong>Jurisdiction:</strong> 
                    <a href={selectedUser.jurisdiction} target="_blank" rel="noopener noreferrer" className="ms-2">
                      View Location
                    </a>
                  </p>
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