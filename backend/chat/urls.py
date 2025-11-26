from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, MessageViewSet
from .views import NotificationViewSet, create_mention_notification

router = DefaultRouter()
router.register(r'chat/rooms', ChatRoomViewSet)
router.register(r'chat/messages', MessageViewSet)
router.register(r'notifications', NotificationViewSet, basename='notifications')


urlpatterns = [
    path('notifications/create-mention/', create_mention_notification, name='create-mention-notification'),
    path('', include(router.urls)),
]
