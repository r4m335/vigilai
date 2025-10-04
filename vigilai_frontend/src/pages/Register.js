import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    
    // Check minimum length
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    
    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      errors.push('At least one uppercase letter (A-Z)');
    }
    
    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      errors.push('At least one lowercase letter (a-z)');
    }
    
    // Check for numbers
    if (!/[0-9]/.test(password)) {
      errors.push('At least one number (0-9)');
    }
    
    // Check for special characters
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('At least one special character (!@#$%^&* etc.)');
    }
    
    // Check for common dictionary words (basic check)
    const commonWords = ['password', '123456', 'qwerty', 'letmein', 'welcome', 'admin', 'monkey'];
    if (commonWords.some(word => password.toLowerCase().includes(word))) {
      errors.push('Avoid common words and patterns');
    }
    
    return errors;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordErrors(validatePassword(newPassword));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError('Please fix the password requirements below');
      setPasswordErrors(errors);
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post('/api/register/', { email, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = passwordErrors.length === 0 && password.length > 0;

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
              <h4 className="fw-bold">Create an Account</h4>
              <p className="text-muted">And serve justice</p>
            </div>
            
            {success === true && (
              <Alert variant="success" className="text-center">
                Registration successful! Redirecting to login...
              </Alert>
            )}
            {error && (
              <Alert variant="danger" className="text-center">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleRegister}>
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

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  className="auth-input"
                  isInvalid={password.length > 0 && !isPasswordValid}
                />
                <Form.Text className="text-muted">
                  Password must contain:
                </Form.Text>
                <div className="small text-muted mt-1">
                  <ul className="mb-1">
                    <li className={password.length >= 8 ? 'text-success' : ''}>
                      {password.length >= 8 ? '✓' : '•'} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-success' : ''}>
                      {/[A-Z]/.test(password) ? '✓' : '•'} One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-success' : ''}>
                      {/[a-z]/.test(password) ? '✓' : '•'} One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-success' : ''}>
                      {/[0-9]/.test(password) ? '✓' : '•'} One number
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-success' : ''}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '•'} One special character
                    </li>
                  </ul>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="auth-input"
                  isInvalid={confirmPassword.length > 0 && password !== confirmPassword}
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Form.Text className="text-danger">
                    Passwords do not match
                  </Form.Text>
                )}
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 py-2 fw-bold auth-button" 
                disabled={loading || !isPasswordValid || password !== confirmPassword}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </Form>
            
            <div className="text-center mt-4">
              <span className="text-muted">Already have an account? </span>
              <Link to="/login" className="text-decoration-none fw-bold text-primary">
                Sign In
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;