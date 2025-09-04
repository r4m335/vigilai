// src/cases/EvidenceForm.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Spinner, Card } from 'react-bootstrap';
import { fetchEvidence, createEvidence, updateEvidence, deleteEvidence } from './CaseService';

export default function EvidenceForm({ caseId }) {
  const [evidence, setEvidence] = useState([]);
  const [formData, setFormData] = useState({
    case_id: caseId,
    type_of_crime: '',
    details: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadEvidence();
  }, [caseId]);

  const loadEvidence = () => {
    setLoading(true);
    fetchEvidence(caseId)
      .then(response => {
        setEvidence(response.data);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const request = editingId 
      ? updateEvidence(editingId, formData)
      : createEvidence(formData);

    request
      .then(() => {
        loadEvidence();
        setFormData({ case_id: caseId, type_of_crime: '', details: '' });
        setEditingId(null);
        setError(editingId ? 'Evidence updated successfully!' : 'Evidence added successfully!');
        setTimeout(() => setError(null), 3000);
      })
      .catch(err => {
        console.error('Error saving evidence:', err);
        setError('Failed to save evidence. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleEdit = (item) => {
    setFormData({
      case_id: caseId,
      type_of_crime: item.type_of_crime,
      details: item.details
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
              <Form.Label>Type of Crime</Form.Label>
              <Form.Control
                name="type_of_crime"
                value={formData.type_of_crime}
                onChange={handleChange}
                required
                placeholder="e.g., Burglary, Assault, etc."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Details</Form.Label>
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
              <th>Type of Crime</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map(item => (
              <tr key={item.id}>
                <td>{item.type_of_crime}</td>
                <td>{item.details}</td>
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