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
  Col,
  Modal,
  Badge,
  InputGroup,
  Tabs,
  Tab
} from 'react-bootstrap';
import { fetchCriminalRecords, createCriminalRecord, updateCriminalRecord, deleteCriminalRecord } from './CaseService';
import { getToken } from './services/Authservice';

export default function CriminalRecordForm({ caseId }) {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    case: caseId,
    suspect: '', // Criminal ID (if existing)
    criminal_name: '',
    criminal_age: '',
    criminal_gender: '',
    criminal_district: '',
    aadhaar_number: '',
    photo: null,
    offenses: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Criminal search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

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
        const recordsData = Array.isArray(response.data) ? response.data : 
                           (response.data.results || response.data.criminal_records || []);
        setRecords(recordsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading criminal records:', err);
        setError('Failed to load criminal records.');
        setLoading(false);
      });
  };

  // Search criminals by name or Aadhaar
  const searchCriminals = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/criminals/search/?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else if (response.status === 404) {
        setSearchResults([]);
      } else {
        throw new Error(`Search failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Error searching criminals:', err);
      setError('Failed to search criminals. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchCriminals();
  };

  const selectCriminal = (criminal) => {
    setFormData({
      ...formData,
      suspect: criminal.criminal_id,
      criminal_name: criminal.criminal_name,
      criminal_age: criminal.criminal_age || '',
      criminal_gender: criminal.criminal_gender || '',
      criminal_district: criminal.criminal_district || '',
      aadhaar_number: criminal.aadhaar_number || ''
    });
    setPhotoPreview(criminal.photo || null);
    setShowSearchModal(false);
    setSearchTerm('');
    setSearchResults([]);
    
    setError(`✅ Selected criminal: ${criminal.criminal_name}`);
    setTimeout(() => setError(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB.');
        return;
      }

      setFormData(prev => ({ ...prev, photo: file }));
      
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

    if (!caseId || caseId === "undefined") {
      setError("Invalid case ID. Please reload or select a valid case.");
      setSubmitting(false);
      return;
    }

    // Validation
    if (!formData.criminal_name.trim()) {
      setError('Criminal name is required.');
      setSubmitting(false);
      return;
    }

    if (!formData.offenses.trim()) {
      setError('Offenses description is required.');
      setSubmitting(false);
      return;
    }

    if (formData.aadhaar_number && !/^\d{12}$/.test(formData.aadhaar_number)) {
      setError('Aadhaar number must be exactly 12 digits.');
      setSubmitting(false);
      return;
    }

    if (formData.criminal_district && (parseInt(formData.criminal_district) < 1 || parseInt(formData.criminal_district) > 14)) {
      setError('District must be between 1 and 14.');
      setSubmitting(false);
      return;
    }

    if (formData.criminal_age && (parseInt(formData.criminal_age) < 10 || parseInt(formData.criminal_age) > 120)) {
      setError('Age must be between 10 and 120.');
      setSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('case', caseId);
    formDataToSend.append('offenses', formData.offenses.trim());
    
    if (formData.suspect) {
      // Using existing criminal
      formDataToSend.append('suspect', formData.suspect);
    } else {
      // Creating new criminal
      formDataToSend.append('criminal_name', formData.criminal_name.trim());
      if (formData.criminal_age) formDataToSend.append('criminal_age', formData.criminal_age);
      if (formData.criminal_gender) formDataToSend.append('criminal_gender', formData.criminal_gender);
      if (formData.criminal_district) formDataToSend.append('criminal_district', formData.criminal_district);
      if (formData.aadhaar_number) formDataToSend.append('aadhaar_number', formData.aadhaar_number);
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }
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
      .then((response) => {
        loadRecords();
        resetForm();
        const successMessage = editingId 
          ? 'Criminal record updated successfully!' 
          : formData.suspect 
            ? 'Criminal record linked successfully!' 
            : 'New criminal record created successfully!';
        setError(`✅ ${successMessage}`);
        setTimeout(() => setError(null), 4000);
      })
      .catch(err => {
        console.error('Error saving criminal record:', err);
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to save criminal record. Please try again.';
        setError(`❌ ${errorMessage}`);
      })
      .finally(() => setSubmitting(false));
  };

  const resetForm = () => {
    setFormData({ 
      case: caseId,
      suspect: '',
      criminal_name: '',
      criminal_age: '', 
      criminal_gender: '', 
      criminal_district: '', 
      aadhaar_number: '',
      photo: null,
      offenses: ''
    });
    setPhotoPreview(null);
    setEditingId(null);
    setSearchTerm('');
    setSearchResults([]);
    setActiveTab('search');
  };

  const handleEdit = (item) => {
    const suspectInfo = getSuspectDisplayInfo(item);
    setFormData({
      case: caseId,
      suspect: item.suspect?.criminal_id || '',
      criminal_name: suspectInfo.criminal_name,
      criminal_age: suspectInfo.criminal_age || '',
      criminal_gender: suspectInfo.criminal_gender || '',
      criminal_district: suspectInfo.criminal_district || '',
      aadhaar_number: suspectInfo.aadhaar_number || '',
      photo: null,
      offenses: item.offenses
    });
    
    setPhotoPreview(suspectInfo.photo || null);
    setEditingId(item.record_id || item.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this criminal record?')) {
      deleteCriminalRecord(id)
        .then(() => {
          loadRecords();
          setError('✅ Criminal record deleted successfully!');
          setTimeout(() => setError(null), 3000);
        })
        .catch(err => {
          console.error('Error deleting criminal record:', err);
          setError('❌ Failed to delete criminal record.');
        });
    }
  };

  const getSuspectDisplayInfo = (record) => {
    if (record.suspect) {
      return {
        criminal_name: record.suspect.criminal_name,
        criminal_age: record.suspect.criminal_age,
        criminal_gender: record.suspect.criminal_gender,
        criminal_district: record.suspect.criminal_district,
        photo: record.suspect.photo,
        aadhaar_number: record.suspect.aadhaar_number
      };
    }
    return record;
  };

  const openSearchModal = () => {
    setShowSearchModal(true);
    setSearchTerm('');
    setSearchResults([]);
  };

  const createNewCriminal = () => {
    setFormData(prev => ({
      ...prev,
      criminal_name: searchTerm,
      suspect: '' // Clear suspect ID for new criminal
    }));
    setShowSearchModal(false);
    setActiveTab('create');
    setError(`✏️ Creating new criminal: ${searchTerm}`);
    setTimeout(() => setError(null), 3000);
  };

  // Auto-search when typing in search modal
  useEffect(() => {
    if (showSearchModal && searchTerm.length > 2) {
      const delaySearch = setTimeout(() => {
        searchCriminals();
      }, 500);
      
      return () => clearTimeout(delaySearch);
    }
  }, [searchTerm, showSearchModal]);

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
        <Alert variant={error.includes('✅') || error.includes('✏️') ? 'success' : 'danger'}>
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <h6 className="mb-3">{editingId ? 'Edit Criminal Record' : 'Add New Criminal Record'}</h6>
          
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="search" title="🔍 Search Existing Criminal">
              <div className="p-3 border rounded bg-light">
                <h6 className="mb-3">
                  {formData.suspect ? '✅ Criminal Selected' : 'Search Existing Criminal'}
                  {formData.suspect && (
                    <Badge bg="success" className="ms-2">
                      Linked: {formData.criminal_name}
                    </Badge>
                  )}
                </h6>
                <Row>
                  <Col md={8}>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search by name or Aadhaar number..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                      />
                      <Button variant="primary" onClick={handleSearchSubmit} disabled={searching}>
                        {searching ? <Spinner animation="border" size="sm" /> : 'Search'}
                      </Button>
                    </InputGroup>
                  </Col>
                  <Col md={4}>
                    <Button variant="outline-secondary" onClick={openSearchModal}>
                      🔍 Advanced Search
                    </Button>
                    {formData.suspect && (
                      <Button 
                        variant="outline-warning" 
                        className="ms-2"
                        onClick={() => setFormData(prev => ({ ...prev, suspect: '' }))}
                      >
                        Change Criminal
                      </Button>
                    )}
                  </Col>
                </Row>

                {/* Quick Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3">
                    <h6 className="text-muted">Quick Results ({searchResults.length} found):</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {searchResults.slice(0, 3).map(criminal => (
                        <Card key={criminal.criminal_id} style={{ width: '200px' }} className="shadow-sm">
                          <Card.Body className="p-2">
                            <div className="d-flex align-items-center">
                              {criminal.photo && (
                                <Image 
                                  src={criminal.photo} 
                                  alt={criminal.criminal_name}
                                  fluid 
                                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                  className="rounded me-2"
                                />
                              )}
                              <div className="flex-grow-1">
                                <strong className="d-block">{criminal.criminal_name}</strong>
                                <small className="text-muted">
                                  {criminal.aadhaar_number ? `Aadhaar: ${criminal.aadhaar_number}` : 'No Aadhaar'}
                                </small>
                                {criminal.criminal_age && (
                                  <small className="d-block">Age: {criminal.criminal_age}</small>
                                )}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              className="w-100 mt-2"
                              onClick={() => selectCriminal(criminal)}
                            >
                              Select
                            </Button>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && !searching && (
                  <div className="mt-3">
                    <Alert variant="info" className="py-2 d-flex justify-content-between align-items-center">
                      <span>No criminals found matching "{searchTerm}"</span>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={createNewCriminal}
                      >
                        Create New Criminal
                      </Button>
                    </Alert>
                  </div>
                )}
              </div>
            </Tab>

            <Tab eventKey="create" title="👤 Create New Criminal">
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Criminal Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="criminal_name"
                        value={formData.criminal_name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Aadhaar Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="aadhaar_number"
                        value={formData.aadhaar_number}
                        onChange={handleChange}
                        placeholder="12-digit Aadhaar number"
                        maxLength={12}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age</Form.Label>
                      <Form.Control
                        type="number"
                        name="criminal_age"
                        value={formData.criminal_age}
                        onChange={handleChange}
                        placeholder="Age"
                        min="10"
                        max="120"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <Form.Select
                        name="criminal_gender"
                        value={formData.criminal_gender}
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
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>District</Form.Label>
                      <Form.Select
                        name="criminal_district"
                        value={formData.criminal_district}
                        onChange={handleChange}
                      >
                        {districtOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  {photoPreview && (
                    <div className="mt-2">
                      <Image 
                        src={photoPreview} 
                        alt="Preview" 
                        fluid 
                        style={{ maxHeight: '150px' }}
                        className="rounded border"
                      />
                    </div>
                  )}
                </Form.Group>
              </Form>
            </Tab>
          </Tabs>

          {/* Offenses Section - Always visible */}
          <Form.Group className="mb-3">
            <Form.Label>Offenses Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="offenses"
              value={formData.offenses}
              onChange={handleChange}
              placeholder="Describe the offenses committed by this criminal in detail..."
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-between">
            {editingId ? (
              <>
                <Button variant="outline-secondary" onClick={resetForm}>
                  Cancel Edit
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Record'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline-secondary" onClick={resetForm}>
                  Reset Form
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Criminal Record'}
                </Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Criminal Search Modal */}
      <Modal show={showSearchModal} onHide={() => setShowSearchModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>🔍 Search Criminal Database</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSearchSubmit}>
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                placeholder="Enter criminal name or Aadhaar number (min 3 characters)..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
              />
              <Button variant="primary" type="submit" disabled={searching}>
                {searching ? <Spinner animation="border" size="sm" /> : 'Search'}
              </Button>
            </InputGroup>
          </Form>

          {searching && (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Searching criminals database...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              <h6>Search Results ({searchResults.length} criminals found)</h6>
              <div className="table-responsive">
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Aadhaar</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>District</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map(criminal => (
                      <tr key={criminal.criminal_id}>
                        <td>
                          {criminal.photo ? (
                            <Image 
                              src={criminal.photo} 
                              alt={criminal.criminal_name}
                              fluid 
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              className="rounded"
                            />
                          ) : (
                            <div className="text-muted">No photo</div>
                          )}
                        </td>
                        <td>
                          <strong>{criminal.criminal_name}</strong>
                        </td>
                        <td>{criminal.aadhaar_number || 'N/A'}</td>
                        <td>{criminal.criminal_age || 'N/A'}</td>
                        <td>{criminal.criminal_gender || 'N/A'}</td>
                        <td>{criminal.criminal_district ? `District ${criminal.criminal_district}` : 'N/A'}</td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => selectCriminal(criminal)}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !searching && (
            <Alert variant="info" className="text-center">
              <p>No criminals found matching "{searchTerm}"</p>
              <Button variant="primary" onClick={createNewCriminal}>
                Create New Criminal Record
              </Button>
            </Alert>
          )}
        </Modal.Body>
      </Modal>

      {/* Existing Criminal Records Table - Like EvidenceForm */}
      <h6 className="mb-3">Existing Criminal Records</h6>
      {records.length > 0 ? (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Aadhaar</th>
              <th>Age</th>
              <th>Gender</th>
              <th>District</th>
              <th>Offenses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => {
              const suspectInfo = getSuspectDisplayInfo(record);
              return (
                <tr key={record.record_id || record.id}>
                  <td>
                    {suspectInfo.photo ? (
                      <Image 
                        src={suspectInfo.photo} 
                        alt={suspectInfo.criminal_name}
                        fluid 
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        className="rounded"
                      />
                    ) : (
                      <div className="text-muted">No photo</div>
                    )}
                  </td>
                  <td>
                    <strong>{suspectInfo.criminal_name}</strong>
                    {record.suspect && (
                      <Badge bg="success" className="ms-1" title="Linked from database">
                        DB
                      </Badge>
                    )}
                  </td>
                  <td>{suspectInfo.aadhaar_number || 'N/A'}</td>
                  <td>{suspectInfo.criminal_age || 'N/A'}</td>
                  <td>{suspectInfo.criminal_gender || 'N/A'}</td>
                  <td>
                    {suspectInfo.criminal_district ? `District ${suspectInfo.criminal_district}` : 'N/A'}
                  </td>
                  <td>
                    <small title={record.offenses}>
                      {record.offenses.length > 50 
                        ? `${record.offenses.substring(0, 50)}...` 
                        : record.offenses}
                    </small>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => handleEdit(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(record.record_id || record.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No criminal records added yet.</p>
      )}
    </div>
  );
}