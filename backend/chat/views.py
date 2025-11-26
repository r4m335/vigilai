from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import ChatRoom, Message, Notification
from .serializers import ChatRoomSerializer, MessageSerializer, NotificationSerializer
from django.shortcuts import get_object_or_404
from cases.models import Case
from accounts.models import CustomUser as User


class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({"status": "ok"})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "ok"})


class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all().order_by('-created_at')
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related('sender', 'room', 'mentioned_case', 'mentioned_user').order_by('created_at')
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        qs = self.queryset
        if room_id:
            qs = qs.filter(room_id=room_id)
        return qs

    def perform_create(self, serializer):
        # This ensures the context with request is passed to serializer
        serializer.save()


@api_view(['POST'])
def create_mention_notification(request):
    """
    Create a notification when a user or case is mentioned in chat
    """
    data = request.data
    mentioned_user_id = data.get('mentioned_user_id')
    mentioned_case_id = data.get('mentioned_case_id')
    room_id = data.get('room_id')
    message_text = data.get('message', '')
    
    notifications_created = []
    
    # Create notification for mentioned user
    if mentioned_user_id:
        try:
            mentioned_user = get_object_or_404(User, id=mentioned_user_id)
            notification = Notification.objects.create(
                user=mentioned_user,
                message=f"You were mentioned in a chat: {message_text[:100]}...",
                type='mention',
                room_id=room_id,
                sender=request.user
            )
            notifications_created.append(notification.id)
            print(f"✅ Created mention notification for user: {mentioned_user.email}")
        except Exception as e:
            print(f"❌ Error creating user mention notification: {e}")
    
    # Create notifications for case investigators when case is mentioned
    if mentioned_case_id:
        try:
            mentioned_case = get_object_or_404(Case, id=mentioned_case_id)
            print(f"🔍 Processing case mention for case: {mentioned_case.case_number}")
            
            # Get all investigators assigned to this case
            investigators = []
            
            # Check different possible investigator field names
            if mentioned_case.investigator:
                if hasattr(mentioned_case.investigator, 'id'):
                    # Investigator is a User object
                    investigators.append(mentioned_case.investigator)
                    print(f"👤 Found investigator (object): {mentioned_case.investigator.email}")
                else:
                    # Investigator might be an ID, try to get the user
                    try:
                        investigator_user = User.objects.get(id=mentioned_case.investigator)
                        investigators.append(investigator_user)
                        print(f"👤 Found investigator (ID): {investigator_user.email}")
                    except User.DoesNotExist:
                        print(f"❌ Investigator user not found for ID: {mentioned_case.investigator}")
            
            # Check for assigned_investigator field
            if hasattr(mentioned_case, 'assigned_investigator') and mentioned_case.assigned_investigator:
                if hasattr(mentioned_case.assigned_investigator, 'id'):
                    investigators.append(mentioned_case.assigned_investigator)
                    print(f"👤 Found assigned_investigator: {mentioned_case.assigned_investigator.email}")
                else:
                    try:
                        assigned_investigator = User.objects.get(id=mentioned_case.assigned_investigator)
                        investigators.append(assigned_investigator)
                        print(f"👤 Found assigned_investigator (ID): {assigned_investigator.email}")
                    except User.DoesNotExist:
                        print(f"❌ Assigned investigator user not found for ID: {mentioned_case.assigned_investigator}")
            
            # Check for owner field (backward compatibility)
            if hasattr(mentioned_case, 'owner') and mentioned_case.owner:
                if hasattr(mentioned_case.owner, 'id'):
                    investigators.append(mentioned_case.owner)
                    print(f"👤 Found owner: {mentioned_case.owner.email}")
                else:
                    try:
                        owner_user = User.objects.get(id=mentioned_case.owner)
                        investigators.append(owner_user)
                        print(f"👤 Found owner (ID): {owner_user.email}")
                    except User.DoesNotExist:
                        print(f"❌ Owner user not found for ID: {mentioned_case.owner}")
            
            # Remove duplicates
            unique_investigators = []
            seen_ids = set()
            for investigator in investigators:
                if investigator.id not in seen_ids:
                    unique_investigators.append(investigator)
                    seen_ids.add(investigator.id)
            
            print(f"👥 Total unique investigators to notify: {len(unique_investigators)}")
            
            for investigator in unique_investigators:
                if investigator.id != request.user.id:  # Don't notify yourself
                    notification = Notification.objects.create(
                        user=investigator,
                        message=f"Case {mentioned_case.case_number} was mentioned in chat: {message_text[:100]}...",
                        type='case_mention',
                        room_id=room_id,
                        mentioned_case=mentioned_case,
                        sender=request.user
                    )
                    notifications_created.append(notification.id)
                    print(f"✅ Created case mention notification for investigator: {investigator.email}")
                else:
                    print(f"⏩ Skipping self-notification for: {investigator.email}")
                    
        except Exception as e:
            print(f"❌ Error creating case mention notification: {e}")
    
    print(f"📨 Total notifications created: {len(notifications_created)}")
    
    return Response({
        "status": "success", 
        "notifications_created": notifications_created,
        "count": len(notifications_created)
    }, status=status.HTTP_201_CREATED)