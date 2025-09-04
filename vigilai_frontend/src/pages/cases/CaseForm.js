// src/pages/CaseForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Spinner, Alert, Card, Row, Col, Navbar } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchCase, createCase, updateCase } from './CaseService';

export default function CaseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Open', // Default status
  });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Status options for dropdown
  const statusOptions = ['Open', 'In Progress', 'Pending', 'Closed', 'Reopened'];

  // Fetch existing case data if in edit mode
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      fetchCase(id)
        .then(res => {
          setFormData({
            title: res.data.title || '',
            description: res.data.description || '',
            status: res.data.status || 'Open',
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching case:', err);
          setError('Failed to load case data.');
          setLoading(false);
        });
    }
  }, [id, isEdit]);

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
      .then(() => {
        navigate('/dashboard');
      })
      .catch(err => {
        console.error('Submission error:', err);
        setError(err.response?.data?.message || 'Submission failed. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
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
            <p className="text-muted">Loading case data...</p>
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
          <div className="ms-auto">
            <Link to="/dashboard" className="btn btn-outline-secondary btn-sm me-2">
              Back to Dashboard
            </Link>
            <button onClick={handleLogout} className="btn btn-outline-primary btn-sm">
              Logout
            </button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <Card className="border-0 shadow-sm auth-card">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <h3 className="fw-bold text-dark">{isEdit ? 'Edit Case' : 'Add New Case'}</h3>
                  <p className="text-muted">
                    {isEdit ? 'Update the details of your case' : 'Create a new case to track'}
                  </p>
                </div>

                {error && (
                  <Alert variant="danger" className="text-center">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group controlId="caseTitle" className="mb-3">
                    <Form.Label className="fw-semibold">Title</Form.Label>
                    <Form.Control
                      name="title"
                      type="text"
                      placeholder="Enter case title"
                      value={formData.title}
                      onChange={handleChange}
                      required
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
                    <Form.Label className="fw-semibold">Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="auth-input"
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
                    
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => navigate('/dashboard')}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}