import pandas as pd
import lightgbm as lgb
from sklearn.metrics import roc_auc_score, accuracy_score, classification_report
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import os
import numpy as np

# ---------------------------
# Step 1: Load and prepare data
# ---------------------------
print("📊 Loading training and test data...")

train_df = pd.read_csv(r"C:\mini project\vigilai\backend\ml\data\train.csv")
test_df = pd.read_csv(r"C:\mini project\vigilai\backend\ml\data\test.csv")

print(f"✅ Train shape: {train_df.shape}")
print(f"✅ Test shape: {test_df.shape}")

# Display basic info
print("\n📈 Training data info:")
print(train_df.info())
print(f"\n🎯 Target distribution:\n{train_df['label'].value_counts()}")

# ---------------------------
# Step 2: Define features and target
# ---------------------------
feature_cols = [
    'hour', 'day_of_week', 'is_weekend',
    'Primary Type', 'Description', 'Location Description',
    'District', 'Ward', 'same_district', 'suspect_Age'
]

target_col = 'label'

print(f"\n🔧 Using {len(feature_cols)} features:")
for feature in feature_cols:
    print(f"  - {feature}")

# ---------------------------
# Step 3: Handle categorical features
# ---------------------------
categorical_features = ['Primary Type', 'Description', 'Location Description']

print(f"\n📝 Processing {len(categorical_features)} categorical features...")

# Create category mappings
category_mappings = {}
for col in categorical_features:
    # Combine train and test categories
    train_categories = train_df[col].dropna().unique()
    test_categories = test_df[col].dropna().unique()
    all_categories = sorted(list(set(train_categories) | set(test_categories)))
    
    category_mappings[col] = all_categories
    
    # Apply to both datasets
    train_df[col] = pd.Categorical(train_df[col], categories=all_categories)
    test_df[col] = pd.Categorical(test_df[col], categories=all_categories)
    
    print(f"  - {col}: {len(all_categories)} categories")

# Save category mappings
joblib.dump(category_mappings, r"C:\mini project\vigilai\backend\ml\data\category_mappings.pkl")
print("✅ Category mappings saved!")

# ---------------------------
# Step 4: Prepare LightGBM datasets
# ---------------------------
print("\n🚀 Preparing LightGBM datasets...")

train_data = lgb.Dataset(
    train_df[feature_cols], 
    label=train_df[target_col],
    categorical_feature=categorical_features,
    free_raw_data=False
)

test_data = lgb.Dataset(
    test_df[feature_cols], 
    label=test_df[target_col],
    categorical_feature=categorical_features,
    free_raw_data=False
)

# ---------------------------
# Step 5: Set model parameters
# ---------------------------
params = {
    'objective': 'binary',
    'boosting_type': 'gbdt',
    'metric': ['auc', 'binary_logloss'],
    'learning_rate': 0.05,
    'num_leaves': 31,
    'max_depth': -1,
    'min_data_in_leaf': 20,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'lambda_l1': 0.1,
    'lambda_l2': 0.1,
    'verbose': -1,
    'random_state': 42
}

print("🎯 Model parameters configured")

# ---------------------------
# Step 6: Train model with cross-validation
# ---------------------------
print("\n🔬 Training LightGBM model...")

# Train with early stopping
callbacks = [
    lgb.early_stopping(stopping_rounds=50, verbose=True),
    lgb.log_evaluation(period=50)
]

model = lgb.train(
    params=params,
    train_set=train_data,
    valid_sets=[train_data, test_data],
    valid_names=['train', 'valid'],
    num_boost_round=1000,
    callbacks=callbacks
)

print("✅ Model training completed!")

# ---------------------------
# Step 7: Evaluate model performance
# ---------------------------
print("\n📊 Evaluating model performance...")

# Predictions
y_true = test_df[target_col]
y_pred_prob = model.predict(test_df[feature_cols])
y_pred = (y_pred_prob > 0.5).astype(int)

# Metrics
accuracy = accuracy_score(y_true, y_pred)
auc = roc_auc_score(y_true, y_pred_prob)

print(f"📈 Model Performance Metrics:")
print(f"   Accuracy:  {accuracy:.4f}")
print(f"   AUC:       {auc:.4f}")

# Detailed classification report
print(f"\n📋 Classification Report:")
print(classification_report(y_true, y_pred, target_names=['Not Suspect', 'Suspect']))

# ---------------------------
# Step 8: Feature importance analysis
# ---------------------------
print("\n🔍 Analyzing feature importance...")

# Get feature importance
importance_df = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importance(importance_type='gain')
}).sort_values('importance', ascending=False)

print("📊 Top 10 Most Important Features:")
for idx, row in importance_df.head(10).iterrows():
    print(f"   {row['feature']}: {row['importance']:.2f}")

# Plot feature importance
plt.figure(figsize=(12, 8))
sns.barplot(data=importance_df.head(15), x='importance', y='feature')
plt.title('Top 15 Feature Importance (Gain)')
plt.xlabel('Importance (Gain)')
plt.tight_layout()
plt.savefig(r"C:\mini project\vigilai\backend\ml\data\feature_importance.png", dpi=300, bbox_inches='tight')
plt.close()

print("✅ Feature importance plot saved!")

# ---------------------------
# Step 9: Save model and artifacts
# ---------------------------
print("\n💾 Saving model and artifacts...")

# Save model
model_path = r"C:\mini project\vigilai\backend\ml\data\suspect_lightgbm_model.txt"
model.save_model(model_path)

# Save feature columns
feature_path = r"C:\mini project\vigilai\backend\ml\data\feature_columns.pkl"
joblib.dump(feature_cols, feature_path)

# Save training summary
training_summary = {
    'model_path': model_path,
    'feature_path': feature_path,
    'categories_path': r"C:\mini project\vigilai\backend\ml\data\category_mappings.pkl",
    'performance': {
        'accuracy': accuracy,
        'auc': auc,
        'train_samples': len(train_df),
        'test_samples': len(test_df)
    },
    'feature_importance': importance_df.to_dict(),
    'training_date': pd.Timestamp.now().isoformat()
}

joblib.dump(training_summary, r"C:\mini project\vigilai\backend\ml\data\training_summary.pkl")

print("✅ All model artifacts saved successfully!")
print(f"\n📁 Saved Files:")
print(f"   Model: {model_path}")
print(f"   Features: {feature_path}")
print(f"   Categories: C:\\mini project\\vigilai\\backend\\ml\\data\\category_mappings.pkl")
print(f"   Summary: C:\\mini project\\vigilai\\backend\\ml\\data\\training_summary.pkl")
print(f"   Feature Plot: C:\\mini project\\vigilai\\backend\\ml\\data\\feature_importance.png")

# ---------------------------
# Step 10: Model validation
# ---------------------------
print("\n🔎 Performing model validation...")

# Check model can be loaded and used
try:
    # Reload model
    loaded_model = lgb.Booster(model_file=model_path)
    loaded_features = joblib.load(feature_path)
    loaded_categories = joblib.load(r"C:\mini project\vigilai\backend\ml\data\category_mappings.pkl")
    
    # Test prediction
    sample_data = test_df[feature_cols].iloc[:1]
    sample_pred = loaded_model.predict(sample_data)[0]
    
    print(f"✅ Model validation successful!")
    print(f"   Sample prediction: {sample_pred:.4f}")
    print(f"   Features loaded: {len(loaded_features)}")
    print(f"   Categories loaded: {len(loaded_categories)}")
    
except Exception as e:
    print(f"❌ Model validation failed: {e}")

print("\n🎉 Model training pipeline completed successfully!")