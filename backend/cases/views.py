from django.shortcuts import render
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction, Criminal
from .serializers import (
    CaseSerializer,
    EvidenceSerializer,
    WitnessSerializer,
    CriminalRecordSerializer,
    CriminalSerializer,
    CriminalRecordCreateSerializer,
)
from .permissions import IsOwnerOrReadOnly
from django.http import JsonResponse
from .ml_utils import predict_suspects, predict_multiple_suspects, save_predictions_to_db, get_predictions_for_case
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime
from dateutil import parser
import logging
from rest_framework import status
from django.db import models


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

    def post(self, request, case_id):
        """
        Get prediction for a specific case and save to database
        """
        try:
            # Get case from database
            try:
                case = Case.objects.get(case_id=case_id)
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
                # Save predictions to database
                save_success = save_predictions_to_db(case, prediction_result)
                
                if save_success:
                    prediction_result["prediction_id"] = f"case_{case_id}"
                    prediction_result["case_id"] = case_id
                    prediction_result["saved_to_db"] = True
                    
                    logger.info(f"✅ Case prediction saved for case {case_id}")
                    return Response(prediction_result, status=status.HTTP_200_OK)
                else:
                    prediction_result["saved_to_db"] = False
                    prediction_result["warning"] = "Predictions generated but could not save to database"
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

    def get(self, request, case_id):
        """
        Get existing predictions for a case using ML utils function
        """
        try:
            # Use the ML utils function to get predictions
            predictions_result = get_predictions_for_case(case_id)
            
            if predictions_result["success"]:
                return Response({
                    "case_id": case_id,
                    "predictions": predictions_result["predictions"],
                    "count": predictions_result["count"],
                    "success": True
                })
            else:
                return Response(
                    {"error": predictions_result.get("error", "Failed to fetch predictions")}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"❌ Error fetching predictions: {str(e)}")
            return Response(
                {"error": f"Error fetching predictions: {str(e)}"}, 
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
        
        # Prepare ML features - using updated field names
        ml_data = {
            # Core case information - updated field names
            "primary_type": data.get("crime_type", data.get("primary_type", "THEFT")).upper(),
            "description": data.get("description", "GENERAL THEFT"),
            "location_description": data.get("location", data.get("location_description", "STREET")),
            "district": int(data.get("district", 5)),
            "ward": int(data.get("ward", 10)),
            
            # Temporal features
            "hour": dt.hour,
            "day_of_week": dt.weekday(),
            "is_weekend": 1 if dt.weekday() >= 5 else 0,
            
            # Suspect matching features - updated field names
            "same_district": int(data.get("same_district", 1)),
            "criminal_age": int(data.get("suspect_age", data.get("criminal_age", 30))),
            
            # Additional context
            "criminal_name": data.get("suspect_name", data.get("criminal_name", "Unknown")),
            "previous_offenses": data.get("previous_offenses", "No prior offenses"),
        }
        
        # Ensure all required ML features are present
        required_ml_features = ['hour', 'day_of_week', 'is_weekend', 'primary_type', 
                               'description', 'location_description', 'district', 'ward', 
                               'same_district', 'criminal_age']
        
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
        "primary_type": case.primary_type or "THEFT",
        "description": case.description or "GENERAL THEFT",
        "location_description": case.location_description or "STREET",
        "district": case.district or 5,
        "ward": case.ward or 10,
        "datetime": case.date_time.isoformat() if case.date_time else datetime.now().isoformat(),
        "same_district": 1,
        "criminal_age": 30
    }

# -------------------------------
# Criminal Database Views
# -------------------------------

