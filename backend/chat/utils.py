import re
from cases.models import Case
from accounts.models import CustomUser

def extract_mentions(text):
    case_pk = None
    user_id = None

    # Detect "#token"
    case_match = re.search(r'#([A-Za-z0-9\-]+)', text)
    if case_match:
        token = case_match.group(1)
        print(f"🔍 Extracted case token: '{token}'")

        # Try numeric PK (case_id)
        if token.isdigit():
            try:
                c = Case.objects.get(case_id=int(token))
                case_pk = c.case_id
                print(f"✅ Found case by numeric ID: {c.case_number}")
            except Case.DoesNotExist:
                print(f"❌ No case found with ID: {token}")
                pass

        # Try case_number match (exact match)
        if case_pk is None:
            try:
                c = Case.objects.get(case_number__iexact=token)
                case_pk = c.case_id
                print(f"✅ Found case by case_number: {c.case_number}")
            except Case.DoesNotExist:
                print(f"❌ No case found with case_number: {token}")
                pass

        # Try case_number contains match (partial match)
        if case_pk is None:
            try:
                c = Case.objects.filter(case_number__icontains=token).first()
                if c:
                    case_pk = c.case_id
                    print(f"✅ Found case by partial case_number: {c.case_number}")
            except Case.DoesNotExist:
                print(f"❌ No case found with partial case_number: {token}")
                pass

    # Extract user mentions (@email@example.com)
    user_match = re.search(r'@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text)
    if user_match:
        email = user_match.group(1)
        try:
            user = CustomUser.objects.get(email=email)
            user_id = user.id
            print(f"✅ Found user by email: {email}")
        except CustomUser.DoesNotExist:
            print(f"❌ User not found with email: {email}")
            pass
    
    print(f"📋 Final extracted mentions - case_pk: {case_pk}, user_id: {user_id}")
    return case_pk, user_id