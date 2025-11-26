from rest_framework import serializers
from .models import Message, ChatRoom, Notification
from .utils import extract_mentions
from cases.serializers import CaseSerializer
from accounts.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    mentioned_case = CaseSerializer(read_only=True)  # Add this
    mentioned_user = UserSerializer(read_only=True)  # Add this

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender']  # Add mentioned fields

    def create(self, validated_data):
        print("📨 Incoming message data:", self.initial_data)
        text = validated_data["text"]
        case_id, user_id = extract_mentions(text)

        validated_data["sender"] = self.context["request"].user
        
        # Store the mentioned objects directly in the message
        if case_id:
            from cases.models import Case

            mentioned_case = None

            print(f"🔍 Looking for case with ID: {case_id}")

            # Try match by case_id (primary key)
            try:
                mentioned_case = Case.objects.get(case_id=case_id)
                print(f"✅ Found case by case_id: {mentioned_case.case_number}")
            except Case.DoesNotExist:
                print(f"❌ Case not found with case_id: {case_id}")
                pass

            # If still not found, try by id field (backward compatibility)
            if not mentioned_case:
                try:
                    mentioned_case = Case.objects.get(id=case_id)
                    print(f"✅ Found case by id: {mentioned_case.case_number}")
                except Case.DoesNotExist:
                    print(f"❌ Case not found with id: {case_id}")
                    pass

            if mentioned_case:
                validated_data["mentioned_case"] = mentioned_case
                print(f"✅ Storing mentioned case: {mentioned_case.case_number} (ID: {mentioned_case.case_id})")
            else:
                print(f"❌ No matching case found for: {case_id}")

        if user_id:
            try:
                from accounts.models import CustomUser as User
                mentioned_user = User.objects.get(id=user_id)
                validated_data["mentioned_user"] = mentioned_user
                print(f"✅ Storing mentioned user: {mentioned_user.email}")
            except User.DoesNotExist:
                print(f"❌ User with ID {user_id} not found")

        print(f"📝 Final validated data: {validated_data}")
        return super().create(validated_data)


class ChatRoomSerializer(serializers.ModelSerializer):
    case = CaseSerializer(read_only=True)

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'case', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    mentioned_case = CaseSerializer(read_only=True)
    room = ChatRoomSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'