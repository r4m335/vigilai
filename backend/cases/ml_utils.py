import joblib
import lightgbm as lgb
import pandas as pd
import os
import logging
import numpy as np
from typing import Dict, List, Any, Tuple

# ---------------------------
# Logging Setup
# ---------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------
# Paths Setup
# ---------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = r"C:\mini project\vigilai\backend\ml\data\suspect_lightgbm_model.txt"
FEATURES_PATH = r"C:\mini project\vigilai\backend\ml\data\feature_columns.pkl"
CATEGORY_MAP_PATH = r"C:\mini project\vigilai\backend\ml\data\category_mappings.pkl"
TRAIN_DATA_PATH = r"C:\mini project\vigilai\backend\ml\data\train.csv"
SUSPECT_LIST_PATH = r"C:\mini project\vigilai\backend\ml\data\Suspect_list.csv"

# ---------------------------
# Global Variables
# ---------------------------
model = None
feature_cols = None
category_mappings = None
train_data = None
suspect_list_df = None

# ---------------------------
# Load Model, Metadata and Data
# ---------------------------
def load_resources():
    """Load all required resources for prediction"""
    global model, feature_cols, category_mappings, train_data, suspect_list_df
    
    try:
        model = lgb.Booster(model_file=MODEL_PATH)
        feature_cols = joblib.load(FEATURES_PATH)
        category_mappings = joblib.load(CATEGORY_MAP_PATH)
        
        # Load training data
        if os.path.exists(TRAIN_DATA_PATH):
            train_data = pd.read_csv(TRAIN_DATA_PATH)
            logger.info(f"✅ Training data loaded with {len(train_data)} records")
        
        # Load suspect list
        if os.path.exists(SUSPECT_LIST_PATH):
            suspect_list_df = pd.read_csv(SUSPECT_LIST_PATH)
            suspect_list_df = suspect_list_df.rename(columns={
                'Suspect_id': 'suspect_id',
                'Name': 'name', 
                'Gender': 'gender',
                'Age': 'age',
                'District': 'district'
            })
            logger.info(f"✅ Suspect list loaded with {len(suspect_list_df)} suspects")
        
        logger.info("✅ All resources loaded successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error loading resources: {e}")
        return False

# Initialize on import
load_resources()

# ---------------------------
# Data Validation
# ---------------------------
def validate_prediction_data(data: Dict) -> Tuple[bool, str]:
    """Validate prediction request data"""
    required_fields = ['Primary Type', 'District', 'Location Description']
    
    for field in required_fields:
        if field not in data or data[field] is None:
            return False, f"Missing required field: {field}"
    
    # Validate numerical fields
    try:
        int(data.get('District', 0))
        int(data.get('Ward', 0))
        int(data.get('hour', 0))
        int(data.get('day_of_week', 0))
    except (TypeError, ValueError):
        return False, "Numerical fields must be valid integers"
    
    return True, "Valid"

# ---------------------------
# Enhanced Suspect Matching
# ---------------------------
def find_similar_suspects_enhanced(case_features: Dict[str, Any], top_n: int = 10) -> List[Dict[str, Any]]:
    """
    Find similar suspects from both training data and suspect list
    """
    try:
        all_suspects = []
        
        # Search in training data
        if train_data is not None:
            train_suspects = find_similar_in_training_data(case_features, top_n)
            all_suspects.extend(train_suspects)
        
        # Search in suspect list
        if suspect_list_df is not None:
            list_suspects = find_similar_in_suspect_list(case_features, top_n)
            all_suspects.extend(list_suspects)
        
        # Sort by similarity and remove duplicates
        unique_suspects = remove_duplicate_suspects(all_suspects)
        unique_suspects.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return unique_suspects[:top_n]
        
    except Exception as e:
        logger.error(f"❌ Error in enhanced suspect matching: {e}")
        return []

def find_similar_in_training_data(case_features: Dict[str, Any], top_n: int) -> List[Dict[str, Any]]:
    """Find similar suspects in training data"""
    similarities = []
    
    for idx, suspect in train_data.iterrows():
        similarity_score = calculate_similarity_score(case_features, suspect, data_type='training')
        
        similarities.append({
            'id': suspect.get('suspect_Suspect_id', f'S{idx}'),
            'name': suspect.get('suspect_Name', 'Unknown'),
            'age': suspect.get('suspect_Age', 30),
            'gender': suspect.get('suspect_Gender', 'Unknown'),
            'district': suspect.get('suspect_District', 'Unknown'),
            'ward': suspect.get('Ward', 'Unknown'),
            'crime_type': suspect.get('Primary Type', 'Unknown'),
            'location': suspect.get('Location Description', 'Unknown'),
            'similarity_score': similarity_score,
            'data_source': 'training_data'
        })
    
    similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
    return similarities[:top_n]

