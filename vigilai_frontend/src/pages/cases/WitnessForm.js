import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { fetchWitnesses, createWitness, updateWitness, deleteWitness } from './CaseService';

export default function WitnessForm({ caseId }) {
  const [witnesses, setWitnesses] = useState([]);
  const [formData, setFormData] = useState({
    case: caseId,
    name: '',
    statement: '',
    aadhaar_number: '',
    contact_info: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!caseId || caseId === "undefined") {
      console.warn("⚠️ Invalid caseId:", caseId);
      setError("Invalid case ID. Please reload or select a valid case.");
      setLoading(false);
      return;
    }
    loadWitnesses();
  }, [caseId]);

  const loadWitnesses = () => {
    setLoading(true);
    fetchWitnesses(caseId)
      .then(response => {
        setWitnesses(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading witnesses:', err);
        setError('Failed to load witnesses.');
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate caseId
    if (!caseId || caseId === "undefined") {
      setError("Invalid case ID. Please reload or select a valid case.");
      setSubmitting(false);
      return;
    }

    // Validate Aadhaar number if provided
    if (formData.aadhaar_number && !/^\d{12}$/.test(formData.aadhaar_number)) {
      setError('Aadhaar number must be exactly 12 digits.');
      setSubmitting(false);
      return;
    }

    // Validate contact info if provided
    if (formData.contact_info) {
      // Basic validation for email or phone number
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_info);
      const isPhone = /^[\+]?[1-9][\d]{0,15}$/.test(formData.contact_info.replace(/[\s\-\(\)]/g, ''));
      
      if (!isEmail && !isPhone) {
        setError('Contact info must be a valid email address or phone number.');
        setSubmitting(false);
        return;
      }
    }

    const request = editingId 
      ? updateWitness(editingId, formData)
      : createWitness(formData);

    request
      .then(() => {
        loadWitnesses();
        setFormData({ 
          case: caseId, 
          name: '', 
          statement: '', 
          aadhaar_number: '', 
          contact_info: '' 
        });
        setEditingId(null);
        setError(editingId ? 'Witness updated successfully!' : 'Witness added successfully!');
        setTimeout(() => setError(null), 3000);
      })
      .catch(err => {
        console.error('Error saving witness:', err);
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to save witness. Please try again.';
        setError(errorMessage);
      })
      .finally(() => setSubmitting(false));
  };

  const handleEdit = (item) => {
    setFormData({
      case: caseId,
      name: item.name,
      statement: item.statement,
      aadhaar_number: item.aadhaar_number || '',
      contact_info: item.contact_info || ''
    });
    setEditingId(item.id || item.witness_id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this witness?')) {
      deleteWitness(id)
        .then(() => {
          loadWitnesses();
          setError('Witness deleted successfully!');
          setTimeout(() => setError(null), 3000);
        })
        .catch(err => {
          console.error('Error deleting witness:', err);
          setError('Failed to delete witness.');
        });
    }
  };

  const resetForm = () => {
    setFormData({ 
      case: caseId, 
      name: '', 
      statement: '', 
      aadhaar_number: '', 
      contact_info: '' 
    });
    setEditingId(null);
  };

  const formatContactInfo = (contactInfo) => {
    if (!contactInfo) return 'N/A';
    
    // Check if it's an email
    if (contactInfo.includes('@')) {
      return contactInfo;
    }
    
    // Format phone number for display
    const cleaned = contactInfo.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}`;
    }
    
    return contactInfo;
  };

  if (!caseId || caseId === "undefined") {
    return (
      <Alert variant="warning" className="text-center">
        Invalid case ID. Please go back and select a valid case.
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading witnesses...</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className="mb-3">Witness Management</h5>
      
      {error && (
        <Alert variant={error.includes('success') ? 'success' : 'danger'}>
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">{editingId ? 'Edit Witness' : 'Add New Witness'}</h6>
            {editingId && (
              <Button variant="outline-secondary" size="sm" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    name="name"
                    type="text"
                    placeholder="Enter witness full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Aadhaar Number</Form.Label>
                  <Form.Control
                    name="aadhaar_number"
                    type="text"
                    placeholder="12-digit Aadhaar number"
                    value={formData.aadhaar_number}
                    onChange={handleChange}
                    maxLength={12}
                  />
                  <Form.Text className="text-muted">
                    Optional - 12 digits without spaces
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Information</Form.Label>
                  <Form.Control
                    name="contact_info"
                    type="text"
                    placeholder="Phone number or email address"
                    value={formData.contact_info}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Phone number or email address
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Statement *</Form.Label>
              <Form.Control
                name="statement"
                as="textarea"
                rows={4}
                value={formData.statement}
                onChange={handleChange}
                required
                placeholder="Enter detailed witness statement..."
              />
            </Form.Group>

            <Button type="submit" disabled={submitting} className="me-2">
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingId ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingId ? 'Update Witness' : 'Add Witness'
              )}
            </Button>
            
            {!editingId && (
              <Button variant="outline-secondary" onClick={resetForm}>
                Clear Form
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <h6 className="mb-3">Existing Witnesses</h6>
      {witnesses.length > 0 ? (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Aadhaar Number</th>
              <th>Contact Info</th>
              <th>Statement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {witnesses.map(item => (
              <tr key={item.id || item.witness_id}>
                <td>
                  <strong>{item.name}</strong>
                </td>
                <td>
                  {item.aadhaar_number ? (
                    <span className="font-monospace">{item.aadhaar_number}</span>
                  ) : (
                    <span className="text-muted">Not provided</span>
                  )}
                </td>
                <td>
                  {item.contact_info ? (
                    <div>
                      {formatContactInfo(item.contact_info)}
                      {item.contact_info.includes('@') && (
                        <div>
                          <small>
                            <a href={`mailto:${item.contact_info}`} className="text-decoration-none">
                              📧 Send Email
                            </a>
                          </small>
                        </div>
                      )}
                      {!item.contact_info.includes('@') && (
                        <div>
                          <small>
                            <a href={`tel:${item.contact_info}`} className="text-decoration-none">
                              📞 Call
                            </a>
                          </small>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">Not provided</span>
                  )}
                </td>
                <td>
                  <div style={{ maxWidth: '300px' }}>
                    {item.statement.length > 100 ? (
                      <>
                        {item.statement.substring(0, 100)}...
                        <br />
                        <small>
                          <button 
                            className="btn btn-link p-0 text-decoration-none"
                            onClick={() => alert(item.statement)}
                          >
                            View full statement
                          </button>
                        </small>
                      </>
                    ) : (
                      item.statement
                    )}
                  </div>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => handleDelete(item.id || item.witness_id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Card>
          <Card.Body className="text-center py-4">
            <p className="text-muted mb-0">No witnesses added yet for this case.</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}