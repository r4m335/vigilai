import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Row, Col, Card, Form, Button, InputGroup, Image,
  Spinner, Alert, Badge, ListGroup, Modal, Navbar
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { chatService } from './cases/services/ChatService';
import { logout, getToken, getCurrentUser, isAdmin } from './cases/services/Authservice';
import NotificationService from './cases/services/NotificationService'; 
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Chat() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  // Case modal states
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [selectedCaseForModal, setSelectedCaseForModal] = useState(null);
  
  // User profile modal states - NEW
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  
  // Autocomplete states
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [casesLoaded, setCasesLoaded] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [showCaseSuggestions, setShowCaseSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);
    console.log('Current user:', user);
    checkUserRole();
    loadRooms();
    loadUsers();
    loadCases();
    loadProfilePhoto();
    loadUnreadCount();

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

  // FIXED: Use event delegation for case link clicks
  useEffect(() => {
    const handleCaseLinkClick = (e) => {
      const caseLink = e.target.closest('.case-link');
      if (caseLink) {
        e.preventDefault();
        const caseId = caseLink.getAttribute('data-case-id');
        console.log('🔍 Clicked case link with ID:', caseId);
        
        const foundMessage = messages.find(message => 
          message.mentioned_case && 
          (message.mentioned_case.id == caseId || message.mentioned_case.case_id == caseId)
        );
        
        if (foundMessage && foundMessage.mentioned_case) {
          console.log('✅ Found mentioned case:', foundMessage.mentioned_case);
          setSelectedCaseForModal(foundMessage.mentioned_case);
          setShowCaseModal(true);
        } else {
          console.log('❌ Could not find mentioned case in messages');
        }
      }
    };

    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('click', handleCaseLinkClick);
    }

    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener('click', handleCaseLinkClick);
      }
    };
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when selectedRoom changes
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
    }
  }, [selectedRoom]);

  // Debug logging for mentions
  useEffect(() => {
    console.log('👥 Available users for mentions:', users);
    console.log('📋 Available cases for mentions:', cases);
  }, [users, cases]);

  const checkUserRole = () => {
    const adminStatus = isAdmin();
    setUserIsAdmin(adminStatus);
  };

  // NEW: Load other user's profile data
  const loadUserProfile = async (userId) => {
    try {
      setUserProfileLoading(true);
      const token = getToken();
      const response = await fetch(`/api/users/${userId}/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setSelectedUserProfile(userData);
        console.log('User profile loaded:', userData);
      } else {
        console.error('Failed to load user profile:', response.status);
        // Fallback: try to find user in the loaded users list
        const foundUser = users.find(user => user.id === userId);
        if (foundUser) {
          setSelectedUserProfile(foundUser);
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      // Fallback: try to find user in the loaded users list
      const foundUser = users.find(user => user.id === userId);
      if (foundUser) {
        setSelectedUserProfile(foundUser);
      }
    } finally {
      setUserProfileLoading(false);
    }
  };

  // NEW: Handle other user's profile picture click
  const handleUserProfileClick = async (userId) => {
    if (userId === currentUser?.id) {
      // If it's the current user, navigate to profile page
      navigate('/profile');
      return;
    }
    
    await loadUserProfile(userId);
    setShowUserProfileModal(true);
  };

  // Load unread notification count
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

  // Reset new notification indicator when user clicks notifications
  const handleNotificationsClick = () => {
    setHasNewNotifications(false);
    navigate('/notifications');
  };

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

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await chatService.getRooms();
      setRooms(roomsData);
      
      if (roomsData.length > 0 && !selectedRoom) {
        const firstRoom = roomsData[0];
        setSelectedRoom(firstRoom);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (room) => {
    if (!room) return;
    
    try {
      setMessagesLoading(true);
      // Use room_id instead of id
      const messagesData = await chatService.getMessages(room.room_id);
      console.log('Loaded messages:', messagesData);
      
      messagesData.forEach(msg => {
        if (msg.mentioned_case) {
          console.log('✅ Message has case mention:', {
            message_id: msg.id,
            case: msg.mentioned_case
          });
        }
        if (msg.mentioned_user) {
          console.log('✅ Message has user mention:', {
            message_id: msg.id,
            user: msg.mentioned_user
          });
        }
      });
      
      setMessages(messagesData);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadUsers = async (retryCount = 0) => {
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
        console.log('Loaded users:', usersData);
        const usersArray = usersData.results || usersData || [];
        if (usersArray.length > 0) {
          console.log('First user structure:', usersArray[0]);
        }
        setUsers(usersArray);
        setUsersLoaded(true);
        console.log('✅ Users loaded successfully, count:', usersArray.length);
        return usersArray;
      } else {
        console.error('Failed to load users:', response.status);
        if (retryCount < 3) {
          setTimeout(() => loadUsers(retryCount + 1), 2000);
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
      if (retryCount < 3) {
        setTimeout(() => loadUsers(retryCount + 1), 2000);
      }
    }
  };

  const loadCases = async (retryCount = 0) => {
    try {
      const token = getToken();
      const response = await fetch('/api/cases/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const casesData = await response.json();
        console.log('Loaded cases:', casesData);
        const casesArray = casesData.results || casesData || [];
        setCases(casesArray);
        setCasesLoaded(true);
        console.log('✅ Cases loaded successfully, count:', casesArray.length);
        
        if (casesArray.length > 0) {
          console.log('First case structure:', casesArray[0]);
        }
        
        return casesArray;
      } else {
        console.error('Failed to load cases:', response.status);
        if (retryCount < 3) {
          setTimeout(() => loadCases(retryCount + 1), 2000);
        }
      }
    } catch (err) {
      console.error('Error loading cases:', err);
      if (retryCount < 3) {
        setTimeout(() => loadCases(retryCount + 1), 2000);
      }
    }
  };

  // Helper functions to extract mentions (FOR UI SUGGESTIONS ONLY)
  const extractMentionedUser = (message, usersArray = users) => {
    if (!usersArray || usersArray.length === 0) {
      console.log('❌ Users array is empty');
      return null;
    }

    const mention = message.match(/@([^\s]+)/);
    if (!mention) return null;

    const searchTerm = mention[1].toLowerCase();
    console.log('🔍 Searching for user with term:', searchTerm);

    // Filter out current user from the search
    const foundUser = usersArray.find(user => {
      if (user.id === currentUser?.id) return false; // Skip current user
      
      const email = user?.email?.toLowerCase() || '';
      const firstName = user?.first_name?.toLowerCase() || '';
      const lastName = user?.last_name?.toLowerCase() || '';
      const username = user?.username?.toLowerCase() || '';

      return (
        email === searchTerm ||
        email.startsWith(searchTerm) ||
        `${firstName} ${lastName}`.toLowerCase().includes(searchTerm) ||
        firstName.startsWith(searchTerm) ||
        lastName.startsWith(searchTerm) ||
        username === searchTerm
      );
    });

    console.log('🔍 User search result:', foundUser);
    return foundUser || null;
  };

  const extractMentionedCase = (message, casesArray = cases) => {
    if (!casesArray || casesArray.length === 0) {
      console.log('❌ Cases array is empty');
      return null;
    }

    const caseMention = message.match(/#([^\s]+)/);
    if (caseMention) {
      const caseRef = caseMention[1];
      console.log('🔍 Looking for case with reference:', caseRef);
      
      const foundCase = casesArray.find(caseItem => {
        const caseNumber = caseItem?.case_number || '';
        const caseId = caseItem?.case_id?.toString() || '';
        const id = caseItem?.id?.toString() || '';
        
        console.log(`🔍 Comparing: search="${caseRef}" vs case_number="${caseNumber}" case_id="${caseId}" id="${id}"`);
        
        const matches = 
          caseNumber.toLowerCase() === caseRef.toLowerCase() ||
          caseId === caseRef ||
          id === caseRef ||
          caseNumber.toLowerCase().includes(caseRef.toLowerCase()) ||
          `#${caseNumber}`.toLowerCase().includes(caseRef.toLowerCase());
        
        if (matches) {
          console.log('✅ Found matching case:', {
            case_number: caseItem.case_number,
            case_id: caseItem.case_id,
            id: caseItem.id
          });
        }
        
        return matches;
      });
      
      console.log('🔍 Extracted case mention result:', { caseRef, foundCase });
      return foundCase;
    }
    return null;
  };

  const sendMentionNotifications = async (message, mentionedUser, mentionedCase) => {
    try {
      const token = getToken();
      
      const notificationData = {
        message: message,
        // Use room_id instead of id
        room_id: selectedRoom?.room_id
      };

      if (mentionedUser) {
        notificationData.mentioned_user_id = mentionedUser.id;
        console.log('🔔 Adding user mention for:', mentionedUser.email);
      }

      if (mentionedCase) {
        notificationData.mentioned_case_id = mentionedCase.case_id || mentionedCase.id;
        console.log('🔔 Adding case mention for:', mentionedCase.case_number || mentionedCase.case_id || mentionedCase.id);
      }

      console.log('📨 Sending mention notification:', notificationData);

      const result = await NotificationService.createMentionNotification(notificationData);
      console.log('✅ Notification creation result:', result);
      
    } catch (err) {
      console.error('❌ Error sending mention notification:', err);
    }
  };

  // Handle sending messages with notification support
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      setSending(true);
      
      let usersArray = users;
      let casesArray = cases;

      console.log("🔄 Checking data readiness before mention extraction...");

      if (!usersLoaded || usersArray.length === 0) {
        console.log("⏳ Waiting for users to fully load...");
        usersArray = await loadUsers();
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log("✅ Users loaded:", usersArray);
      }

      if (!casesLoaded || casesArray.length === 0) {
        console.log("⏳ Waiting for cases to fully load...");
        casesArray = await loadCases();
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log("✅ Cases loaded:", casesArray);
      }

      const mentionedUser = extractMentionedUser(newMessage, usersArray);
      const mentionedCase = extractMentionedCase(newMessage, casesArray);
      
      console.log('💬 Sending message with mentions:', {
        message: newMessage,
        mentionedUser,
        mentionedCase,
        usersLoaded,
        usersCount: usersArray?.length,
        casesLoaded,
        casesCount: casesArray?.length
      });
      
      // Use room_id instead of id
      await chatService.sendMessage(selectedRoom.room_id, newMessage);
      
      if (mentionedUser || mentionedCase) {
        console.log('🔔 Sending notifications for mentions...');
        await sendMentionNotifications(newMessage, mentionedUser, mentionedCase);
      }
      
      setNewMessage('');
      
      await loadMessages(selectedRoom);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      await chatService.createRoom(newRoomName);
      setNewRoomName('');
      setShowCreateRoom(false);
      await loadRooms();
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
    }
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    setShowUserSuggestions(false);
    setShowCaseSuggestions(false);
    setSuggestionIndex(0);

    if (currentWord.startsWith('@') && !currentWord.startsWith('#')) {
      if (!usersLoaded) {
        console.log('⚠️ Users not loaded, skipping user suggestions');
        return;
      }
      const searchTerm = currentWord.substring(1).toLowerCase();
      
      // Filter out current user from suggestions
      const filtered = users.filter(user => {
        if (user.id === currentUser?.id) return false; // Remove current user
        
        const email = user?.email || '';
        const firstName = user?.first_name || '';
        const lastName = user?.last_name || '';
        
        return (
          email.toLowerCase().includes(searchTerm) ||
          firstName.toLowerCase().includes(searchTerm) ||
          lastName.toLowerCase().includes(searchTerm)
        );
      });
      setFilteredUsers(filtered);
      setShowUserSuggestions(filtered.length > 0);
    }
    else if (currentWord.startsWith('#')) {
      if (!casesLoaded) {
        console.log('⚠️ Cases not loaded, skipping case suggestions');
        return;
      }
      const searchTerm = currentWord.substring(1).toLowerCase();
      
      const filtered = cases.filter(caseItem => {
        const caseNumber = caseItem?.case_number || '';
        const caseId = caseItem?.case_id?.toString() || caseItem?.id?.toString() || '';
        const primaryType = caseItem?.primary_type || '';
        
        return (
          caseNumber.toLowerCase().includes(searchTerm) ||
          caseId.includes(searchTerm) ||
          primaryType.toLowerCase().includes(searchTerm) ||
          `#${caseNumber}`.toLowerCase().includes(searchTerm)
        );
      });
      setFilteredCases(filtered);
      setShowCaseSuggestions(filtered.length > 0);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showUserSuggestions && !showCaseSuggestions) return;

    const suggestions = showUserSuggestions ? filteredUsers : filteredCases;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && (showUserSuggestions || showCaseSuggestions)) {
      e.preventDefault();
      selectSuggestion(suggestionIndex);
    } else if (e.key === 'Escape') {
      setShowUserSuggestions(false);
      setShowCaseSuggestions(false);
    }
  };

  const selectSuggestion = (index) => {
    const cursorPosition = messageInputRef.current.selectionStart;
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    let replacement = '';
    
    if (showUserSuggestions && filteredUsers[index]) {
      const user = filteredUsers[index];
      replacement = `@${user.email}`;
    } else if (showCaseSuggestions && filteredCases[index]) {
      const caseItem = filteredCases[index];
      replacement = `#${caseItem.case_number || caseItem.case_id || caseItem.id}`;
    }

    const newText = textBeforeCursor.substring(0, textBeforeCursor.lastIndexOf(currentWord)) + replacement + ' ';
    const textAfterCursor = newMessage.substring(cursorPosition);
    const finalText = newText + textAfterCursor;

    setNewMessage(finalText);
    setShowUserSuggestions(false);
    setShowCaseSuggestions(false);
    setSuggestionIndex(0);

    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(newText.length, newText.length);
      }
    }, 0);
  };

  // Navigation handlers
  const handleDashboardClick = () => {
    if (userIsAdmin) {
      navigate('/admin-dashboard/');
    } else {
      navigate('/dashboard/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login/');
  };

  // Get user display name
  const getUserDisplayName = (sender) => {
    if (!sender) return '';
    
    const firstName = sender?.first_name || '';
    const lastName = sender?.last_name || '';
    const email = sender?.email || '';
    
    const name = `${firstName} ${lastName}`.trim();
    return name || email || '';
  };

  // Get user profile photo URL
  const getUserPhotoUrl = (sender) => {
    if (sender?.profile_photo) {
      return sender.profile_photo.startsWith('http') 
        ? sender.profile_photo 
        : `${window.location.origin}${sender.profile_photo}`;
    }
    return null;
  };

  const formatMessageText = (text, mentionedCase, mentionedUser) => {
    let formattedText = text;

    if (mentionedCase) {
      const caseNumber = mentionedCase.case_number || mentionedCase.case_id || mentionedCase.id;
      const caseId = mentionedCase.case_id || mentionedCase.id;
      
      const caseMentionPatterns = [
        `#${caseNumber}`,
        `#${caseId}`,
        `#${mentionedCase.id}`
      ];

      caseMentionPatterns.forEach(pattern => {
        if (formattedText.includes(pattern)) {
          formattedText = formattedText.replace(
            pattern,
            `<span class="case-link" data-case-id="${caseId}" style="cursor:pointer; text-decoration: underline; background-color: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #90caf9;">
              📁 Case ${caseNumber}
            </span>`
          );
        }
      });
    }

    if (mentionedUser) {
      const userMention = `@${mentionedUser.email}`;
      const userDisplayName = getUserDisplayName(mentionedUser);
      if (formattedText.includes(userMention)) {
        formattedText = formattedText.replace(
          userMention,
          `<span class="badge" style="background-color: #e8f5e8; color: #2e7d32; border: 1px solid #a5d6a7; font-weight: bold;">
            👤 @${userDisplayName}
          </span>`
        );
      }
    }

    return { __html: formattedText };
  };

  if (loading && rooms.length === 0) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
            <div className="ms-auto d-flex align-items-center">
              <Button 
                variant="primary" 
                size="sm" 
                className="me-2" 
                onClick={handleDashboardClick}
              >
                {userIsAdmin ? 'Admin Dashboard' : 'Dashboard'}
              </Button>
              
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
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
          <div className="ms-auto d-flex align-items-center">
            <Button 
              variant="primary" 
              size="sm" 
              className="me-2" 
              onClick={handleDashboardClick}
            >
              {userIsAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </Button>
            
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

      <Container fluid className="py-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Row className="h-100">
          {/* Sidebar - Chat Rooms */}
          <Col md={4} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Chat Rooms</h5>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowCreateRoom(true)}
                >
                  <i className="bi bi-plus-lg"></i> New
                </Button>
              </Card.Header>
              
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {rooms.map(room => (
                    <ListGroup.Item
                      key={room.room_id}
                      action
                      active={selectedRoom?.room_id === room.room_id}
                      onClick={() => setSelectedRoom(room)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-semibold">{room.name}</div>
                        {room.case && (
                          <small className="text-muted">
                            Case: {room.case.case_number || `#${room.case.case_id || room.case.id}`}
                          </small>
                        )}
                      </div>
                      {room.case && (
                        <Badge bg="light" text="dark">
                          Case
                        </Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                  
                  {rooms.length === 0 && (
                    <ListGroup.Item className="text-center text-muted py-4">
                      <i className="bi bi-chat-dots display-4 d-block mb-2"></i>
                      No chat rooms yet
                      <br />
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setShowCreateRoom(true)}
                      >
                        Create First Room
                      </Button>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Chat Area */}
          <Col md={8} lg={9}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white">
                {selectedRoom ? (
                  <div>
                    <h5 className="mb-1 fw-bold">{selectedRoom.name}</h5>
                    {selectedRoom.case && (
                      <small className="text-muted">
                        Linked to: <Link to={`/cases/${selectedRoom.case.case_id || selectedRoom.case.id}`} className="text-decoration-none">
                          Case {selectedRoom.case.case_number || `#${selectedRoom.case.case_id || selectedRoom.case.id}`}
                        </Link>
                      </small>
                    )}
                  </div>
                ) : (
                  <h5 className="mb-0 text-muted">Select a chat room</h5>
                )}
              </Card.Header>

              <Card.Body className="d-flex flex-column p-0">
                {/* Messages Area */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-grow-1 p-3"
                  style={{ 
                    height: '400px', 
                    overflowY: 'auto',
                    background: '#f8f9fa'
                  }}
                >
                  {selectedRoom ? (
                    <>
                      {messagesLoading ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="text-muted mt-2">Loading messages...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-muted py-5">
                          <i className="bi bi-chat-text display-4 d-block mb-2"></i>
                          No messages yet
                          <br />
                          <small>Start the conversation!</small>
                        </div>
                      ) : (
                        <div>
                          {messages.map(message => {
                            const isCurrentUser = message.sender?.id === currentUser?.id;
                            const userPhoto = getUserPhotoUrl(message.sender);
                            const displayName = getUserDisplayName(message.sender);

                            return (
                              <div 
                                key={message.id}
                                className={`mb-3 d-flex ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}
                              >
                                {!isCurrentUser && (
                                  <div className="me-2 flex-shrink-0">
                                    {/* UPDATED: Make other users' profile pictures clickable */}
                                    <button 
                                      onClick={() => handleUserProfileClick(message.sender?.id)}
                                      className="btn p-0 border-0 bg-transparent"
                                      style={{ cursor: 'pointer' }}
                                      title={`View ${displayName}'s profile`}
                                    >
                                      {userPhoto ? (
                                        <Image
                                          src={userPhoto}
                                          alt={displayName}
                                          roundedCircle
                                          width="40"
                                          height="40"
                                          style={{ objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <div
                                          className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                          style={{ width: '40px', height: '40px' }}
                                        >
                                          <i className="bi bi-person text-muted"></i>
                                        </div>
                                      )}
                                    </button>
                                  </div>
                                )}
                                
                                <div 
                                  className={`rounded p-3 ${isCurrentUser ? 'bg-primary text-white' : 'bg-white border'}`}
                                  style={{ maxWidth: '70%' }}
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    {!isCurrentUser && displayName && (
                                      <small className={`fw-bold ${isCurrentUser ? 'text-white-50' : 'text-muted'}`}>
                                        {displayName}
                                      </small>
                                    )}
                                    {isCurrentUser && (
                                      <small className="text-white-50">You</small>
                                    )}
                                    <small className={`ms-2 ${isCurrentUser ? 'text-white-50' : 'text-muted'}`}>
                                      {formatTime(message.created_at)}
                                    </small>
                                  </div>
                                  
                                  <div 
                                    className="message-content"
                                    dangerouslySetInnerHTML={formatMessageText(
                                      message.text,
                                      message.mentioned_case,
                                      message.mentioned_user
                                    )}
                                  />
                                  
                                  {(message.mentioned_case || message.mentioned_user) && (
                                    <div className="mt-2">
                                      {message.mentioned_case && (
                                        <Badge 
                                          bg="light" 
                                          text="dark" 
                                          className="me-1 border"
                                          style={{ backgroundColor: '#e3f2fd', color: '#1565c0', borderColor: '#90caf9' }}
                                        >
                                          <i className="bi bi-folder me-1"></i>
                                          Case {message.mentioned_case.case_number || message.mentioned_case.case_id || message.mentioned_case.id}
                                        </Badge>
                                      )}
                                      {message.mentioned_user && (
                                        <Badge 
                                          bg="light" 
                                          text="dark" 
                                          className="border"
                                          style={{ backgroundColor: '#e8f5e8', color: '#2e7d32', borderColor: '#a5d6a7' }}
                                        >
                                          <i className="bi bi-person me-1"></i>
                                          {getUserDisplayName(message.mentioned_user)}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {isCurrentUser && (
                                  <div className="ms-2 flex-shrink-0">
                                    {/* Current user's profile picture still links to profile page */}
                                    <Link to="/profile" className="text-decoration-none">
                                      {userPhoto ? (
                                        <Image
                                          src={userPhoto}
                                          alt={displayName}
                                          roundedCircle
                                          width="40"
                                          height="40"
                                          style={{ objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <div
                                          className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                          style={{ width: '40px', height: '40px' }}
                                        >
                                          <i className="bi bi-person text-muted"></i>
                                        </div>
                                      )}
                                    </Link>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-chat-left-dots display-4 d-block mb-2"></i>
                      Select a chat room to start messaging
                    </div>
                  )}
                </div>

                {/* Message Input with Autocomplete */}
                {selectedRoom && (
                  <div className="border-top bg-white p-3 position-relative">
                    <Form onSubmit={handleSendMessage}>
                      <InputGroup className="position-relative">
                        <Form.Control
                          ref={messageInputRef}
                          type="text"
                          placeholder={
                            !usersLoaded || !casesLoaded
                              ? "Loading users and cases..." 
                              : "Type your message... Use @ for other users, # for cases"
                          }
                          value={newMessage}
                          onChange={handleMessageChange}
                          onKeyDown={handleKeyDown}
                          disabled={sending || messagesLoading}
                        />
                        <Button 
                          variant="primary" 
                          type="submit" 
                          disabled={!newMessage.trim() || sending || messagesLoading}
                        >
                          {sending ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <i className="bi bi-send"></i>
                          )}
                        </Button>

                        {/* User Suggestions Dropdown */}
                        {showUserSuggestions && (
                          <div className="position-absolute bottom-100 start-0 end-0 bg-white border rounded shadow-lg mb-1 z-3">
                            {filteredUsers.length === 0 ? (
                              <div className="p-2 text-muted text-center">
                                <small>No other users found</small>
                              </div>
                            ) : (
                              filteredUsers.map((user, index) => (
                                <div
                                  key={user.id}
                                  className={`p-2 cursor-pointer d-flex align-items-center ${
                                    index === suggestionIndex ? 'bg-light' : ''
                                  }`}
                                  onClick={() => selectSuggestion(index)}
                                  onMouseEnter={() => setSuggestionIndex(index)}
                                >
                                  <Image
                                    src={getUserPhotoUrl(user) || '/default-avatar.png'}
                                    alt={getUserDisplayName(user)}
                                    roundedCircle
                                    width="30"
                                    height="30"
                                    className="me-2"
                                  />
                                  <div className="flex-grow-1">
                                    <div className="fw-bold">{getUserDisplayName(user)}</div>
                                    <small className="text-muted d-block">
                                      {user.email}
                                    </small>
                                  </div>
                                  <small className="text-muted text-nowrap">
                                    {user.rank || 'Officer'}
                                  </small>
                                </div>
                              ))
                            )}
                            <div className="border-top p-2 small text-muted">
                              <i className="bi bi-info-circle me-1"></i>
                              You cannot mention yourself
                            </div>
                          </div>
                        )}

                        {/* Case Suggestions Dropdown */}
                        {showCaseSuggestions && (
                          <div className="position-absolute bottom-100 start-0 end-0 bg-white border rounded shadow-lg mb-1 z-3">
                            {filteredCases.map((caseItem, index) => (
                              <div
                                key={caseItem.case_id || caseItem.id}
                                className={`p-2 cursor-pointer ${
                                  index === suggestionIndex ? 'bg-light' : ''
                                }`}
                                onClick={() => selectSuggestion(index)}
                                onMouseEnter={() => setSuggestionIndex(index)}
                              >
                                <div className="fw-bold">
                                  Case {caseItem.case_number || caseItem.case_id || caseItem.id}
                                </div>
                                <small className="text-muted">
                                  {caseItem.primary_type} • {caseItem.status}
                                </small>
                              </div>
                            ))}
                          </div>
                        )}
                      </InputGroup>
                    </Form>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* NEW: User Profile Modal */}
      <Modal show={showUserProfileModal} onHide={() => setShowUserProfileModal(false)} size="md">
        <Modal.Header closeButton>
          <Modal.Title>User Profile</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {userProfileLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">Loading profile...</p>
            </div>
          ) : selectedUserProfile ? (
            <div className="text-center">
              {/* User Profile Photo */}
              <div className="mb-3">
                {getUserPhotoUrl(selectedUserProfile) ? (
                  <Image
                    src={getUserPhotoUrl(selectedUserProfile)}
                    alt="Profile"
                    roundedCircle
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    className="border"
                  />
                ) : (
                  <div
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto"
                    style={{ width: '100px', height: '100px', border: '2px dashed #dee2e6' }}
                  >
                    <i className="bi bi-person text-muted" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                )}
              </div>

              {/* User Information */}
              <h5 className="fw-bold">
                {selectedUserProfile.first_name} {selectedUserProfile.last_name}
              </h5>
              
              <p className="text-muted mb-3">{selectedUserProfile.email}</p>

              {/* Profile Details */}
              <div className="text-start">
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Rank:</Col>
                  <Col sm={8}>{selectedUserProfile.rank || 'Not specified'}</Col>
                </Row>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Staff ID:</Col>
                  <Col sm={8}>{selectedUserProfile.staff_id || 'Not specified'}</Col>
                </Row>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Jurisdiction:</Col>
                  <Col sm={8}>{selectedUserProfile.jurisdiction || 'Not specified'}</Col>
                </Row>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Role:</Col>
                  <Col sm={8}>
                    {selectedUserProfile.is_admin || selectedUserProfile.is_staff ? (
                      <Badge bg="warning">Administrator</Badge>
                    ) : (
                      <Badge bg="primary">Officer</Badge>
                    )}
                  </Col>
                </Row>
                {selectedUserProfile.bio && (
                  <Row className="mb-2">
                    <Col sm={4} className="fw-semibold">Bio:</Col>
                    <Col sm={8}>
                      <small className="text-muted">{selectedUserProfile.bio}</small>
                    </Col>
                  </Row>
                )}
                {selectedUserProfile.phone_number && (
                  <Row className="mb-2">
                    <Col sm={4} className="fw-semibold">Phone:</Col>
                    <Col sm={8}>
                      <small className="text-muted">{selectedUserProfile.phone_number}</small>
                    </Col>
                  </Row>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 d-flex gap-2 justify-content-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    // You could add functionality to message this user directly
                    setNewMessage(`@${selectedUserProfile.email} `);
                    setShowUserProfileModal(false);
                    messageInputRef.current?.focus();
                  }}
                >
                  <i className="bi bi-chat me-1"></i> Mention
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setShowUserProfileModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted py-4">
              <i className="bi bi-exclamation-triangle display-4 d-block mb-2"></i>
              <p>Unable to load user information</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Case Details Modal */}
      <Modal show={showCaseModal} onHide={() => setShowCaseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Case Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedCaseForModal ? (
            <>
              <p><strong>Case Number:</strong> {selectedCaseForModal.case_number}</p>
              <p><strong>Primary Type:</strong> {selectedCaseForModal.primary_type}</p>
              <p><strong>Status:</strong> {selectedCaseForModal.status}</p>
              <p><strong>Description:</strong> {selectedCaseForModal.description}</p>

              <Link 
                to={`/cases/${selectedCaseForModal.case_id || selectedCaseForModal.id}`} 
                className="btn btn-primary btn-sm mt-2"
              >
                Open Full Case Page
              </Link>
            </>
          ) : (
            <p>No details available</p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCaseModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Room Modal */}
      <Modal show={showCreateRoom} onHide={() => setShowCreateRoom(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Chat Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Room Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <Form.Text className="text-muted">
              You can optionally link this room to a specific case later.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateRoom(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateRoom}
            disabled={!newRoomName.trim()}
          >
            Create Room
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}