import React, { useState, useEffect } from 'react';
import { 
  Container, Table, Spinner, Alert, Card, Row, Col, Navbar, 
  Button, Badge, Image, Form, InputGroup, Modal 
} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { 
  fetchCases, 
  deleteCase, 
  fetchEvidence, 
  fetchWitnesses, 
  fetchCriminalRecords 
} from './CaseService';
import { logout, getToken, isAdmin, getCurrentUser } from './services/Authservice';
import NotificationService from './services/NotificationService';
import 'bootstrap/dist/css/bootstrap.min.css';

// Kerala districts array with fixed order (same as CriminalSearchPage)
const KERALA_DISTRICTS = [
  { id: 1, name: 'Thiruvananthapuram' },
  { id: 2, name: 'Kollam' },
  { id: 3, name: 'Pathanamthitta' },
  { id: 4, name: 'Alappuzha' },
  { id: 5, name: 'Kottayam' },
  { id: 6, name: 'Idukki' },
  { id: 7, name: 'Ernakulam' },
  { id: 8, name: 'Thrissur' },
  { id: 9, name: 'Palakkad' },
  { id: 10, name: 'Malappuram' },
  { id: 11, name: 'Kozhikode' },
  { id: 12, name: 'Wayanad' },
  { id: 13, name: 'Kannur' },
  { id: 14, name: 'Kasaragod' }
];

// Function to get district name by ID
const getDistrictName = (districtId) => {
  if (!districtId && districtId !== 0) return 'N/A';
  
  // Handle numeric strings
  const id = parseInt(districtId);
  if (isNaN(id)) return `District ${districtId}`;
  
  const district = KERALA_DISTRICTS.find(d => d.id === id);
  return district ? district.name : `District ${id}`;
};

// Function to get district ID by name
const getDistrictId = (districtName) => {
  if (!districtName) return null;
  
  const district = KERALA_DISTRICTS.find(d => 
    d.name.toLowerCase() === districtName.toLowerCase().trim()
  );
  return district ? district.id : null;
};