def find_similar_in_suspect_list(case_features: Dict[str, Any], top_n: int) -> List[Dict[str, Any]]:
    """Find similar suspects in suspect list"""
    similarities = []
    
    for idx, suspect in suspect_list_df.iterrows():
        similarity_score = calculate_similarity_score(case_features, suspect, data_type='suspect_list')
        
        similarities.append({
            'id': suspect.get('suspect_id', f'SL{idx}'),
            'name': suspect.get('name', 'Unknown'),
            'age': suspect.get('age', 30),
            'gender': suspect.get('gender', 'Unknown'),
            'district': suspect.get('district', 'Unknown'),
            'ward': 'Unknown',  # Suspect list doesn't have ward
            'crime_type': 'Unknown',  # Suspect list doesn't have crime type
            'location': 'Unknown',
            'similarity_score': similarity_score,
            'data_source': 'suspect_list'
        })
    
    similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
    return similarities[:top_n]

def remove_duplicate_suspects(suspects: List[Dict]) -> List[Dict]:
    """Remove duplicate suspects based on name and age"""
    seen = set()
    unique_suspects = []
    
    for suspect in suspects:
        identifier = f"{suspect['name']}_{suspect['age']}_{suspect['district']}"
        if identifier not in seen:
            seen.add(identifier)
            unique_suspects.append(suspect)
    
    return unique_suspects

def calculate_similarity_score(case_features: Dict, suspect: pd.Series, data_type: str) -> float:
    """
    Calculate similarity score between case features and suspect
    """
    score = 0.0
    total_weight = 0
    
    # Different weights based on data source
    if data_type == 'training':
        weights = {
            'Primary Type': 0.25,
            'District': 0.20,
            'Ward': 0.15,
            'Location Description': 0.15,
            'suspect_Age': 0.10,
            'hour': 0.08,
            'day_of_week': 0.07
        }
    else:  # suspect_list
        weights = {
            'District': 0.35,
            'suspect_Age': 0.25,
            'Gender': 0.20,
            'Primary Type': 0.20
        }
    
    for feature, weight in weights.items():
        case_value = case_features.get(feature)
        suspect_value = suspect.get(feature)
        
        if case_value is not None and suspect_value is not None:
            if feature in ['District', 'Ward', 'hour', 'day_of_week', 'suspect_Age']:
                # Numerical similarity (normalized)
                if feature == 'suspect_Age':
                    age_diff = abs(int(case_value) - int(suspect_value))
                    age_similarity = max(0, 1 - (age_diff / 50))  # Normalize age difference
                    score += weight * age_similarity
                else:
                    if case_value == suspect_value:
                        score += weight
            else:
                # Categorical similarity
                if str(case_value).lower() == str(suspect_value).lower():
                    score += weight
        
        total_weight += weight
    
    return score / total_weight if total_weight > 0 else 0.0

# ---------------------------
# ML Prediction Functions
# ---------------------------
def get_ml_prediction(features: Dict[str, Any]) -> float:
    """Get prediction from ML model"""
    try:
        if model is None or feature_cols is None:
            raise RuntimeError("Model or feature columns not loaded")
        
        # Build DataFrame for prediction
        df_data = {col: [features.get(col, 0)] for col in feature_cols}
        df = pd.DataFrame(df_data)[feature_cols]
        
        # Apply category alignment
        for col, categories in category_mappings.items():
            if col in df.columns:
                df[col] = df[col].astype("category")
                df.loc[~df[col].isin(categories), col] = pd.NA
                df[col] = pd.Categorical(df[col], categories=categories)
        
        # Predict
        probability = float(model.predict(df)[0])
        return probability
        
    except Exception as e:
        logger.error(f"❌ ML prediction error: {e}")
        return 0.5  # Return neutral probability on error

def prepare_ml_features(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare features for ML model prediction"""
    ml_features = {}
    
    # Map request data to ML features
    mapping = {
        'Primary Type': 'Primary Type',
        'Description': 'Description', 
        'Location Description': 'Location Description',
        'District': 'District',
        'Ward': 'Ward',
        'hour': 'hour',
        'day_of_week': 'day_of_week',
        'is_weekend': 'is_weekend',
        'same_district': 'same_district',
        'suspect_Age': 'suspect_Age'
    }
    
    for ml_feature, request_feature in mapping.items():
        ml_features[ml_feature] = request_data.get(request_feature, 0)
    
    # Ensure all required features are present
    for feature in feature_cols:
        if feature not in ml_features:
            ml_features[feature] = 0
    
    return ml_features

# ---------------------------
# Main Prediction Function
# ---------------------------
def predict_suspects(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main prediction function - enhanced version
    """
    try:
        # Validate input
        is_valid, message = validate_prediction_data(request_data)
        if not is_valid:
            return {"success": False, "error": message}
        
        # Get ML prediction
        ml_features = prepare_ml_features(request_data)
        ml_probability = get_ml_prediction(ml_features)
        
        # Find similar suspects
        similar_suspects = find_similar_suspects_enhanced(request_data, top_n=8)
        
        # Combine results
        suspects = []
        for i, suspect in enumerate(similar_suspects):
            # Combine ML probability with similarity score
            combined_probability = (ml_probability * 0.6) + (suspect['similarity_score'] * 0.4)
            
            suspects.append({
                "rank": i + 1,
                "suspect_id": suspect['id'],
                "name": suspect['name'],
                "probability": float(combined_probability),
                "similarity_score": float(suspect['similarity_score']),
                "age": suspect['age'],
                "gender": suspect.get('gender', 'Unknown'),
                "district": suspect['district'],
                "ward": suspect.get('ward', 'Unknown'),
                "crime_type": suspect.get('crime_type', 'Unknown'),
                "location": suspect.get('location', 'Unknown'),
                "data_source": suspect.get('data_source', 'unknown'),
                "risk_level": get_risk_level(combined_probability),
                "confidence": get_confidence_level(combined_probability)
            })
        
        # Sort by final probability
        suspects.sort(key=lambda x: x['probability'], reverse=True)
        
        response = {
            "suspects": suspects[:5],  # Return top 5
            "ml_probability": ml_probability,
            "total_candidates_found": len(similar_suspects),
            "analysis": generate_analysis(suspects, ml_probability),
            "success": True,
            "model_version": "2.0-enhanced"
        }
        
        logger.info(f"✅ Prediction completed: {len(suspects)} suspects found")
        return response
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}")
        return {
            "success": False,
            "error": f"Prediction failed: {str(e)}",
            "suspects": []
        }

