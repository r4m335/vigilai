// src/cases/WitnessForm.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Spinner, Card } from 'react-bootstrap';
import { fetchWitnesses, createWitness, updateWitness, deleteWitness } from './CaseService';

export default function WitnessForm({ caseId }) {
  const [witnesses, setWitnesses] = useState([]);
  const [formData, setFormData] = useState({
    case: caseId,
    name: '',
    statement: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
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

    const request = editingId 
      ? updateWitness(editingId, formData)
      : createWitness(formData);

    request
      .then(() => {
        loadWitnesses();
        setFormData({ case: caseId, name: '', statement: '' });
        setEditingId(null);
        setError(editingId ? 'Witness updated successfully!' : 'Witness added successfully!');
        setTimeout(() => setError(null), 3000);
      })
      .catch(err => {
        console.error('Error saving witness:', err);
        setError(err.response?.data?.message || 'Failed to save witness. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleEdit = (item) => {
    setFormData({
      case: caseId,
      name: item.name,
      statement: item.statement
    });
    setEditingId(item.id);
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
          <h6 className="mb-3">{editingId ? 'Edit Witness' : 'Add New Witness'}</h6>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                name="name"
                type="text"
                placeholder="Enter witness name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Statement *</Form.Label>
              <Form.Control
                name="statement"
                as="textarea"
                rows={4}
                value={formData.statement}
                onChange={handleChange}
                required
                placeholder="Enter witness statement"
              />
            </Form.Group>
            <Button type="submit" disabled={submitting} className="me-2">
              {submitting ? 'Saving...' : editingId ? 'Update Witness' : 'Add Witness'}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={() => setEditingId(null)}>
                Cancel Edit
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
              <th>Statement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {witnesses.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.statement}</td>
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
        <p className="text-muted">No witnesses added yet.</p>
      )}
    </div>
  );
}