import pandas as pd
import lightgbm as lgb
from sklearn.metrics import roc_auc_score, accuracy_score
import joblib
import matplotlib.pyplot as plt
import os

# ---------------------------
# Step 1: Load training and test data
# ---------------------------
train_df = pd.read_csv(r"C:\mini project\vigilai\backend\ml\data\train.csv")
test_df = pd.read_csv(r"C:\mini project\vigilai\backend\ml\data\test.csv")

print("Train shape:", train_df.shape)
print("Test shape:", test_df.shape)

# ---------------------------
# Step 2: Define feature columns and target
# ---------------------------
feature_cols = [
    'hour','day_of_week','is_weekend',
    'Primary Type','Description','Location Description',
    'District','Ward','same_district','suspect_Age'
]

target_col = 'label'

# ---------------------------
# Step 3: Encode categorical features
# ---------------------------
categorical_features = ['Primary Type', 'Description', 'Location Description']

# Convert to category dtype
for col in categorical_features:
    train_df[col] = train_df[col].astype('category')
    test_df[col] = test_df[col].astype('category')

# ---------------------------
# Step 4: Prepare LightGBM datasets
# ---------------------------
train_data = lgb.Dataset(train_df[feature_cols], label=train_df[target_col],
                         categorical_feature=categorical_features)
test_data = lgb.Dataset(test_df[feature_cols], label=test_df[target_col],
                        categorical_feature=categorical_features)


# ---------------------------
# Step 5: Set LightGBM parameters
# ---------------------------
params = {
    'objective': 'binary',
    'boosting_type': 'gbdt',
    'metric': ['auc','binary_logloss'],
    'learning_rate': 0.05,
    'num_leaves': 31,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'verbose': -1
}

# ---------------------------
# Step 6: Train model
# ---------------------------
print("🚀 Training LightGBM model...")
callbacks = [
    lgb.early_stopping(stopping_rounds=50, verbose=True),
    lgb.log_evaluation(period=100)
]

model = lgb.train(
    params,
    train_data,
    valid_sets=[train_data, test_data],
    valid_names=['train','test'],
    num_boost_round=1000,
    callbacks=callbacks
)



lgb.plot_importance(model, max_num_features=10)
plt.title("Top 10 Important Features")
plt.tight_layout()
plt.savefig(r"C:\mini project\vigilai\backend\ml\data\feature_importance.png")


# ---------------------------
# Step 7: Evaluate performance
# ---------------------------
y_true = test_df[target_col]
y_pred_prob = model.predict(test_df[feature_cols])
y_pred = (y_pred_prob > 0.5).astype(int)

accuracy = accuracy_score(y_true, y_pred)
auc = roc_auc_score(y_true, y_pred_prob)

print("\n✅ Model Performance:")
print(f"Accuracy: {accuracy:.4f}")
print(f"AUC: {auc:.4f}")

# ---------------------------
# Step 8: Save model
# ---------------------------


model.save_model(r"C:\mini project\vigilai\backend\ml\data\suspect_lightgbm_model.txt")
joblib.dump(feature_cols, r"C:\mini project\vigilai\backend\ml\data\feature_columns.pkl")
print("\n💾 Model and feature list saved successfully!")

