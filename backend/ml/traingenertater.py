import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# ---------------------------
# Step 1: Load Data
# ---------------------------
crimes = pd.read_csv(r"C:\mini project\vigilai\backend\ml\data\Crime_data.csv", parse_dates=["date_time"], low_memory=False)
suspects = pd.read_csv(r"C:\mini project\vigilai\backend\ml\data\Suspect_list.csv", low_memory=False)

# Keep only cases that have known suspects (criminal_id not null)
labeled = crimes[crimes['criminal_id'].notnull()].copy()

# ---------------------------
# Step 2: Extract datetime features
# ---------------------------
labeled['date_time'] = pd.to_datetime(labeled['date_time'], errors='coerce')
labeled['hour'] = labeled['date_time'].dt.hour
labeled['day_of_week'] = labeled['date_time'].dt.dayofweek
labeled['is_weekend'] = labeled['day_of_week'].isin([5, 6]).astype(int)

# ---------------------------
# Step 3: Create positive pairs (label = 1)
# ---------------------------
pos_pairs = labeled[['case_id', 'case_number', 'date_time', 'primary_type', 
                     'description', 'location_description', 'district', 
                     'ward', 'criminal_id', 'hour', 'day_of_week', 'is_weekend']].copy()

pos_pairs = pos_pairs.rename(columns={'criminal_id': 'candidate_criminal_id'})
pos_pairs['label'] = 1

# ---------------------------
# Step 4: Create negative pairs (label = 0)
# ---------------------------
all_criminals = suspects['criminal_id'].unique()
neg_samples = []

for _, row in pos_pairs.iterrows():
    true_id = row['candidate_criminal_id']
    # Pick 10 random wrong suspects
    wrong_ids = np.random.choice([cid for cid in all_criminals if cid != true_id],
                                 size=min(10, len(all_criminals) - 1),
                                 replace=False)
    for wid in wrong_ids:
        neg = row.copy()
        neg['candidate_criminal_id'] = wid
        neg['label'] = 0
        neg_samples.append(neg)

neg_pairs = pd.DataFrame(neg_samples)

# ---------------------------
# Step 5: Combine positives and negatives
# ---------------------------
pairs = pd.concat([pos_pairs, neg_pairs], ignore_index=True)

# ---------------------------
# Step 6: Join suspect (criminal) info
# ---------------------------
pairs = pairs.merge(
    suspects.add_prefix('suspect_'),
    left_on='candidate_criminal_id',
    right_on='suspect_criminal_id',
    how='left'
)

# ---------------------------
# Step 7: Create 'same_district' feature
# ---------------------------
pairs['same_district'] = (pairs['district'].astype(str) == pairs['suspect_district'].astype(str)).astype(int)

# ---------------------------
# Step 8: Keep only necessary columns
# ---------------------------
final_columns = [
    'case_id', 'case_number', 'date_time',
    'primary_type', 'description', 'location_description',
    'district', 'ward',
    'candidate_criminal_id',
    'suspect_criminal_id', 'suspect_name', 'suspect_gender',
    'suspect_age', 'suspect_district',
    'hour', 'day_of_week', 'is_weekend',
    'same_district', 'label'
]

pairs = pairs[final_columns]

# Step 8.5: Fix datatypes
# ---------------------------
int_columns = ['case_id', 'district', 'ward', 
               'candidate_criminal_id', 'suspect_criminal_id', 
               'suspect_age', 'suspect_district']

for col in int_columns:
    if col in pairs.columns:
        # Convert safely (ignores NaN)
        pairs[col] = pd.to_numeric(pairs[col], errors='coerce').fillna(0).astype(int)

# ---------------------------
# Step 9: Time-based train/test split
# ---------------------------
pairs = pairs.sort_values('date_time')
train_df, test_df = train_test_split(pairs, test_size=0.2, shuffle=False)  # 80/20 split

# ---------------------------
# Step 10: Save Files
# ---------------------------
pairs.to_csv(r"C:\mini project\vigilai\backend\ml\data\training_pairs.csv", index=False)
train_df.to_csv(r"C:\mini project\vigilai\backend\ml\data\train.csv", index=False)
test_df.to_csv(r"C:\mini project\vigilai\backend\ml\data\test.csv", index=False)

# ---------------------------
# Step 11: Summary
# ---------------------------
print("✅ Training dataset regenerated successfully!")
print("Total rows:", len(pairs))
print("Train size:", len(train_df))
print("Test size:", len(test_df))
print("\nLabel distribution (train):")
print(train_df['label'].value_counts())
print("\nLabel distribution (test):")
print(test_df['label'].value_counts())
print("\nSample preview:")
print(pairs.head(5))
