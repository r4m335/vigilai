import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Image, Alert, Spinner, Navbar, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logout, getCurrentUserEmail, getToken, isAdmin } from './cases/services/Authservice';
import 'bootstrap/dist/css/bootstrap.min.css';

function Profile() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    bio: '',
    profile_photo: null,
    staff_id: '',
    rank: '',
    jurisdiction: ''
  });
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
    checkUserRole();
  }, []);

  const checkUserRole = () => {
    const adminStatus = isAdmin();
    setUserIsAdmin(adminStatus);
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      // Fetch user profile from the updated endpoint
      const profileResponse = await axios.get('/api/profile/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch cases worked by this officer WITH TRAILING SLASH
      const casesResponse = await axios.get('/api/cases/?worked_by_me=true', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Profile API Response:', profileResponse.data);

      // Set profile data directly from API response
      const profileData = profileResponse.data;
      setProfile(profileData);
      setCases(casesResponse.data.results || casesResponse.data || []);
      
      // Handle profile photo URL
      if (profileData.profile_photo) {
        const photoUrl = profileData.profile_photo.startsWith('http') 
          ? profileData.profile_photo 
          : `${window.location.origin}${profileData.profile_photo}`;
        setPhotoPreview(photoUrl);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      // If profile endpoint fails, at least show the email from login
      const userEmail = getCurrentUserEmail() || localStorage.getItem('user_email');
      setProfile(prev => ({ ...prev, email: userEmail }));
      setError('Failed to load profile details, but showing your login email.');
    } finally {
      setLoading(false);
    }
  };

  const handleBioChange = (e) => {
    const { value } = e.target;
    setProfile(prev => ({ ...prev, bio: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile(prev => ({ ...prev, profile_photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const token = getToken();
      const formData = new FormData();
      
      // Only append editable fields: bio and profile_photo
      formData.append('bio', profile.bio || '');
      
      if (profile.profile_photo instanceof File) {
        formData.append('profile_photo', profile.profile_photo);
      }

      console.log('Submitting profile data:', {
        bio: profile.bio
      });

      // PATCH request with updated endpoint
      const response = await axios.patch('/api/profile/me/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Profile update response:', response.data);

      // Update profile with response data
      setProfile(response.data);
      
      // Update the photo preview with the URL from the server response
      if (response.data.profile_photo) {
        const photoUrl = response.data.profile_photo.startsWith('http') 
          ? response.data.profile_photo 
          : `${window.location.origin}${response.data.profile_photo}`;
        setPhotoPreview(photoUrl);
      }
      
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDashboardClick = () => {
    if (userIsAdmin) {
      navigate('/admin-dashboard/');
    } else {
      navigate('/dashboard/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login/');
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

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
            <div className="ms-auto">
              <button onClick={handleLogout} className="btn btn-outline-primary btn-sm">
                Logout
              </button>
            </div>
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Loading profile...</p>
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
          <div className="ms-auto">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-2" 
              onClick={handleDashboardClick}
            >
              {userIsAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </Button>
            <Button variant="outline-primary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="text-center mb-4">
              <h2 className="fw-bold text-dark">Officer Profile</h2>
              <p className="text-muted">Manage your profile and view your case history</p>
              {userIsAdmin && (
                <Badge bg="warning" className="mt-2">
                  Administrator
                </Badge>
              )}
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row>
              {/* Profile Section */}
              <Col lg={4} className="mb-4">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center p-4">
                    <div className="mb-3">
                      {photoPreview ? (
                        <Image
                          src={photoPreview}
                          alt="Profile"
                          roundedCircle
                          fluid
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                          className="border"
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto"
                          style={{ width: '150px', height: '150px', border: '2px dashed #dee2e6' }}
                        >
                          <i className="bi bi-person text-muted" style={{ fontSize: '3rem' }}></i>
                        </div>
                      )}
                    </div>

                    {editing && (
                      <Form.Group className="mb-3">
                        <Form.Label>Change Photo</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                        <Form.Text className="text-muted">
                          You can update your profile picture
                        </Form.Text>
                      </Form.Group>
                    )}

                    <h4 className="fw-bold mt-3">
                      {profile.first_name} {profile.last_name}
                    </h4>
                    <p className="text-muted">{profile.email || 'Email not available'}</p>
                    <p className="text-muted small">{profile.rank}</p>
                    <p className="text-muted small">ID: {profile.staff_id}</p>
                    
                    {userIsAdmin && (
                      <Badge bg="warning" className="mb-2">
                        Administrator
                      </Badge>
                    )}
                    
                    {!editing && (
                      <Button variant="primary" onClick={() => setEditing(true)} className="mt-2">
                        Edit Profile
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Details Section */}
              <Col lg={8}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4">Personal Information</h5>
                    
                    {editing ? (
                      <Form onSubmit={handleSubmit}>
                        {/* Read-only fields */}
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>First Name</Form.Label>
                              <Form.Control
                                value={profile.first_name || 'Not set'}
                                disabled
                                className="bg-light"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Last Name</Form.Label>
                              <Form.Control
                                value={profile.last_name || 'Not set'}
                                disabled
                                className="bg-light"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={profile.email || 'Email not available'}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            value={profile.phone_number || 'Not provided'}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Staff ID</Form.Label>
                          <Form.Control
                            value={profile.staff_id || 'Not provided'}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Rank</Form.Label>
                          <Form.Control
                            value={profile.rank || 'Not provided'}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Jurisdiction</Form.Label>
                          <Form.Control
                            value={profile.jurisdiction || 'Not provided'}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>

                        {/* Editable Bio field */}
                        <Form.Group className="mb-4">
                          <Form.Label>Bio</Form.Label>
                          <Form.Control
                            name="bio"
                            as="textarea"
                            rows={3}
                            value={profile.bio}
                            onChange={handleBioChange}
                            placeholder="Tell us about yourself..."
                          />
                          <Form.Text className="text-muted">
                            You can update your bio information
                          </Form.Text>
                        </Form.Group>

                        <div className="d-flex gap-2">
                          <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button variant="secondary" onClick={() => {
                            setEditing(false);
                            // Reset any unsaved changes
                            fetchProfileData();
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      <>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">First Name:</Col>
                          <Col sm={8}>{profile.first_name || 'Not set'}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">Last Name:</Col>
                          <Col sm={8}>{profile.last_name || 'Not set'}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">Email:</Col>
                          <Col sm={8}>{profile.email || 'Email not available'}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">Phone:</Col>
                          <Col sm={8}>{profile.phone_number || 'Not provided'}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">Staff ID:</Col>
                          <Col sm={8}>{profile.staff_id || 'Not provided'}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">Rank:</Col>
                          <Col sm={8}>{profile.rank || 'Not provided'}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">Jurisdiction:</Col>
                          <Col sm={8}>{profile.jurisdiction || 'Not provided'}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">Bio:</Col>
                          <Col sm={8}>{profile.bio || 'No bio provided'}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col sm={4} className="fw-semibold">Role:</Col>
                          <Col sm={8}>
                            {userIsAdmin ? (
                              <Badge bg="warning">Administrator</Badge>
                            ) : (
                              <Badge bg="primary">Officer</Badge>
                            )}
                          </Col>
                        </Row>
                      </>
                    )}
                  </Card.Body>
                </Card>

                {/* Cases Worked On */}
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4">Cases Worked On</h5>
                    
                    {cases.length > 0 ? (
                      <ListGroup variant="flush">
                        {cases.map((caseItem) => (
                          <ListGroup.Item key={getCaseId(caseItem)} className="px-0">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="fw-bold">{getCaseNumber(caseItem)} - {getCaseType(caseItem)}</h6>
                                <p className="text-muted mb-1">{caseItem.description}</p>
                                <small className="text-muted">
                                  Location: {getCaseLocation(caseItem)} • Date: {getCaseDate(caseItem) ? new Date(getCaseDate(caseItem)).toLocaleDateString() : 'No date'}
                                </small>
                              </div>
                              <div className="text-end">
                                {getStatusBadge(getCaseStatus(caseItem))}
                                <br />
                                <small className="text-muted">
                                  Investigator: {getCaseInvestigator(caseItem)}
                                </small>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <div className="text-center py-4">
                        <i className="bi bi-folder-x text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mt-2">No cases assigned yet</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Activity Stats */}
            <Row className="mt-4">
              <Col md={3} className="mb-3">
                <Card className="border-0 shadow-sm text-center">
                  <Card.Body>
                    <h3 className="fw-bold text-primary">{cases.length}</h3>
                    <p className="text-muted mb-0">Total Cases</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-3">
                <Card className="border-0 shadow-sm text-center">
                  <Card.Body>
                    <h3 className="fw-bold text-success">{cases.filter(c => getCaseStatus(c) === 'Open').length}</h3>
                    <p className="text-muted mb-0">Open Cases</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-3">
                <Card className="border-0 shadow-sm text-center">
                  <Card.Body>
                    <h3 className="fw-bold text-warning">{cases.filter(c => getCaseStatus(c) === 'Pending').length}</h3>
                    <p className="text-muted mb-0">Pending Cases</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-3">
                <Card className="border-0 shadow-sm text-center">
                  <Card.Body>
                    <h3 className="fw-bold text-info">{cases.filter(c => getCaseStatus(c) === 'Closed').length}</h3>
                    <p className="text-muted mb-0">Closed Cases</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Profile;