// Function to format contact info
const formatContactInfo = (contactInfo) => {
  if (!contactInfo) return 'N/A';
  
  if (contactInfo.includes('@')) {
    return (
      <div>
        <div>{contactInfo}</div>
        <small>
          <a href={`mailto:${contactInfo}`} className="text-decoration-none">
            📧 Send Email
          </a>
        </small>
      </div>
    );
  }
  
  const cleaned = contactInfo.replace(/\D/g, '');
  if (cleaned.length === 10) {
    const formattedPhone = cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return (
      <div>
        <div>+91 {formattedPhone}</div>
        <small>
          <a href={`tel:+91${cleaned}`} className="text-decoration-none">
            📞 Call
          </a>
        </small>
      </div>
    );
  }
  
  return contactInfo;
};

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [sortedCases, setSortedCases] = useState([]);
  const [caseDetails, setCaseDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [predicting, setPredicting] = useState({});
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    crimeType: '',
    district: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const [users, setUsers] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setUserIsAdmin(isAdmin());
    setCurrentUser(getCurrentUser());
    loadCases();
    loadProfilePhoto();
    loadUnreadCount();
    loadUsers();

    const notificationInterval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    const handleStorageChange = (e) => {
      if (e.key === 'profile_photo') {
        setProfilePhoto(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(notificationInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const usersData = await response.json();
        const usersArray = usersData.results || usersData || [];
        setUsers(usersArray);
        console.log('✅ Users loaded for investigator lookup:', usersArray.length);
      }
    } catch (err) {
      console.error('Error loading users for investigator lookup:', err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const previousCount = unreadCount;
      const countData = await NotificationService.getUnreadCount();
      const newCount = countData.unread_count || 0;
      
      setUnreadCount(newCount);
      
      if (newCount > previousCount) {
        setHasNewNotifications(true);
        
        setTimeout(() => {
          setHasNewNotifications(false);
        }, 10000);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const handleNotificationsClick = () => {
    setHasNewNotifications(false);
    navigate('/notifications');
  };

  useEffect(() => {
    let filtered = cases;

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(caseItem => 
        caseItem.case_number?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.id?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(caseItem => caseItem.status === filters.status);
    }

    if (filters.crimeType) {
      filtered = filtered.filter(caseItem => 
        caseItem.primary_type?.toLowerCase().includes(filters.crimeType.toLowerCase())
      );
    }

    if (filters.district) {
      filtered = filtered.filter(caseItem => 
        caseItem.district?.toString() === filters.district
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(caseItem => {
        const caseDate = new Date(caseItem.date_time || caseItem.date || caseItem.created_at);
        return caseDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(caseItem => {
        const caseDate = new Date(caseItem.date_time || caseItem.date || caseItem.created_at);
        return caseDate <= toDate;
      });
    }

    setFilteredCases(filtered);
  }, [searchTerm, filters, cases]);

  useEffect(() => {
    if (filteredCases.length > 0 && currentUser) {
      const sorted = [...filteredCases].sort((a, b) => {
        const isAInvestigator = isCaseInvestigator(a);
        const isBInvestigator = isCaseInvestigator(b);
        
        if (isAInvestigator === isBInvestigator) {
          const dateA = new Date(a.date_time || a.date || a.created_at);
          const dateB = new Date(b.date_time || b.date || b.created_at);
          return dateB - dateA;
        }
        
        return isAInvestigator ? -1 : 1;
      });
      
      setSortedCases(sorted);
    } else {
      setSortedCases(filteredCases);
    }
  }, [filteredCases, currentUser]);

  const loadProfilePhoto = () => {
    const storedProfilePhoto = localStorage.getItem('profile_photo');
    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    } else {
      fetchProfilePhoto();
    }
  };

  const fetchProfilePhoto = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/profile/', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const profileData = await response.json();
        if (profileData.profile_photo) {
          const photoUrl = profileData.profile_photo.startsWith('http') 
            ? profileData.profile_photo 
            : `${window.location.origin}${profileData.profile_photo}`;
          
          setProfilePhoto(photoUrl);
          localStorage.setItem('profile_photo', photoUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching profile photo:', err);
    }
  };

  // Get unique district values with names for filter dropdown
  const getUniqueDistricts = () => {
    const districtIds = [...new Set(cases.map(c => c.district).filter(Boolean))].sort((a, b) => a - b);
    return districtIds.map(id => ({
      id,
      name: getDistrictName(id)
    }));
  };

  const isCaseInvestigator = (caseItem) => {
    if (!currentUser) return false;
    
    if (userIsAdmin) return true;
    
    if (caseItem.investigator) {
      if (typeof caseItem.investigator === 'object' && caseItem.investigator.id === currentUser.id) {
        return true;
      }
      if (caseItem.investigator_id === currentUser.id) {
        return true;
      }
      if (caseItem.investigator === currentUser.id) {
        return true;
      }
    }
    
    if (caseItem.assigned_investigator) {
      if (typeof caseItem.assigned_investigator === 'object' && caseItem.assigned_investigator.id === currentUser.id) {
        return true;
      }
      if (caseItem.assigned_investigator === currentUser.id) {
        return true;
      }
    }
    
    if (caseItem.investigator && typeof caseItem.investigator === 'object') {
      return caseItem.investigator.username === currentUser.username || 
             caseItem.investigator.email === currentUser.email;
    }
    
    return false;
  };

  const getInvestigatorDisplayName = (caseItem) => {
    if (caseItem.investigator) {
      if (typeof caseItem.investigator === 'object') {
        const name = `${caseItem.investigator.first_name || ''} ${caseItem.investigator.last_name || ''}`.trim();
        return name || caseItem.investigator.username || 'Unknown Investigator';
      }
      
      if (typeof caseItem.investigator === 'string' || typeof caseItem.investigator === 'number') {
        const investigatorId = caseItem.investigator;
        const foundUser = users.find(user => 
          user.id === investigatorId || 
          user.id === parseInt(investigatorId) ||
          user.id === caseItem.investigator_id
        );
        
        if (foundUser) {
          const name = `${foundUser.first_name || ''} ${foundUser.last_name || ''}`.trim();
          return name || foundUser.username || `Investigator ${investigatorId}`;
        }
        
        return `Investigator ${investigatorId}`;
      }
      
      return caseItem.investigator;
    }
    
    if (caseItem.assigned_investigator) {
      if (typeof caseItem.assigned_investigator === 'object') {
        const name = `${caseItem.assigned_investigator.first_name || ''} ${caseItem.assigned_investigator.last_name || ''}`.trim();
        return name || caseItem.assigned_investigator.username || 'Unknown Investigator';
      }
      
      if (typeof caseItem.assigned_investigator === 'string' || typeof caseItem.assigned_investigator === 'number') {
        const investigatorId = caseItem.assigned_investigator;
        const foundUser = users.find(user => 
          user.id === investigatorId || 
          user.id === parseInt(investigatorId)
        );
        
        if (foundUser) {
          const name = `${foundUser.first_name || ''} ${foundUser.last_name || ''}`.trim();
          return name || foundUser.username || `Investigator ${investigatorId}`;
        }
        
        return `Investigator ${investigatorId}`;
      }
      
      return caseItem.assigned_investigator;
    }
    
    if (caseItem.owner) {
      if (typeof caseItem.owner === 'object') {
        return caseItem.owner.username || 'Case Owner';
      }
      return caseItem.owner;
    }
    
    return 'Not assigned';
  };

  const getInvestigatorDetails = (caseItem) => {
    if (caseItem.investigator && typeof caseItem.investigator === 'object') {
      return {
        name: `${caseItem.investigator.first_name || ''} ${caseItem.investigator.last_name || ''}`.trim(),
        rank: caseItem.investigator.rank || 'N/A',
        staffId: caseItem.investigator.staff_id || 'N/A',
        id: caseItem.investigator.id
      };
    }
    
    if (caseItem.assigned_investigator && typeof caseItem.assigned_investigator === 'object') {
      return {
        name: `${caseItem.assigned_investigator.first_name || ''} ${caseItem.assigned_investigator.last_name || ''}`.trim(),
        rank: caseItem.assigned_investigator.rank || 'N/A',
        staffId: caseItem.assigned_investigator.staff_id || 'N/A',
        id: caseItem.assigned_investigator.id
      };
    }
    
    if (caseItem.investigator && (typeof caseItem.investigator === 'string' || typeof caseItem.investigator === 'number')) {
      const investigatorUser = users.find(user => 
        user.id === caseItem.investigator || 
        user.id === parseInt(caseItem.investigator) ||
        user.id === caseItem.investigator_id
      );
      if (investigatorUser) {
        return {
          name: `${investigatorUser.first_name || ''} ${investigatorUser.last_name || ''}`.trim(),
          rank: investigatorUser.rank || 'N/A',
          staffId: investigatorUser.staff_id || 'N/A',
          id: investigatorUser.id
        };
      }
      return {
        name: `Investigator ID: ${caseItem.investigator}`,
        rank: 'Unknown',
        staffId: 'Unknown',
        id: caseItem.investigator
      };
    }
    
    return null;
  };

  const isCurrentUserInvestigator = (caseItem) => {
    return isCaseInvestigator(caseItem);
  };

  const loadCases = () => {
    setLoading(true);
    fetchCases()
      .then(response => {
        const casesData = Array.isArray(response.data) ? response.data : 
                         (response.data.results || response.data.cases || []);
        
        const formattedCases = casesData.map(caseItem => ({
          ...caseItem,
          id: caseItem.case_id || caseItem.id,
          districtName: getDistrictName(caseItem.district) // Add district name for display
        }));
        
        setCases(formattedCases);
        setFilteredCases(formattedCases);
        setLoading(false);
      })
      .catch(err => { 
        console.error('Error loading cases:', err);
        if (err.response && err.response.status === 401) {
          logout();
          navigate('/login');
        } else {
          setError('Failed to load cases.');
        }
        setLoading(false);
      });
  };

  const loadCaseDetails = async (caseId) => {
    try {
      const [evidenceRes, witnessesRes, recordsRes] = await Promise.all([
        fetchEvidence(caseId),
        fetchWitnesses(caseId),
        fetchCriminalRecords(caseId)
      ]);

      setCaseDetails(prev => ({
        ...prev,
        [caseId]: {
          evidence: Array.isArray(evidenceRes.data) ? evidenceRes.data : 
                   (evidenceRes.data.results || evidenceRes.data.evidence || []),
          witnesses: Array.isArray(witnessesRes.data) ? witnessesRes.data : 
                    (witnessesRes.data.results || witnessesRes.data.witnesses || []),
          criminalRecords: Array.isArray(recordsRes.data) ? recordsRes.data : 
                         (recordsRes.data.results || recordsRes.data.criminal_records || [])
        }
      }));
    } catch (err) {
      console.error('Error loading case details:', err);
      setError('Failed to load case details.');
    }
  };

  const getCriminalDisplayInfo = (record) => {
    if (record.suspect_details) {
      return {
        criminal_name: record.suspect_details.criminal_name || 'Unknown',
        criminal_age: record.suspect_details.criminal_age,
        criminal_gender: record.suspect_details.criminal_gender,
        criminal_district: record.suspect_details.criminal_district,
        criminal_district_name: getDistrictName(record.suspect_details.criminal_district), // Add district name
        photo: record.suspect_details.photo,
        aadhaar_number: record.suspect_details.aadhaar_number
      };
    }
    
    if (record.suspect && typeof record.suspect === 'object') {
      return {
        criminal_name: record.suspect.criminal_name || 'Unknown',
        criminal_age: record.suspect.criminal_age,
        criminal_gender: record.suspect.criminal_gender,
        criminal_district: record.suspect.criminal_district,
        criminal_district_name: getDistrictName(record.suspect.criminal_district), // Add district name
        photo: record.suspect.photo,
        aadhaar_number: record.suspect.aadhaar_number
      };
    }
    
    if (record.criminal_name || record.person_name) {
      return {
        criminal_name: record.criminal_name || record.person_name,
        criminal_age: record.criminal_age || record.age,
        criminal_gender: record.criminal_gender || record.gender,
        criminal_district: record.criminal_district || record.district,
        criminal_district_name: getDistrictName(record.criminal_district || record.district), // Add district name
        photo: record.photo,
        aadhaar_number: record.aadhaar_number
      };
    }
    
    return {
      criminal_name: 'Unknown Criminal',
      criminal_age: null,
      criminal_gender: null,
      criminal_district: null,
      criminal_district_name: 'N/A',
      photo: null,
      aadhaar_number: null
    };
  };

  const handleCaseClick = async (caseItem) => {
    setSelectedCase(caseItem);
    setShowCaseModal(true);
    
    if (!caseDetails[caseItem.id]) {
      await loadCaseDetails(caseItem.id);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      crimeType: '',
      district: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };

  const getUniqueValues = (key) => {
    const values = cases.map(caseItem => caseItem[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const isFilterActive = () => {
    return Object.values(filters).some(value => value !== '') || searchTerm !== '';
  };

  const handlePredict = async (caseItem) => {
    setPredicting(prev => ({ ...prev, [caseItem.id]: true }));
    setError(null);
    
    try {
      const token = getToken();
      
      const caseDateTime = caseItem.date_time || caseItem.date || new Date().toISOString();
      const dateObj = new Date(caseDateTime);
      
      const predictionData = {
        "crime_type": caseItem.primary_type || caseItem.type_of_crime || "THEFT",
        "description": caseItem.description || "GENERAL THEFT",
        "location": caseItem.location_description || caseItem.location || "STREET",
        "district": parseInt(caseItem.district) || 5,
        "ward": parseInt(caseItem.ward) || 10,
        "same_district": 1,
        "suspect_age": 30,
        "datetime": caseDateTime,
        "suspect_name": "Unknown",
        "previous_offenses": "No prior offenses"
      };

      const response = await fetch('/api/predict/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(predictionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Prediction failed: ${response.status} - ${errorText}`);
      }

      const predictionResult = await response.json();
      
      navigate('/prediction-results', { 
        state: { 
          prediction: predictionResult,
          caseData: caseItem
        }
      });
      
    } catch (err) {
      console.error('Prediction error:', err);
      setError(`Failed to generate prediction: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setPredicting(prev => ({ ...prev, [caseItem.id]: false }));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      deleteCase(id)
        .then(() => {
          setCases(cases.filter(c => c.id !== id));
          const newCaseDetails = { ...caseDetails };
          delete newCaseDetails[id];
          setCaseDetails(newCaseDetails);
        })
        .catch(err => {
          console.error('Error deleting case:', err);
          setError('Failed to delete case.');
        });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAdminDashboard = () => {
    if (userIsAdmin) {
      navigate('/admin-dashboard');
    }
  };

  const getStatusBadge = (status) => {
    const variant = {
      'Open': 'success',
      'In Progress': 'primary',
      'Pending': 'warning',
      'Closed': 'secondary',
      'Reopened': 'info'
    }[status] || 'secondary';
    
    return <Badge bg={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm fixed-top">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
            <div className="ms-auto d-flex align-items-center">
              <button 
                onClick={handleNotificationsClick}
                className="btn btn-outline-secondary btn-sm me-2 position-relative"
                title="Notifications"
                style={{ border: 'none', background: 'transparent' }}
              >
                <i className="bi bi-bell" style={{ fontSize: '1.2rem' }}></i>
                
                {hasNewNotifications && (
                  <div 
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#dc3545',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <i 
                      className="bi bi-exclamation text-white" 
                      style={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                    ></i>
                  </div>
                )}
                
                {unreadCount > 0 && !hasNewNotifications && (
                  <Badge 
                    bg="danger" 
                    pill 
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '0.6rem' }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </button>
              <Link to="/profile" className="text-decoration-none me-3">
                {profilePhoto ? (
                  <Image
                    src={profilePhoto}
                    alt="Profile"
                    roundedCircle
                    style={{ width: '35px', height: '35px', objectFit: 'cover' }}
                    className="border"
                  />
                ) : (
                  <div
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                    style={{ width: '35px', height: '35px', border: '1px solid #dee2e6' }}
                  >
                    <i className="bi bi-person text-muted"></i>
                  </div>
                )}
              </Link>
              <button onClick={handleLogout} className="btn btn-outline-primary btn-sm">
                Logout
              </button>
            </div>
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh', paddingTop: '80px' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Loading cases...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
          <div className="ms-auto d-flex align-items-center">
            {userIsAdmin && (
              <Button 
                variant="outline-warning" 
                size="sm" 
                className="me-2"
                onClick={handleAdminDashboard}
              >
                <i className="bi bi-shield-check me-1"></i>Admin Dashboard
              </Button>
            )}
            
            <Link to="/criminal-search" className="btn btn-primary btn-sm me-2">
              <i className="bi bi-search me-1"></i>Criminal Search
            </Link>
            <Link to="/cases/new" className="btn btn-primary btn-sm me-2">
              <i className="bi bi-plus-circle me-1"></i>Create New Case
            </Link>
            <Link 
              to="/notifications" 
              className="btn btn-outline-secondary btn-sm me-2 position-relative"
              title="Notifications"
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <Badge 
                  bg="danger" 
                  pill 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.6rem' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
            <Link to="/profile" className="text-decoration-none me-3" title="Profile">
              {profilePhoto ? (
                <Image
                  src={profilePhoto}
                  alt="Profile"
                  roundedCircle
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  className="border"
                />
              ) : (
                <div
                  className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', border: '1px solid #dee2e6' }}
                  title="Profile"
                >
                  <i className="bi bi-person text-muted"></i>
                </div>
              )}
            </Link>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline-primary btn-sm"
            >
              Logout
            </button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-5 fixed-navbar-padding" style={{ paddingTop: '140px' }}>
        {error && (
          <Alert variant="danger" className="text-center">
            {error}
            <div className="mt-2">
              <Button variant="outline-danger" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </Alert>
        )}

        <Row className="justify-content-center mb-4">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="fw-bold text-dark mb-0">Cases Dashboard</h2>
                {userIsAdmin && (
                  <Badge bg="warning" className="ms-2">Administrator</Badge>
                )}
                {currentUser && !userIsAdmin && (
                  <Badge bg="info" className="ms-2">{currentUser.username}</Badge>
                )}
              </div>
              <span className="badge bg-primary">{sortedCases.length} {isFilterActive() ? 'filtered' : 'total'} cases</span>
            </div>
            <p className="text-muted">Manage and track all your cases in one place</p>

            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by case number or ID..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    {(searchTerm || isFilterActive()) && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={clearFilters}
                        title="Clear all filters"
                      >
                        <i className="bi bi-x-circle"></i> Clear All
                      </Button>
                    )}
                  </InputGroup>
                  <Form.Text className="text-muted">
                    {isFilterActive() && `Found ${sortedCases.length} case(s) matching your criteria`}
                  </Form.Text>
                </Form.Group>

                <Row className="g-3">
                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Status</Form.Label>
                      <Form.Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {getUniqueValues('status').map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Crime Type</Form.Label>
                      <Form.Select
                        value={filters.crimeType}
                        onChange={(e) => handleFilterChange('crimeType', e.target.value)}
                      >
                        <option value="">All Crime Types</option>
                        {getUniqueValues('primary_type').map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">District</Form.Label>
                      <Form.Select
                        value={filters.district}
                        onChange={(e) => handleFilterChange('district', e.target.value)}
                      >
                        <option value="">All Districts</option>
                        {getUniqueDistricts().map(district => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={10}>
            {sortedCases.length > 0 ? (
              <div>
                {sortedCases.map(c => {
                  const userCanEdit = isCaseInvestigator(c);
                  const isUserInvestigator = isCurrentUserInvestigator(c);
                  const investigatorDetails = getInvestigatorDetails(c);
                  const districtName = getDistrictName(c.district); // Get district name
                  
                  return (
                    <Card 
                      key={c.id} 
                      className={`border-0 shadow-sm auth-card mb-3 ${isUserInvestigator ? 'border-primary border-2' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCaseClick(c)}
                    >
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h5 className="fw-bold">
                              {c.case_number ? `#${c.case_number}` : `Case #${c.id}`} - {c.primary_type || c.title || 'Untitled Case'}
                              {isUserInvestigator && (
                                <Badge bg="primary" className="ms-2">
                                  <i className="bi bi-star-fill me-1"></i>Your Case
                                </Badge>
                              )}
                              <i className="bi bi-arrow-right-circle text-muted ms-2" title="Click to view details"></i>
                            </h5>
                            <p className="text-muted mb-2">{c.description}</p>
                            
                            <div className="mb-2">
                              <Badge 
                                bg={isUserInvestigator ? "primary" : "outline-primary"} 
                                text={isUserInvestigator ? "white" : "dark"} 
                                className={isUserInvestigator ? "" : "border"}
                              >
                                <i className="bi bi-person-badge me-1"></i>
                                Investigator: {getInvestigatorDisplayName(c)}
                                {isUserInvestigator && <span className="ms-1">(You)</span>}
                              </Badge>
                              {investigatorDetails && investigatorDetails.rank && (
                                <Badge bg="info" className="ms-1">
                                  {investigatorDetails.rank}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="d-flex gap-2 mb-2 flex-wrap">
                              {getStatusBadge(c.status)}
                              <Badge bg="light" text="dark">
                                {c.date_time ? new Date(c.date_time).toLocaleDateString() : 
                                c.date ? new Date(c.date).toLocaleDateString() : 'No date'}
                              </Badge>
                              <Badge bg="light" text="dark">
                                {c.location_description || c.location || 'No location'}
                              </Badge>
                              {c.district && (
                                <Badge bg="light" text="dark">
                                  {districtName} {/* Show district name instead of number */}
                                  {c.district && <span className="text-muted ms-1">(D{c.district})</span>}
                                </Badge>
                              )}
                              {c.ward && (
                                <Badge bg="light" text="dark">
                                  Ward {c.ward}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div 
                            className="d-flex gap-2 flex-wrap ms-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {userCanEdit && (
                              <>
                                <Link 
                                  to={`/cases/edit/${c.id}`} 
                                  className="btn btn-sm btn-outline-primary"
                                  title="Edit Case"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Link>
                                
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(c.id);
                                  }}
                                  title="Delete Case"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>

                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePredict(c);
                                  }}
                                  disabled={predicting[c.id]}
                                >
                                  {predicting[c.id] ? (
                                    <>
                                      <Spinner animation="border" size="sm" className="me-1" />
                                      Predicting...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-robot me-1"></i>
                                      Predict Suspects
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-0 shadow-sm auth-card">
                <Card.Body className="p-4">
                  <div className="text-center py-5">
                    <i className="bi bi-folder-x text-muted" style={{ fontSize: '3rem' }}></i>
                    <h5 className="mt-3 text-muted">
                      {isFilterActive() ? 'No cases found matching your filters' : 'No cases found'}
                    </h5>
                    <p className="text-muted">
                      {isFilterActive() ? 'Try adjusting your search criteria or clear filters' : 'Get started by creating your first case'}
                    </p>
                    {isFilterActive() && (
                      <Button 
                        variant="outline-primary" 
                        onClick={clearFilters}
                        className="me-2"
                      >
                        Clear All Filters
                      </Button>
                    )}
                    <Link to="/cases/new" className="btn btn-primary mt-2">
                      Create New Case
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {cases.length > 0 && (
          <Row className="mt-5 justify-content-center">
            <Col lg={10}>
              <h5 className="fw-bold mb-4">Case Overview</h5>
              <Row>
                <Col md={3} className="mb-3">
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h3 className="fw-bold text-primary">{cases.filter(c => c.status === 'Open').length}</h3>
                      <p className="text-muted mb-0">Open Cases</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h3 className="fw-bold text-warning">{cases.filter(c => c.status === 'Pending').length}</h3>
                      <p className="text-muted mb-0">Pending Cases</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h3 className="fw-bold text-success">{cases.filter(c => c.status === 'Closed').length}</h3>
                      <p className="text-muted mb-0">Closed Cases</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h3 className="fw-bold text-info">{cases.length}</h3>
                      <p className="text-muted mb-0">Total Cases</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <Link to="/chat" className="btn btn-primary btn-lg rounded-circle shadow">
            <i className="bi bi-chat-dots"></i>
          </Link>
        </div>
      </Container>

      <Modal show={showCaseModal} onHide={() => setShowCaseModal(false)} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            Case Details - {selectedCase?.case_number ? `#${selectedCase.case_number}` : `Case #${selectedCase?.id}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCase && (
            <div>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Case Information</h5>
                  <Row>
                    <Col md={6}>
                      <p><strong>Case Number:</strong> {selectedCase.case_number ? `#${selectedCase.case_number}` : `#${selectedCase.id}`}</p>
                      <p><strong>Crime Type:</strong> {selectedCase.primary_type || 'N/A'}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedCase.status)}</p>
                      <p><strong>Location:</strong> {selectedCase.location_description || selectedCase.location || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>District:</strong> {getDistrictName(selectedCase.district)}</p> {/* Updated */}
                      <p><strong>Ward:</strong> {selectedCase.ward || 'N/A'}</p>
                      <p><strong>Date & Time:</strong> {selectedCase.date_time ? new Date(selectedCase.date_time).toLocaleString() : 'N/A'}</p>
                      <p><strong>Investigator:</strong> 
                        <Badge bg={getInvestigatorDisplayName(selectedCase) !== 'Not assigned' ? 'primary' : 'secondary'} className="ms-2">
                          {getInvestigatorDisplayName(selectedCase)}
                          {isCurrentUserInvestigator(selectedCase) && ' (You)'}
                        </Badge>
                        {getInvestigatorDetails(selectedCase)?.rank && (
                          <Badge bg="info" className="ms-1">
                            {getInvestigatorDetails(selectedCase).rank}
                          </Badge>
                        )}
                      </p>
                    </Col>
                  </Row>
                  {selectedCase.description && (
                    <div className="mt-3">
                      <strong>Description:</strong>
                      <p className="mt-1">{selectedCase.description}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>

              <h6 className="fw-bold mb-3">Evidence</h6>
              {caseDetails[selectedCase.id]?.evidence?.length > 0 ? (
                <Table striped bordered responsive size="sm" className="mb-4">
                  <thead>
                    <tr>
                      <th>Type of Evidence</th>
                      <th>Details</th>
                      <th>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseDetails[selectedCase.id].evidence.map(evidence => (
                      <tr key={evidence.id}>
                        <td>{evidence.type_of_evidence}</td>
                        <td>{evidence.details}</td>
                        <td>
                          {evidence.file ? (
                            <a href={evidence.file} target="_blank" rel="noopener noreferrer">
                              View File
                            </a>
                          ) : (
                            'No file'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted mb-4">No evidence recorded.</p>
              )}

              <h6 className="fw-bold mb-3">Witnesses</h6>
              {caseDetails[selectedCase.id]?.witnesses?.length > 0 ? (
                <Table striped bordered responsive size="sm" className="mb-4">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Aadhaar Number</th>
                      <th>Contact Information</th>
                      <th>Statement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseDetails[selectedCase.id].witnesses.map(witness => (
                      <tr key={witness.id || witness.witness_id}>
                        <td>
                          <strong>{witness.name}</strong>
                        </td>
                        <td>
                          {witness.aadhaar_number ? (
                            <span className="font-monospace">{witness.aadhaar_number}</span>
                          ) : (
                            <span className="text-muted">Not provided</span>
                          )}
                        </td>
                        <td>
                          {witness.contact_info ? (
                            formatContactInfo(witness.contact_info)
                          ) : (
                            <span className="text-muted">Not provided</span>
                          )}
                        </td>
                        <td>
                          <div style={{ maxWidth: '200px' }}>
                            {witness.statement.length > 100 ? (
                              <>
                                {witness.statement.substring(0, 100)}...
                                <br />
                                <small>
                                  <button 
                                    className="btn btn-link p-0 text-decoration-none"
                                    onClick={() => alert(witness.statement)}
                                  >
                                    View full statement
                                  </button>
                                </small>
                              </>
                            ) : (
                              witness.statement
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted mb-4">No witness statements recorded.</p>
              )}

              <h6 className="fw-bold mb-3">Criminal Records</h6>
              {caseDetails[selectedCase.id]?.criminalRecords?.length > 0 ? (
                <Table striped bordered responsive size="sm" className="mb-4">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Aadhaar</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>District</th>
                      <th>Offenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseDetails[selectedCase.id].criminalRecords.map(record => {
                      const criminalInfo = getCriminalDisplayInfo(record);
                      
                      return (
                        <tr key={record.record_id || record.id}>
                          <td>
                            <strong>{criminalInfo.criminal_name}</strong>
                          </td>
                          <td>
                            {criminalInfo.aadhaar_number ? (
                              <span className="font-monospace">{criminalInfo.aadhaar_number}</span>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>{criminalInfo.criminal_age || 'N/A'}</td>
                          <td>{criminalInfo.criminal_gender || 'N/A'}</td>
                          <td>
                            {criminalInfo.criminal_district_name || getDistrictName(criminalInfo.criminal_district) || 'N/A'} {/* Updated */}
                          </td>
                          <td>
                            <div style={{ maxWidth: '200px' }}>
                              {record.offenses && record.offenses.length > 50 ? (
                                <>
                                  {record.offenses.substring(0, 50)}...
                                  <br />
                                  <small>
                                    <button 
                                      className="btn btn-link p-0 text-decoration-none"
                                      onClick={() => alert(record.offenses)}
                                    >
                                      View full offenses
                                    </button>
                                  </small>
                                </>
                              ) : (
                                record.offenses || 'No offenses description'
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No criminal records recorded.</p>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}