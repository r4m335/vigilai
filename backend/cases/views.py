from django.shortcuts import render
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction
from .serializers import (
    CaseSerializer,
    EvidenceSerializer,
    WitnessSerializer,
    CriminalRecordSerializer,
)
from .permissions import IsOwnerOrReadOnly
from django.http import JsonResponse
from .ml_utils import predict_suspects
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime
from dateutil import parser
import logging
from rest_framework import status


User = get_user_model()

print("🔥 REGISTER VIEW FROM:", __name__)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)



# -------------------------------
# Suspect Prediction ViewSet (ML Predictions)
# -------------------------------

@method_decorator(csrf_exempt, name='dispatch')
class PredictView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Enhanced prediction endpoint with better error handling
        """
        try:
            raw_data = request.data
            logger.info(f"📩 Received prediction request with keys: {list(raw_data.keys())}")
            
            # Prepare case data for ML model
            case_data = prepare_case_data(raw_data)
            logger.info(f"📦 Prepared ML features: {case_data}")
            
            # Get prediction
            prediction_result = predict_suspects(case_data)
            
            if prediction_result["success"]:
                # Add request metadata
                prediction_result["request_id"] = f"PRED_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                prediction_result["timestamp"] = datetime.now().isoformat()
                
                logger.info(f"✅ Prediction successful: {len(prediction_result['suspects'])} suspects found")
                return Response(prediction_result, status=status.HTTP_200_OK)
            else:
                logger.error(f"❌ Prediction failed: {prediction_result.get('error', 'Unknown error')}")
                return Response(
                    {"error": prediction_result.get("error", "Prediction failed")}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"❌ Prediction endpoint error: {str(e)}")
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class PredictMultipleSuspectsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Predict for multiple provided suspects
        """
        try:
            raw_data = request.data
            logger.info(f"📩 Received multiple suspects prediction request")
            
            # Extract case data and suspects list
            case_data = prepare_case_data(raw_data)
            suspects_list = raw_data.get('suspects', [])
            
            if not suspects_list:
                return Response(
                    {"error": "No suspects provided in request"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get predictions
            prediction_result = predict_multiple_suspects(case_data, suspects_list)
            
            if prediction_result["success"]:
                prediction_result["request_id"] = f"MULTI_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                prediction_result["timestamp"] = datetime.now().isoformat()
                
                logger.info(f"✅ Multiple prediction successful: {len(prediction_result['suspects'])} results")
                return Response(prediction_result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": prediction_result.get("error", "Prediction failed")}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"❌ Multiple prediction error: {str(e)}")
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class CasePredictionView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, case_id):
        """
        Get prediction for a specific case
        """
        try:
            # Get case from database
            try:
                case = Case.objects.get(id=case_id)
            except Case.DoesNotExist:
                return Response(
                    {"error": f"Case with ID {case_id} not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Convert case to prediction data
            case_data = prepare_case_from_model(case)
            
            # Get prediction
            prediction_result = predict_suspects(case_data)
            
            if prediction_result["success"]:
                # Save prediction to database
                prediction_record = SuspectPrediction.objects.create(
                    case=case,
                    prediction_data=prediction_result,
                    investigator=request.user
                )
                
                prediction_result["prediction_id"] = prediction_record.id
                prediction_result["case_id"] = case_id
                
                logger.info(f"✅ Case prediction saved: {prediction_record.id}")
                return Response(prediction_result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": prediction_result.get("error", "Prediction failed")}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"❌ Case prediction error: {str(e)}")
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# -------------------------------
# Data Preparation Functions
# -------------------------------

def prepare_case_data(data):
    """Prepare case data for ML prediction"""
    try:
        # Parse datetime
        datetime_str = data.get("datetime") or data.get("date_time") or data.get("occurrence_date")
        if datetime_str:
            dt = parser.parse(datetime_str)
        else:
            dt = datetime.now()
        
        # Prepare ML features
        ml_data = {
            # Core case information
            "Primary Type": data.get("crime_type", data.get("primary_type", "THEFT")).upper(),
            "Description": data.get("description", "GENERAL THEFT"),
            "Location Description": data.get("location", data.get("location_description", "STREET")),
            "District": int(data.get("district", 5)),
            "Ward": int(data.get("ward", 10)),
            
            # Temporal features
            "hour": dt.hour,
            "day_of_week": dt.weekday(),
            "is_weekend": 1 if dt.weekday() >= 5 else 0,
            
            # Suspect matching features
            "same_district": int(data.get("same_district", 1)),
            "suspect_Age": int(data.get("suspect_age", 30)),
            
            # Additional context
            "suspect_name": data.get("suspect_name", "Unknown"),
            "previous_offenses": data.get("previous_offenses", "No prior offenses"),
        }
        
        # Ensure all required ML features are present
        required_ml_features = ['hour', 'day_of_week', 'is_weekend', 'Primary Type', 
                               'Description', 'Location Description', 'District', 'Ward', 
                               'same_district', 'suspect_Age']
        
        for feature in required_ml_features:
            if feature not in ml_data:
                ml_data[feature] = 0
        
        logger.info(f"✅ Prepared ML data with {len(ml_data)} features")
        return ml_data
        
    except Exception as e:
        logger.error(f"❌ Error preparing case data: {str(e)}")
        raise ValueError(f"Invalid case data: {str(e)}")

def prepare_case_from_model(case):
    """Prepare prediction data from Case model instance"""
    return {
        "crime_type": case.type_of_crime or "THEFT",
        "description": case.description or "GENERAL THEFT",
        "location": case.location or "STREET",
        "district": case.district or 5,
        "ward": case.ward or 10,
        "datetime": case.date_time.isoformat() if case.date_time else datetime.now().isoformat(),
        "same_district": 1,
        "suspect_age": 30
    }



# -------------------------------
# Case ViewSet
# -------------------------------
class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    queryset = Case.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = Case.objects.all()
        worked_by_me = self.request.query_params.get('worked_by_me')
        if worked_by_me == 'true':
            queryset = queryset.filter(investigator=self.request.user)
        return queryset


# -------------------------------
# Evidence ViewSet
# -------------------------------
class EvidenceViewSet(viewsets.ModelViewSet):
    serializer_class = EvidenceSerializer
    queryset = Evidence.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @action(detail=False, methods=['get'])
    def by_case(self, request):
        case_id = request.query_params.get('case')
        if not case_id:
            raise ValidationError({"case": "This query parameter is required"})
        evidence = Evidence.objects.filter(case_id=case_id)
        serializer = self.get_serializer(evidence, many=True)
        return Response(serializer.data)


# -------------------------------
# Witness ViewSet
# -------------------------------
class WitnessViewSet(viewsets.ModelViewSet):
    serializer_class = WitnessSerializer
    queryset = Witness.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @action(detail=False, methods=['get'])
    def by_case(self, request):
        case_id = request.query_params.get('case')
        if not case_id:
            raise ValidationError({"case": "This query parameter is required"})
        witnesses = Witness.objects.filter(case_id=case_id)
        serializer = self.get_serializer(witnesses, many=True)
        return Response(serializer.data)


# -------------------------------
# Criminal Record ViewSet
# -------------------------------
class CriminalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalRecordSerializer
    queryset = CriminalRecord.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @action(detail=False, methods=['get'])
    def by_case(self, request):
        case_id = request.query_params.get('case')
        if not case_id:
            raise ValidationError({"case": "This query parameter is required"})
        records = CriminalRecord.objects.filter(case_id=case_id)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)





# -------------------------------
# Public Test Endpoint
# -------------------------------
class PublicEndpoint(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "This is a public endpoint"})
    

class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from .ml_utils import model, feature_cols, category_mappings, train_data, suspect_list_df
        
        ml_status = "healthy" if all([model, feature_cols, category_mappings]) else "degraded"
        data_status = "healthy" if train_data is not None else "degraded"
        
        return Response({
            "status": "operational",
            "ml_utils": ml_status,
            "training_data": data_status,
            "suspect_list": "healthy" if suspect_list_df is not None else "degraded",
            "timestamp": datetime.now().isoformat()
        })
