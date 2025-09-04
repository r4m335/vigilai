import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Spinner, Alert, Card, Row, Col, Navbar, Button } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { fetchCases, deleteCase } from './CaseService';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch cases data
    fetchCases()
      .then(response => {
        setCases(response.data);
        setLoading(false);
      })
      .catch(err => { 
        console.error(err);
        if (err.response && err.response.status === 401) {
          // Token is invalid, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        } else {
          setError('Failed to load cases.');
        }
        setLoading(false);
      });
  }, [navigate]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      deleteCase(id)
        .then(() => {
          // Remove the case from the local state
          setCases(cases.filter(c => c.id !== id));
        })
        .catch(err => {
          console.error('Error deleting case:', err);
          setError('Failed to delete case.');
        });
    }
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
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
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
          <div className="ms-auto">
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

      <Container className="py-5">
        {error && (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        )}

        <Row className="justify-content-center mb-4">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="fw-bold text-dark mb-0">Cases Dashboard</h2>
              <span className="badge bg-primary">{cases.length} cases</span>
            </div>
            <p className="text-muted">Manage and track all your cases in one place</p>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="border-0 shadow-sm auth-card">
              <Card.Body className="p-4">
                {cases.length > 0 ? (
                  <Table hover responsive className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Created On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map(c => (
                        <tr key={c.id}>
                          <td className="fw-bold">#{c.id}</td>
                          <td>{c.title}</td>
                          <td>
                            <span className={`badge ${
                              c.status === 'Open' ? 'bg-success' : 
                              c.status === 'Closed' ? 'bg-secondary' : 
                              c.status === 'Pending' ? 'bg-warning' : 'bg-info'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td>{new Date(c.created_at).toLocaleDateString()}</td>
                          <td>
                            <Link 
                              to={`/cases/edit/${c.id}`} 
                              className="btn btn-sm btn-outline-primary me-1"
                            >
                              Edit
                            </Link>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDelete(c.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-folder-x text-muted" style={{ fontSize: '3rem' }}></i>
                    <h5 className="mt-3 text-muted">No cases found</h5>
                    <p className="text-muted">Get started by creating your first case</p>
                    <Link to="/cases/new" className="btn btn-primary mt-2">
                      Create New Case
                    </Link>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Stats Cards */}
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
      </Container>
    </div>
  );
}