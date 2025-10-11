import pandas as pd
import lightgbm as lgb
import joblib

# Load model and features only once (not inside the function)
model = lgb.Booster(model_file=r"C:\mini project\vigilai\backend\ml\data\suspect_lightgbm_model.txt")
feature_columns = joblib.load(r"C:\mini project\vigilai\backend\ml\data\feature_columns.pkl")

def predict_suspects(case_data: dict):
    """
    case_data: dictionary containing new case details (crime info)
    Returns: list of top predicted suspects with probabilities
    """

    # Convert the input data into a dataframe
    df = pd.DataFrame([case_data])

    # Keep only columns used in training
    df = df[feature_columns]

    # Make predictions
    preds = model.predict(df)

    # Combine results with suspect IDs if available
    result_df = pd.DataFrame({
        "suspect_id": case_data.get("suspect_candidates", ["Unknown"]),
        "chance": preds
    }).sort_values(by="chance", ascending=False)

    # Return top 5 suspects
    return result_df.head(5).to_dict(orient="records")