# ---------------------------
# Helper Functions
# ---------------------------
def get_risk_level(score: float) -> str:
    """Convert score to risk level"""
    if score >= 0.8: return "High"
    elif score >= 0.7: return "Medium-High" 
    elif score >= 0.6: return "Medium"
    elif score >= 0.5: return "Low-Medium"
    elif score >= 0.3: return "Low"
    else: return "Very Low"

def get_confidence_level(probability: float) -> str:
    """Get confidence level based on probability"""
    if probability >= 0.8: return "Very High"
    elif probability >= 0.7: return "High"
    elif probability >= 0.6: return "Medium-High"
    elif probability >= 0.5: return "Medium"
    elif probability >= 0.4: return "Low-Medium"
    else: return "Low"

def generate_analysis(suspects: List[Dict], ml_probability: float) -> str:
    """Generate comprehensive analysis"""
    if not suspects:
        return "No strong suspect matches found. Consider expanding search parameters or reviewing case details."
    
    top_suspect = suspects[0]
    
    analysis = f"AI analysis identified {len(suspects)} potential suspects from criminal databases. "
    analysis += f"Top match: {top_suspect['name']} with {top_suspect['probability']:.1%} probability. "
    
    # Add risk assessment
    if top_suspect['probability'] >= 0.7:
        analysis += "🔴 High confidence match - immediate investigation recommended. "
    elif top_suspect['probability'] >= 0.5:
        analysis += "🟡 Moderate confidence - further investigation advised. "
    else:
        analysis += "🟢 Low confidence - consider as lead only. "
    
    # Add pattern insights
    if len(suspects) >= 2:
        districts = [s['district'] for s in suspects[:3] if s['district'] != 'Unknown']
        if districts:
            common_district = max(set(districts), key=districts.count)
            analysis += f" Multiple suspects associated with District {common_district}. "
    
    # Add data source insight
    sources = [s['data_source'] for s in suspects[:3]]
    if 'training_data' in sources and 'suspect_list' in sources:
        analysis += "Matches found across both historical cases and active suspect lists."
    elif 'training_data' in sources:
        analysis += "Matches primarily from historical crime pattern analysis."
    else:
        analysis += "Matches primarily from active suspect monitoring lists."
    
    return analysis

# ---------------------------
# Multiple Suspect Prediction (Legacy Support)
# ---------------------------
def predict_multiple_suspects(case_data: Dict[str, Any], suspects_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Predict probabilities for multiple suspects (legacy function)
    """
    try:
        results = []
        
        for suspect in suspects_list:
            # Create combined data for prediction
            combined_data = {**case_data, **suspect}
            
            # Add suspect-specific features
            combined_data['suspect_Age'] = suspect.get('age', 30)
            combined_data['same_district'] = 1 if str(suspect.get('district', '')).strip() == str(case_data.get('District', '')).strip() else 0
            
            prediction = predict_suspects(combined_data)
            
            if prediction["success"] and prediction["suspects"]:
                top_match = prediction["suspects"][0]
                results.append({
                    "name": suspect.get('name', 'Unknown'),
                    "probability": top_match['probability'],
                    "age": suspect.get('age', 'Unknown'),
                    "district": suspect.get('district', 'Unknown'),
                    "risk_level": top_match['risk_level'],
                    "confidence": top_match['confidence']
                })
        
        # Sort results
        results.sort(key=lambda x: x["probability"], reverse=True)
        
        # Generate analysis
        if results:
            top_suspect = results[0]
            analysis = (
                f"AI analyzed {len(results)} suspects. "
                f"Top candidate: {top_suspect['name']} "
                f"({top_suspect['probability']:.1%} probability, {top_suspect['risk_level']} risk)."
            )
        else:
            analysis = "No valid predictions generated from provided suspect list."
        
        return {
            "suspects": results,
            "analysis": analysis, 
            "success": True
        }
        
    except Exception as e:
        logger.error(f"❌ Multiple suspect prediction error: {e}")
        return {
            "suspects": [],
            "analysis": f"Error processing suspects: {str(e)}",
            "success": False
        }