class CriminalSearchView(APIView):
    """
    Search criminals in database for manual lookup
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            search_query = request.GET.get('q', '')
            district = request.GET.get('district')
            age_min = request.GET.get('age_min')
            age_max = request.GET.get('age_max')
            gender = request.GET.get('gender')
            
            criminals = Criminal.objects.all()
            
            if search_query:
                criminals = criminals.filter(criminal_name__icontains=search_query)
            
            if district:
                criminals = criminals.filter(criminal_district=district)
            
            if age_min:
                criminals = criminals.filter(criminal_age__gte=age_min)
            
            if age_max:
                criminals = criminals.filter(criminal_age__lte=age_max)
            
            if gender:
                criminals = criminals.filter(criminal_gender=gender)
            
            serializer = CriminalSerializer(criminals[:50], many=True)  # Limit results
            return Response({
                "count": criminals.count(),
                "results": serializer.data
            })
            
        except Exception as e:
            logger.error(f"❌ Criminal search error: {str(e)}")
            return Response(
                {"error": f"Search failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CriminalStatsView(APIView):
    """
    Get statistics about criminals in database
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            total_criminals = Criminal.objects.count()
            
            # Age distribution
            age_stats = Criminal.objects.aggregate(
                avg_age=models.Avg('criminal_age'),
                min_age=models.Min('criminal_age'),
                max_age=models.Max('criminal_age')
            )
            
            # Gender distribution
            gender_stats = Criminal.objects.values('criminal_gender').annotate(
                count=models.Count('criminal_id')
            )
            
            # District distribution
            district_stats = Criminal.objects.values('criminal_district').annotate(
                count=models.Count('criminal_id')
            ).order_by('criminal_district')
            
            return Response({
                "total_criminals": total_criminals,
                "age_statistics": age_stats,
                "gender_distribution": list(gender_stats),
                "district_distribution": list(district_stats),
                "database_updated": Criminal.objects.latest('created_at').created_at if total_criminals > 0 else "No data"
            })
            
        except Exception as e:
            logger.error(f"❌ Criminal stats error: {str(e)}")
            return Response(
                {"error": f"Stats retrieval failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

    @action(detail=True, methods=['post'])
    def generate_prediction(self, request, pk=None):
        """
        Generate predictions for a specific case
        """
        case = self.get_object()
        prediction_view = CasePredictionView()
        return prediction_view.post(request, case.case_id)

    @action(detail=True, methods=['get'])
    def prediction_results(self, request, pk=None):
        """
        Get prediction results for a specific case
        """
        case = self.get_object()
        prediction_view = CasePredictionView()
        return prediction_view.get(request, case.case_id)

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
# Criminal ViewSet
# -------------------------------
class CriminalViewSet(viewsets.ModelViewSet):
    """
    CRUD for Criminal (Suspect)
    """
    queryset = Criminal.objects.all().order_by('-created_at')
    serializer_class = CriminalSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search criminals
        """
        search_view = CriminalSearchView()
        return search_view.get(request)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get criminal database statistics
        """
        stats_view = CriminalStatsView()
        return stats_view.get(request)

# -------------------------------
# Criminal Record ViewSet (FIXED)
# -------------------------------
class CriminalRecordViewSet(viewsets.ModelViewSet):
    """
    Handle criminal records with support for both existing and new criminals
    """
    queryset = CriminalRecord.objects.select_related('case', 'suspect').order_by('-created_at')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """
        Use appropriate serializer based on request data
        """
        if self.action == 'create':
            # Check if we're creating with new criminal data
            request_data = self.request.data
            if 'criminal_name' in request_data:
                return CriminalRecordCreateSerializer
        return CriminalRecordSerializer

    def create(self, request, *args, **kwargs):
        """
        Create criminal record - handles both existing and new criminals
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            record = serializer.save()
            
            return Response({
                "message": "Criminal record created successfully.",
                "data": CriminalRecordSerializer(record).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"❌ Criminal record creation error: {str(e)}")
            return Response(
                {"error": f"Failed to create criminal record: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_queryset(self):
        """
        Filter records by case if case_id provided
        """
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @action(detail=False, methods=['get'])
    def by_case(self, request):
        """
        Get all criminal records for a specific case
        """
        case_id = request.query_params.get('case')
        if not case_id:
            raise ValidationError({"case": "This query parameter is required"})
        
        records = CriminalRecord.objects.filter(case_id=case_id).select_related('suspect')
        serializer = CriminalRecordSerializer(records, many=True)
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
        from .ml_utils import model, feature_cols, category_mappings, train_data, criminal_queryset
        
        ml_status = "healthy" if all([model, feature_cols, category_mappings]) else "degraded"
        data_status = "healthy" if train_data is not None else "degraded"
        db_status = "healthy" if criminal_queryset is not None else "degraded"
        
        return Response({
            "status": "operational",
            "ml_utils": ml_status,
            "training_data": data_status,
            "criminal_database": db_status,
            "criminal_count": criminal_queryset.count() if criminal_queryset else 0,
            "timestamp": datetime.now().isoformat()
        })