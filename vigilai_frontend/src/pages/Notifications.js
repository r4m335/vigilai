// Notifications.js
import React, { useState, useEffect } from 'react';
import {
  Container, Card, ListGroup, Badge, Button, Navbar,
  Spinner, Alert, Row, Col, Image
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getToken, getCurrentUser, isAdmin } from './cases/services/Authservice';
import NotificationService from './cases/services/NotificationService';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);
    setUserIsAdmin(isAdmin());
    console.log('Current user:', user);
    
    loadNotifications();
    loadUnreadCount();
    loadProfilePhoto();

    // Set up polling for new notifications
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [navigate]);

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

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading notifications...');
      
      const notificationsData = await NotificationService.getNotifications();
      console.log('Notifications data received:', notificationsData);
      
      // Handle different response formats
      let notificationsArray = [];
      if (Array.isArray(notificationsData)) {
        notificationsArray = notificationsData;
      } else if (notificationsData && notificationsData.results) {
        notificationsArray = notificationsData.results;
      } else if (notificationsData && Array.isArray(notificationsData.data)) {
        notificationsArray = notificationsData.data;
      }
      
      console.log('Processed notifications:', notificationsArray);
      setNotifications(notificationsArray);
      
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(`Failed to load notifications: ${err.message}`);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const countData = await NotificationService.getUnreadCount();
      console.log('Unread count data:', countData);
      setUnreadCount(countData.unread_count || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
      // Don't set error for unread count to avoid disrupting the UI
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.room) {
      navigate('/chat', { state: { roomId: notification.room.id } });
    } else if (notification.mentioned_case) {
      navigate(`/cases/${notification.mentioned_case.id}`);
    } else {
      navigate('/chat');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mention':
        return 'bi-at';
      case 'case_mention':
        return 'bi-folder';
      case 'message':
        return 'bi-chat';
      default:
        return 'bi-bell';
    }
  };

  const getNotificationVariant = (type) => {
    switch (type) {
      case 'mention':
        return 'primary';
      case 'case_mention':
        return 'warning';
      case 'message':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatNotificationText = (notification) => {
    if (notification.message) {
      return notification.message;
    }

    if (notification.sender && notification.sender.username) {
      return `You were mentioned by ${notification.sender.username} in a chat`;
    }

    if (notification.mentioned_case && notification.mentioned_case.case_number) {
      return `Case ${notification.mentioned_case.case_number} was mentioned in a chat`;
    }

    return 'New notification';
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Navigation handlers
  const handleDashboardClick = () => {
    if (userIsAdmin) {
      navigate('/admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const refreshNotifications = () => {
    loadNotifications();
    loadUnreadCount();
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      {/* Updated Navigation Bar */}
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
          <div className="ms-auto d-flex align-items-center">
            {userIsAdmin && (
              <Button 
                variant="outline-warning" 
                size="sm" 
                className="me-2"
                onClick={handleDashboardClick}
              >
                <i className="bi bi-shield-check me-1"></i>Admin Dashboard
              </Button>
            )}
            
            
            
            {/* Notification Icon */}
            <button 
              className="btn btn-outline-secondary btn-sm me-2 position-relative"
              title="Notifications"
              style={{ border: 'none', background: 'transparent', cursor: 'default' }}
            >
              <i className="bi bi-bell-fill text-primary" style={{ fontSize: '1.2rem' }}></i>
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
            </button>

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
            {/* Dashboard Button */}
            <Button 
              variant="primary" 
              size="sm" 
              className="me-2" 
              onClick={handleDashboardClick}
            >
              {userIsAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </Button>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline-primary btn-sm"
            >
              Logout
            </button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
            <div className="mt-2">
              <Button variant="outline-danger" size="sm" onClick={refreshNotifications}>
                Try Again
              </Button>
            </div>
          </Alert>
        )}

        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0 fw-bold">Notifications</h4>
                  <small className="text-muted">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={refreshNotifications}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-clockwise"></i> Refresh
                  </Button>
                  {unreadCount > 0 && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark All as Read
                    </Button>
                  )}
                </div>
              </Card.Header>

              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-bell display-4 d-block mb-2"></i>
                    No notifications yet
                    <br />
                    <small>You'll be notified when someone mentions you or your cases</small>
                    <br />
                    <Button 
                      variant="outline-primary" 
                      className="mt-2"
                      onClick={refreshNotifications}
                    >
                      Check Again
                    </Button>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {notifications.map(notification => (
                      <ListGroup.Item
                        key={notification.id}
                        className={`border-0 ${!notification.is_read ? 'bg-light' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="d-flex align-items-start">
                          <div className="me-3">
                            <i 
                              className={`bi ${getNotificationIcon(notification.type)} text-${getNotificationVariant(notification.type)}`}
                              style={{ fontSize: '1.2rem' }}
                            ></i>
                          </div>
                          
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <p className="mb-1">
                                {formatNotificationText(notification)}
                              </p>
                              {!notification.is_read && (
                                <Badge bg="primary" pill>New</Badge>
                              )}
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {formatTime(notification.created_at)}
                              </small>
                              
                              {!notification.is_read && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                >
                                  Mark Read
                                </Button>
                              )}
                            </div>
                            
                            {/* Additional context */}
                            {(notification.mentioned_case || notification.room) && (
                              <div className="mt-2">
                                {notification.mentioned_case && (
                                  <Badge bg="warning" text="dark" className="me-1">
                                    <i className="bi bi-folder me-1"></i>
                                    Case: {notification.mentioned_case.case_number}
                                  </Badge>
                                )}
                                {notification.room && (
                                  <Badge bg="info" text="dark">
                                    <i className="bi bi-chat me-1"></i>
                                    Room: {notification.room.name}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}