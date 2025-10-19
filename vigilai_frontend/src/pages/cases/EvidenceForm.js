import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Spinner, Card } from 'react-bootstrap';
import { fetchEvidence, createEvidence, updateEvidence, deleteEvidence } from './CaseService';

export default function EvidenceForm({ caseId }) {
  const [evidence, setEvidence] = useState([]);
  const [formData, setFormData] = useState({
    case: caseId,
    type_of_evidence: '',
    details: '',
    file: null
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
    loadEvidence();
  }, [caseId]);

  const loadEvidence = () => {
    setLoading(true);
    fetchEvidence(caseId)
      .then(response => {
        // Make sure we're getting the data in the correct format
        const evidenceData = Array.isArray(response.data) ? response.data : 
                           (response.data.results || response.data.evidence || []);
        setEvidence(evidenceData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading evidence:', err);
        setError('Failed to load evidence.');
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
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

    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('case', caseId);
    formDataToSend.append('type_of_evidence', formData.type_of_evidence);
    formDataToSend.append('details', formData.details);
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };

    const request = editingId 
      ? updateEvidence(editingId, formDataToSend, config)
      : createEvidence(formDataToSend, config);

    request
      .then(() => {
        loadEvidence();
        setFormData({ case: caseId, type_of_evidence: '', details: '', file: null });
        setEditingId(null);
        setError(editingId ? 'Evidence updated successfully!' : 'Evidence added successfully!');
        setTimeout(() => setError(null), 3000);
      })
      .catch(err => {
        console.error('Error saving evidence:', err);
        setError(err.response?.data?.message || 'Failed to save evidence. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleEdit = (item) => {
    setFormData({
      case: caseId,
      type_of_evidence: item.type_of_evidence,
      details: item.details,
      file: null
    });
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this evidence?')) {
      deleteEvidence(id)
        .then(() => {
          loadEvidence();
          setError('Evidence deleted successfully!');
          setTimeout(() => setError(null), 3000);
        })
        .catch(err => {
          console.error('Error deleting evidence:', err);
          setError('Failed to delete evidence.');
        });
    }
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
        <p className="mt-2 text-muted">Loading evidence...</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className="mb-3">Evidence Management</h5>
      
      {error && (
        <Alert variant={error.includes('success') ? 'success' : 'danger'}>
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <h6 className="mb-3">{editingId ? 'Edit Evidence' : 'Add New Evidence'}</h6>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Type of Evidence *</Form.Label>
              <Form.Control
                name="type_of_evidence"
                value={formData.type_of_evidence}
                onChange={handleChange}
                required
                placeholder="e.g., Fingerprint, Weapon, Document, etc."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Details *</Form.Label>
              <Form.Control
                name="details"
                as="textarea"
                rows={3}
                value={formData.details}
                onChange={handleChange}
                required
                placeholder="Enter evidence details"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>File Upload (Optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
              />
            </Form.Group>
            <Button type="submit" disabled={submitting} className="me-2">
              {submitting ? 'Saving...' : editingId ? 'Update Evidence' : 'Add Evidence'}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={() => setEditingId(null)}>
                Cancel Edit
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <h6 className="mb-3">Existing Evidence</h6>
      {evidence.length > 0 ? (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>Type of Evidence</th>
              <th>Details</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map(item => (
              <tr key={item.id}>
                <td>{item.type_of_evidence}</td>
                <td>{item.details}</td>
                <td>
                  {item.file ? (
                    <a href={item.file} target="_blank" rel="noopener noreferrer">
                      View File
                    </a>
                  ) : (
                    'No file'
                  )}
                </td>
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
        <p className="text-muted">No evidence added yet.</p>
      )}
    </div>
  );
}