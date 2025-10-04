import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# ---------------------------
# Step 1: Load data
# ---------------------------
crimes = pd.read_csv(r"C:\mini project\vigilai\backend\ml\data\Crime_data.csv", parse_dates=["Date"], low_memory=False)
suspects = pd.read_csv(r"C:\mini project\vigilai\backend\ml\data\Suspect_list.csv", low_memory=False)

# Keep only cases that have known suspects
labeled = crimes[crimes['Suspect_id'].notnull()].copy()

# ---------------------------
# Step 2: Extract datetime features
# ---------------------------
labeled['Date'] = pd.to_datetime(labeled['Date'], errors='coerce')
labeled['hour'] = labeled['Date'].dt.hour
labeled['day_of_week'] = labeled['Date'].dt.dayofweek
labeled['is_weekend'] = labeled['day_of_week'].isin([5, 6]).astype(int)

# ---------------------------
# Step 3: Create positive pairs (label = 1)
# ---------------------------
pos_pairs = labeled[['ID', 'Case Number', 'Date', 'Primary Type', 
                     'Description', 'Location Description', 'District', 
                     'Ward', 'Suspect_id', 'hour', 'day_of_week', 
                     'is_weekend']].copy()

pos_pairs = pos_pairs.rename(columns={'Suspect_id': 'candidate_suspect_id'})
pos_pairs['label'] = 1

# ---------------------------
# Step 4: Create negative pairs (label = 0)
# ---------------------------
all_suspects = suspects['Suspect_id'].unique()
neg_samples = []

for _, row in pos_pairs.iterrows():
    true_id = row['candidate_suspect_id']
    # Pick 10 random wrong suspects
    wrong_ids = np.random.choice([s for s in all_suspects if s != true_id],
                                 size=min(10, len(all_suspects)-1),
                                 replace=False)
    for wid in wrong_ids:
        neg = row.copy()
        neg['candidate_suspect_id'] = wid
        neg['label'] = 0
        neg_samples.append(neg)

neg_pairs = pd.DataFrame(neg_samples)

# ---------------------------
# Step 5: Combine positives and negatives
# ---------------------------
pairs = pd.concat([pos_pairs, neg_pairs], ignore_index=True)

# ---------------------------
# Step 6: Join suspect info
# ---------------------------
pairs = pairs.merge(
    suspects.add_prefix('suspect_'),
    left_on='candidate_suspect_id',
    right_on='suspect_Suspect_id',
    how='left'
)

# ---------------------------
# Step 7: Create 'same_district' feature
# ---------------------------
pairs['same_district'] = (pairs['District'].astype(str) == pairs['suspect_District'].astype(str)).astype(int)

# ---------------------------
# Step 8: Keep only necessary columns
# ---------------------------
final_columns = [
    'ID', 'Case Number', 'Date',
    'Primary Type', 'Description', 'Location Description',
    'District', 'Ward',
    'candidate_suspect_id',
    'suspect_Suspect_id', 'suspect_Name', 'suspect_Gender', 
    'suspect_Age', 'suspect_District',
    'hour', 'day_of_week', 'is_weekend',
    'same_district', 'label'
]

pairs = pairs[final_columns]

# ---------------------------
# Step 9: Time-based train/test split
# ---------------------------
pairs = pairs.sort_values('Date')
train_df, test_df = train_test_split(pairs, test_size=0.2, shuffle=False)  # 80/20 split by time

# ---------------------------
# Step 10: Save files
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
