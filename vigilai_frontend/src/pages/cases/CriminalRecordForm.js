import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Table, 
  Alert, 
  Spinner, 
  Card, 
  Image, 
  Row, 
  Col 
} from 'react-bootstrap';
import { fetchCriminalRecords, createCriminalRecord, updateCriminalRecord, deleteCriminalRecord } from './CaseService';

export default function CriminalRecordForm({ caseId }) {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    case: caseId,
    person_name: '',
    age: '',
    gender: '',
    district: '',
    offenses: '',
    photo: null
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  const districtOptions = Array.from({ length: 14 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `District ${i + 1}`
  }));

  useEffect(() => {
    if (!caseId || caseId === "undefined") {
      console.warn("⚠️ Invalid caseId:", caseId);
      setError("Invalid case ID. Please reload or select a valid case.");
      setLoading(false);
      return;
    }
    loadRecords();
  }, [caseId]);

  const loadRecords = () => {
    setLoading(true);
    fetchCriminalRecords(caseId)
      .then(response => {
        setRecords(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading criminal records:', err);
        setError('Failed to load criminal records.');
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
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

    // Validate district
    if (formData.district && (parseInt(formData.district) < 1 || parseInt(formData.district) > 14)) {
      setError('District must be between 1 and 14.');
      setSubmitting(false);
      return;
    }

    // Validate age
    if (formData.age && (parseInt(formData.age) < 10 || parseInt(formData.age) > 120)) {
      setError('Age must be between 10 and 120.');
      setSubmitting(false);
      return;
    }

    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('case', caseId);
    formDataToSend.append('person_name', formData.person_name);
    formDataToSend.append('offenses', formData.offenses);
    
    // Add optional fields if they have values
    if (formData.age) formDataToSend.append('age', formData.age);
    if (formData.gender) formDataToSend.append('gender', formData.gender);
    if (formData.district) formDataToSend.append('district', formData.district);
    
    if (formData.photo) {
      formDataToSend.append('photo', formData.photo);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };

    const request = editingId 
      ? updateCriminalRecord(editingId, formDataToSend, config)
      : createCriminalRecord(formDataToSend, config);

    request
      .then(() => {
        loadRecords();
        setFormData({ 
          case: caseId, 
          person_name: '', 
          age: '', 
          gender: '', 
          district: '', 
          offenses: '', 
          photo: null 
        });
        setPhotoPreview(null);
        setEditingId(null);
        setError(editingId ? 'Criminal record updated successfully!' : 'Criminal record added successfully!');
        setTimeout(() => setError(null), 3000);
      })
      .catch(err => {
        console.error('Error saving criminal record:', err);
        setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to save criminal record. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleEdit = (item) => {
    setFormData({
      case: caseId,
      person_name: item.person_name,
      age: item.age || '',
      gender: item.gender || '',
      district: item.district || '',
      offenses: item.offenses,
      photo: null
    });
    setPhotoPreview(item.photo || null);
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this criminal record?')) {
      deleteCriminalRecord(id)
        .then(() => {
          loadRecords();
          setError('Criminal record deleted successfully!');
          setTimeout(() => setError(null), 3000);
        })
        .catch(err => {
          console.error('Error deleting criminal record:', err);
          setError('Failed to delete criminal record.');
        });
    }
  };

  const handleCancelEdit = () => {
    setFormData({ 
      case: caseId, 
      person_name: '', 
      age: '', 
      gender: '', 
      district: '', 
      offenses: '', 
      photo: null 
    });
    setPhotoPreview(null);
    setEditingId(null);
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
        <p className="mt-2 text-muted">Loading criminal records...</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className="mb-3">Criminal Record Management</h5>
      
      {error && (
        <Alert variant={error.includes('success') ? 'success' : 'danger'}>
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <h6 className="mb-3">{editingId ? 'Edit Criminal Record' : 'Add New Criminal Record'}</h6>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Person Name *</Form.Label>
                  <Form.Control
                    name="person_name"
                    type="text"
                    placeholder="Enter person name"
                    value={formData.person_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age (Optional)</Form.Label>
                  <Form.Control
                    name="age"
                    type="number"
                    placeholder="Enter age (10-120)"
                    value={formData.age}
                    onChange={handleChange}
                    min="10"
                    max="120"
                  />
                  <Form.Text className="text-muted">
                    Age must be between 10 and 120
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender (Optional)</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>District (Optional)</Form.Label>
                  <Form.Select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                  >
                    <option value="">Select District</option>
                    {districtOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    District must be between 1 and 14
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Photo (Optional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <Form.Text className="text-muted">
                    Upload an image of the criminal
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                {photoPreview && (
                  <div className="mb-3">
                    <Form.Label>Photo Preview:</Form.Label>
                    <div>
                      <Image 
                        src={photoPreview} 
                        alt="Preview" 
                        fluid 
                        style={{ maxHeight: '200px', maxWidth: '100%' }}
                        className="border rounded"
                      />
                    </div>
                  </div>
                )}
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Offenses *</Form.Label>
              <Form.Control
                name="offenses"
                as="textarea"
                rows={4}
                value={formData.offenses}
                onChange={handleChange}
                required
                placeholder="Enter details of offenses"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Add Record'}
              </Button>
              {editingId && (
                <Button variant="secondary" onClick={handleCancelEdit}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      <h6 className="mb-3">Existing Criminal Records</h6>
      {records.length > 0 ? (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Person Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>District</th>
              <th>Offenses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(item => (
              <tr key={item.id}>
                <td>
                  {item.photo ? (
                    <Image 
                      src={item.photo} 
                      alt={item.person_name}
                      fluid 
                      style={{ maxHeight: '80px', maxWidth: '80px' }}
                      className="border rounded"
                    />
                  ) : (
                    <div className="text-muted">No photo</div>
                  )}
                </td>
                <td>{item.person_name}</td>
                <td>{item.age || 'N/A'}</td>
                <td>{item.gender || 'N/A'}</td>
                <td>{item.district ? `District ${item.district}` : 'N/A'}</td>
                <td>{item.offenses}</td>
                <td>
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
                    Edit
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No criminal records added yet.</p>
      )}
    </div>
  );
}