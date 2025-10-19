import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
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
      // Clear any existing tokens and data
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      localStorage.removeItem('user_email');
      localStorage.removeItem('is_verified');
      localStorage.removeItem('is_superuser');

      // Use the correct endpoint: /api/token/ instead of /api/login/
      const response = await axios.post('/api/token/', { 
        email, 
        password 
      }, {
        headers: { 
          Authorization: "", // Ensure no old token is sent
          "Content-Type": "application/json"
        }
      });

      const { access, refresh, user } = response.data;

      // Store tokens
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_email', user.email);
      localStorage.setItem('is_verified', user.is_verified);
      localStorage.setItem('is_superuser', user.is_superuser);

      // Redirect based on user role
      if (user.is_superuser) {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced error handling
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.response?.data?.non_field_errors) {
        setError(error.response.data.non_field_errors[0]);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.email) {
        setError(error.response.data.email[0]);
      } else if (error.response?.data?.password) {
        setError(error.response.data.password[0]);
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.response?.status === 404) {
        setError('Login service unavailable. Please try again later.');
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear error when user starts typing
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError(null);
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
              <Alert variant="danger" className="text-center small">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className="auth-input"
                  disabled={loading}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="auth-input"
                  disabled={loading}
                />
                <div className="d-flex justify-content-end mt-2">
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
                style={{ height: '45px' }}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Form>
            
            <div className="text-center mt-4">
              <span className="text-muted">Don't have an account? </span>
              <Link to="/register" className="text-decoration-none fw-bold text-primary">
                Sign Up
              </Link>
            </div>

            {/* Demo credentials hint */}
            <div className="text-center mt-3">
              <small className="text-muted">
                Demo: Try with your registered credentials
              </small>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;