import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, Card, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    jurisdiction: '',
    staffId: '',
    rank: '',
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const navigate = useNavigate();

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    
    return errors;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData(prev => ({
      ...prev,
      password: newPassword
    }));
    
    const errors = validatePassword(newPassword);
    setPasswordErrors(errors);
    
    // Show requirements only if password is not empty and has errors
    setShowPasswordRequirements(newPassword.length > 0 && errors.length > 0);
  };

  const handlePasswordFocus = () => {
    if (formData.password.length === 0) {
      setShowPasswordRequirements(true);
    }
  };

  const handlePasswordBlur = () => {
    // Keep requirements visible if there are errors, otherwise hide
    if (passwordErrors.length === 0 && formData.password.length > 0) {
      setShowPasswordRequirements(false);
    }
  };

  // Validate Google Maps link
  const isValidGoogleMapsLink = (link) => {
    return link.includes('maps.google.com') || 
           link.includes('goo.gl/maps') || 
           link.includes('google.com/maps') ||
           link.startsWith('https://maps.app.goo.gl/');
  };

  // Validate Police Staff ID format (flexible: XX-XXX-XXXXXX)
  const isValidStaffId = (staffId) => {
    const staffIdRegex = /^[A-Z]{2}-[A-Z]{3,4}-\d{5,6}$/;
    return staffIdRegex.test(staffId);
  };

  // Auto-format Staff ID as user types with flexible enforcement
  const handleStaffIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Remove any characters that are not A-Z, 0-9, or hyphen
    value = value.replace(/[^A-Z0-9-]/g, '');
    
    // Auto-insert first hyphen after 2 letters
    if (value.length > 2 && value[2] !== '-') {
      value = value.slice(0, 2) + '-' + value.slice(2);
    }
    
    // Auto-insert second hyphen after 3-4 letters (after first hyphen)
    if (value.length > 6 && value[6] !== '-') {
      value = value.slice(0, 6) + '-' + value.slice(6);
    }
    
    // Limit total length to accommodate different formats
    if (value.length > 13) {
      value = value.slice(0, 13);
    }
    
    // Ensure only numbers after the second hyphen
    if (value.length > 7) {
      const parts = value.split('-');
      if (parts.length >= 3) {
        parts[2] = parts[2].replace(/[^0-9]/g, '');
        value = parts.join('-');
      }
    }
    
    setFormData(prev => ({
      ...prev,
      staffId: value
    }));
  };

  // Rank options for police officers
  const rankOptions = [
    'Constable',
    'Head Constable',
    'Assistant Sub-Inspector',
    'Sub-Inspector',
    'Inspector',
    'Assistant Commissioner',
    'Deputy Commissioner',
    'Additional Commissioner',
    'Commissioner',
    'Director General'
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setShowErrorToast(false);
    setShowSuccessToast(false);
    
    // Validate all required fields
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phoneNumber || !formData.jurisdiction || !formData.staffId || 
        !formData.rank || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      setShowErrorToast(true);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setShowErrorToast(true);
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid phone number');
      setShowErrorToast(true);
      return;
    }

    // Validate Google Maps link
    if (!isValidGoogleMapsLink(formData.jurisdiction)) {
      setError('Please enter a valid Google Maps link for your police station');
      setShowErrorToast(true);
      return;
    }

    // Validate Staff ID - must be in format XX-XXX-XXXXXX or XX-XXXX-XXXXXX
    if (!isValidStaffId(formData.staffId)) {
      setError('Staff ID must be in format: XX-XXX-XXXXX or XX-XXXX-XXXXXX (e.g., KL-CST-98765, MH-INS-012345)');
      setShowErrorToast(true);
      return;
    }
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setShowErrorToast(true);
      return;
    }
    
    // Validate password strength
    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      setError('Please fix the password requirements below');
      setPasswordErrors(errors);
      setShowPasswordRequirements(true);
      setShowErrorToast(true);
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post('/api/register/', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        jurisdiction: formData.jurisdiction,
        staff_id: formData.staffId,
        rank: formData.rank,
        password: formData.password,
        password2: formData.confirmPassword   // ✅ ADDED THIS LINE
      });
      setSuccess(true);
      setShowSuccessToast(true);
      // Clear form on success
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        jurisdiction: '',
        staffId: '',
        rank: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      // Handle different error response formats
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.data) {
        // Handle field-specific errors
        if (typeof err.response.data === 'object') {
          const errorFields = Object.keys(err.response.data);
          if (errorFields.length > 0) {
            // Get the first error message
            const firstError = err.response.data[errorFields[0]];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else {
              errorMessage = firstError;
            }
          }
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      setSuccess(false);
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = passwordErrors.length === 0 && formData.password.length > 0;
  const isStaffIdValid = isValidStaffId(formData.staffId);
  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.phoneNumber && formData.jurisdiction && isStaffIdValid && 
                     formData.rank && isPasswordValid && formData.password === formData.confirmPassword;

  // Check individual password requirements
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  return (
    <Container className="d-flex vh-100 justify-content-center align-items-center auth-container">
      {/* Sticky Toast Container */}
      <ToastContainer 
        position="top-center" 
        className="p-3 position-fixed" 
        style={{ zIndex: 9999, top: '20px' }}
      >
        {/* Error Toast */}
        <Toast 
          show={showErrorToast} 
          onClose={() => setShowErrorToast(false)}
          delay={8000}
          autohide
          bg="danger"
        >
          <Toast.Header className="bg-danger text-white">
            <strong className="me-auto">Error</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {error}
          </Toast.Body>
        </Toast>

        {/* Success Toast */}
        <Toast 
          show={showSuccessToast} 
          onClose={() => setShowSuccessToast(false)}
          delay={5000}
          autohide
          bg="success"
        >
          <Toast.Header className="bg-success text-white">
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            Registration successful! Waiting for admin approval before login.
          </Toast.Body>
        </Toast>
      </ToastContainer>

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

            <Form onSubmit={handleRegister}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="auth-input"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="auth-input"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                />
              </Form.Group>

              {/* FLEXIBLE STAFF ID FIELD */}
              <Form.Group className="mb-3">
                <Form.Label>Police Staff ID *</Form.Label>
                <Form.Control
                  type="text"
                  name="staffId"
                  placeholder="XX-XXX-XXXXX"
                  value={formData.staffId}
                  onChange={handleStaffIdChange}
                  required
                  className="auth-input"
                  maxLength={13}
                  style={{ 
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                  }}
                  isInvalid={formData.staffId.length > 0 && !isStaffIdValid}
                />
                <Form.Text className="text-muted">
                  Format: XX-XXX-XXXXX or XX-XXXX-XXXXXX (e.g., KL-CST-98765, MH-INS-012345)
                </Form.Text>
                {formData.staffId.length > 0 && !isStaffIdValid && (
                  <Form.Text className="text-danger">
                    Must be in format: XX-XXX-XXXXX or XX-XXXX-XXXXXX
                  </Form.Text>
                )}
                {isStaffIdValid && (
                  <Form.Text className="text-success">
                    ✓ Valid Staff ID format
                  </Form.Text>
                )}
              </Form.Group>

              {/* RANK FIELD */}
              <Form.Group className="mb-3">
                <Form.Label>Rank *</Form.Label>
                <Form.Select
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                >
                  <option value="">Select your rank</option>
                  {rankOptions.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Jurisdiction (Google Maps Link) *</Form.Label>
                <Form.Control
                  type="url"
                  name="jurisdiction"
                  placeholder="Paste Google Maps link of your police station"
                  value={formData.jurisdiction}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                />
                <Form.Text className="text-muted">
                  Please provide the Google Maps link to your police station
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password *</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                  required
                  minLength={8}
                  className="auth-input"
                  isInvalid={formData.password.length > 0 && !isPasswordValid}
                />
                
                {showPasswordRequirements && (
                  <div className="mt-2">
                    <Form.Text className="text-muted">
                      Password must contain:
                    </Form.Text>
                    <div className="small text-muted mt-1">
                      <ul className="mb-1">
                        <li className={passwordChecks.length ? 'text-success' : ''}>
                          {passwordChecks.length ? '✓' : '•'} At least 8 characters
                        </li>
                        <li className={passwordChecks.uppercase ? 'text-success' : ''}>
                          {passwordChecks.uppercase ? '✓' : '•'} One uppercase letter
                        </li>
                        <li className={passwordChecks.lowercase ? 'text-success' : ''}>
                          {passwordChecks.lowercase ? '✓' : '•'} One lowercase letter
                        </li>
                        <li className={passwordChecks.number ? 'text-success' : ''}>
                          {passwordChecks.number ? '✓' : '•'} One number
                        </li>
                        <li className={passwordChecks.special ? 'text-success' : ''}>
                          {passwordChecks.special ? '✓' : '•'} One special character
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Confirm Password *</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                  isInvalid={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword}
                />
                {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                  <Form.Text className="text-danger">
                    Passwords do not match
                  </Form.Text>
                )}
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 py-2 fw-bold auth-button" 
                disabled={loading || !isFormValid}
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