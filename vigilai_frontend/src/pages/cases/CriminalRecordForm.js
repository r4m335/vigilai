// src/cases/CriminalRecordForm.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Spinner, Card } from 'react-bootstrap';
import { fetchCriminalRecords, createCriminalRecord, updateCriminalRecord, deleteCriminalRecord } from './CaseService';

export default function CriminalRecordForm({ caseId }) {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    case_id: caseId,
    details: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const request = editingId 
      ? updateCriminalRecord(editingId, formData)
      : createCriminalRecord(formData);

    request
      .then(() => {
        loadRecords();
        setFormData({ case_id: caseId, details: '' });
        setEditingId(null);
        setError(editingId ? 'Criminal record updated successfully!' : 'Criminal record added successfully!');
        setTimeout(() => setError(null), 3000);
      })
      .catch(err => {
        console.error('Error saving criminal record:', err);
        setError('Failed to save criminal record. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleEdit = (item) => {
    setFormData({
      case_id: caseId,
      details: item.details
    });
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
            <Form.Group className="mb-3">
              <Form.Label>Details of Past Offense</Form.Label>
              <Form.Control
                name="details"
                as="textarea"
                rows={4}
                value={formData.details}
                onChange={handleChange}
                required
                placeholder="Enter details of past offenses"
              />
            </Form.Group>
            <Button type="submit" disabled={submitting} className="me-2">
              {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Add Record'}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={() => setEditingId(null)}>
                Cancel Edit
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <h6 className="mb-3">Existing Criminal Records</h6>
      {records.length > 0 ? (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>Details of Past Offense</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(item => (
              <tr key={item.id}>
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
        <p className="text-muted">No criminal records added yet.</p>
      )}
    </div>
  );
}