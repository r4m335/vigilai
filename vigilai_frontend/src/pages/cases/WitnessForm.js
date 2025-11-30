import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, Badge } from 'react-bootstrap';
import { fetchWitnesses, createWitness, updateWitness, deleteWitness } from './CaseService';

export default function WitnessForm({ caseId }) {
  const [witnesses, setWitnesses] = useState([]);
  const [formData, setFormData] = useState({
    case: caseId,
    name: '',
    statement: null, // Changed from string to File object
    aadhaar_number: '',
    contact_info: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [statementPreview, setStatementPreview] = useState(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'video/mp4', 'video/avi', 'video/mov', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid audio or video file (MP3, WAV, MP4, AVI, MOV, WebM).');
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size should be less than 50MB.');
        return;
      }

      setFormData(prev => ({ ...prev, statement: file }));

      // Create preview for audio/video
      const url = URL.createObjectURL(file);
      setStatementPreview({
        url: url,
        type: file.type.startsWith('audio') ? 'audio' : 'video',
        name: file.name
      });
    }
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

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Witness name is required.');
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
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_info);
      const isPhone = /^[\+]?[1-9][\d]{0,15}$/.test(formData.contact_info.replace(/[\s\-\(\)]/g, ''));
      
      if (!isEmail && !isPhone) {
        setError('Contact info must be a valid email address or phone number.');
        setSubmitting(false);
        return;
      }
    }

    // Validate statement file for new witnesses
    if (!editingId && !formData.statement) {
      setError('Statement file (audio/video) is required for new witnesses.');
      setSubmitting(false);
      return;
    }

    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('case', caseId);
    submitData.append('name', formData.name.trim());
    submitData.append('aadhaar_number', formData.aadhaar_number);
    submitData.append('contact_info', formData.contact_info);
    
    if (formData.statement) {
      submitData.append('statement', formData.statement);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };

    const request = editingId 
      ? updateWitness(editingId, submitData, config)
      : createWitness(submitData, config);

    request
      .then(() => {
        loadWitnesses();
        resetForm();
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
      statement: null, // Reset file input when editing
      aadhaar_number: item.aadhaar_number || '',
      contact_info: item.contact_info || ''
    });
    setStatementPreview(null);
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
      statement: null, 
      aadhaar_number: '', 
      contact_info: '' 
    });
    setStatementPreview(null);
    setEditingId(null);
  };

  const formatContactInfo = (contactInfo) => {
    if (!contactInfo) return 'N/A';
    
    if (contactInfo.includes('@')) {
      return contactInfo;
    }
    
    const cleaned = contactInfo.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}`;
    }
    
    return contactInfo;
  };

  const getFileType = (filename) => {
    if (!filename) return 'Unknown';
    const ext = filename.split('.').pop().toLowerCase();
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return 'audio';
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(ext)) return 'video';
    return 'unknown';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Statement {!editingId && '*'}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                    required={!editingId}
                  />
                  <Form.Text className="text-muted">
                    Upload audio or video recording (MP3, WAV, MP4, AVI, MOV, WebM, max 50MB)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* File Preview */}
            {statementPreview && (
              <Row>
                <Col md={12}>
                  <Card className="mb-3">
                    <Card.Header>
                      <strong>File Preview:</strong> {statementPreview.name}
                    </Card.Header>
                    <Card.Body>
                      {statementPreview.type === 'audio' ? (
                        <div>
                          <audio controls className="w-100">
                            <source src={statementPreview.url} type={formData.statement?.type} />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : (
                        <div>
                          <video controls className="w-100" style={{ maxHeight: '300px' }}>
                            <source src={statementPreview.url} type={formData.statement?.type} />
                            Your browser does not support the video element.
                          </video>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

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
              <th>Statement File</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {witnesses.map(item => {
              const fileType = getFileType(item.statement);
              const fileName = item.statement ? item.statement.split('/').pop() : 'No file';
              
              return (
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
                    {item.statement ? (
                      <div>
                        <Badge 
                          bg={fileType === 'audio' ? 'info' : fileType === 'video' ? 'primary' : 'secondary'}
                          className="mb-1"
                        >
                          {fileType.toUpperCase()}
                        </Badge>
                        <div>
                          <small>{fileName}</small>
                        </div>
                        <div>
                          <a 
                            href={item.statement} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary mt-1"
                          >
                            {fileType === 'audio' ? '🎵 Play' : fileType === 'video' ? '🎥 Play' : '📄 View'}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">No statement file</span>
                    )}
                  </td>
                  <td>
                    {item.created_at ? (
                      <small>{new Date(item.created_at).toLocaleDateString()}</small>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
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
              );
            })}
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