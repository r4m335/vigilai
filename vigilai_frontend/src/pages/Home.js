import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <Container>
          <span className="navbar-brand fw-bold text-primary fs-3">VigilAI</span>
          <div className="navbar-nav ms-auto">
            <Link to="/login" className="btn btn-outline-primary me-2">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Sign Up</Link>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <Container className="py-5">
        <Row className="justify-content-center text-center py-5">
          <Col lg={8}>
            <h1 className="fw-bold display-4 mb-4 text-dark">Welcome to VigilAI</h1>
            <p className="lead text-muted mb-5">
              Empowering access to justice with streamlined case management and secure workflows.
            </p>
            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
              <Link to="/register" className="btn btn-primary btn-lg px-4 me-md-2 auth-button">
                Get Started
              </Link>
              
            </div>
          </Col>
        </Row>
      </Container>

      {/* Features Section */}
      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2 className="fw-bold mb-3">Our Features</h2>
            <p className="text-muted">Discover how VigilAI transforms case management</p>
          </Col>
        </Row>
        
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm auth-card">
              <Card.Body className="p-4 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                  <i className="bi bi-shield-check text-primary fs-1"></i>
                </div>
                <Card.Title className="fw-bold">Secure Case Management</Card.Title>
                <Card.Text className="text-muted">
                  Keep all your case files organized and secure with our encrypted storage system.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm auth-card">
              <Card.Body className="p-4 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                  <i className="bi bi-graph-up text-primary fs-1"></i>
                </div>
                <Card.Title className="fw-bold">Advanced Analytics</Card.Title>
                <Card.Text className="text-muted">
                  Gain insights from your case data with our powerful analytics and reporting tools.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm auth-card">
              <Card.Body className="p-4 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                  <i className="bi bi-people-fill text-primary fs-1"></i>
                </div>
                <Card.Title className="fw-bold">Collaborative Workflows</Card.Title>
                <Card.Text className="text-muted">
                  Work seamlessly with your team through our collaborative platform features.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer className="bg-white mt-5 py-4 border-top">
        <Container>
          <Row>
            <Col md={6}>
              <p className="mb-0 text-muted">© 2023 VigilAI. All rights reserved.</p>
            </Col>
            <Col md={6} className="text-md-end">
              <Link to="#" className="text-decoration-none text-muted me-3">Privacy Policy</Link>
              <Link to="#" className="text-decoration-none text-muted">Terms of Service</Link>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Home;