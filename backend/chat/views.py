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
    Create a notification ONLY when a user is directly mentioned (@user).
    DO NOT notify owners, investigators, assigned investigators, or anyone
    when a case is mentioned (#case).
    """
    data = request.data
    mentioned_user_id = data.get('mentioned_user_id')
    message_text = data.get('message', '')
    room_id = data.get('room_id')

    notifications_created = []

    # Notify ONLY the directly mentioned user
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
            print(f"✅ Created direct user mention notification for: {mentioned_user.email}")
        except Exception as e:
            print(f"❌ Error creating direct mention notification: {e}")

    # Case mentions create ZERO notifications now
    # (Do nothing for mentioned_case_id)
    print("ℹ️ Case mention received but intentionally ignored (no notifications created).")

    return Response({
        "status": "success",
        "notifications_created": notifications_created,
        "count": len(notifications_created)
    }, status=status.HTTP_201_CREATED)
