import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await axios.post('/api/token/', { username: email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_email', email);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex vh-100 justify-content-center align-items-center auth-container">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="p-4 shadow-sm border-0 auth-card">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-primary">VigilAI</h2>
              <p className="text-muted">Partner in justice</p>
            </div>
            
            <div className="text-center mb-4">
              <h4 className="fw-bold">Sign In to Your Account</h4>
              <p className="text-muted">Welcome back! Please enter your details</p>
            </div>
            
            {error && (
              <Alert variant="danger" className="text-center">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                />
                <div className="d-flex justify-content-end">
                  <Link to="/forgot-password" className="text-decoration-none text-primary small">
                    Forgot Password?
                  </Link>
                </div>
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 py-2 fw-bold auth-button" 
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form>
            
            <div className="text-center mt-4">
              <span className="text-muted">Don't have an account? </span>
              <Link to="/register" className="text-decoration-none fw-bold text-primary">
                Sign Up
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;