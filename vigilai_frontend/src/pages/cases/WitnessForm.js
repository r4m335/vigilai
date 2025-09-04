// src/cases/WitnessForm.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Spinner, Card } from 'react-bootstrap';
import { fetchWitnesses, createWitness, updateWitness, deleteWitness } from './CaseService';

export default function WitnessForm({ caseId }) {
  const [witnesses, setWitnesses] = useState([]);
  const [formData, setFormData] = useState({
    case_id: caseId,
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
        setFormData({ case_id: caseId, statement: '' });
        setEditingId(null);
        setError(editingId ? 'Witness statement updated successfully!' : 'Witness statement added successfully!');
        setTimeout(() => setError(null), 3000);
      })
      .catch(err => {
        console.error('Error saving witness:', err);
        setError('Failed to save witness statement. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleEdit = (item) => {
    setFormData({
      case_id: caseId,
      statement: item.statement
    });
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this witness statement?')) {
      deleteWitness(id)
        .then(() => {
          loadWitnesses();
          setError('Witness statement deleted successfully!');
          setTimeout(() => setError(null), 3000);
        })
        .catch(err => {
          console.error('Error deleting witness:', err);
          setError('Failed to delete witness statement.');
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
          <h6 className="mb-3">{editingId ? 'Edit Witness Statement' : 'Add New Witness Statement'}</h6>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Statement</Form.Label>
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
              {submitting ? 'Saving...' : editingId ? 'Update Statement' : 'Add Statement'}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={() => setEditingId(null)}>
                Cancel Edit
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <h6 className="mb-3">Existing Witness Statements</h6>
      {witnesses.length > 0 ? (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>Statement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {witnesses.map(item => (
              <tr key={item.id}>
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
        <p className="text-muted">No witness statements added yet.</p>
      )}
    </div>
  );
}