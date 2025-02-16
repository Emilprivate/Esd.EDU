# Activity Selection Algorithm - Dynamic Programming Approach

def ActivitySelection(S):
    # Define the DP table as c[i][j]
    max_time = 23  # Since we need to include 22
    c = [[0 for _ in range(max_time)] for _ in range(max_time)]
    selected_activities = [[[] for _ in range(max_time)] for _ in range(max_time)]
    
    # Compute the maximum number of activities using the recurrence relation
    max_activities = compute_c(S, 0, 22, c, selected_activities)
    
    return max_activities, selected_activities[0][22]

def compute_c(S, i, j, c, selected_activities):
    print(f"Computing c[{i}, {j}]")

    # Base case: if S_ij is empty, c[i, j] = 0
    if not any(i <= a_k[0] and a_k[1] <= j for a_k in S):
        c[i][j] = 0
        print(f"S_{i}{j} is empty. Setting c[{i}, {j}] = 0")
        return 0

    # If already computed, return cached result
    if c[i][j] != 0:
        return c[i][j]

    # Compute max over all possible activity partitions
    max_value = 0
    best_selection = []

    for a_k in S:
        k_start, k_end = a_k
        if i <= k_start and k_end <= j:  # Ensure activity fits in the interval
            print(f"Checking activity {a_k} in interval [{i}, {j}]")

            # Apply recurrence: max {c[i, k] + c[k, j] + 1} for all k in S_ij
            left_value = compute_c(S, i, k_start, c, selected_activities)
            right_value = compute_c(S, k_end, j, c, selected_activities)
            current_value = left_value + right_value + 1

            if current_value > max_value:
                max_value = current_value
                best_selection = selected_activities[i][k_start] + [a_k] + selected_activities[k_end][j]
                print(f"Updated c[{i}, {j}] = {max_value} with selection {best_selection}")

    # Store the best value found
    c[i][j] = max_value
    selected_activities[i][j] = best_selection

    return c[i][j]

# Define the activities with their start and end times
activities = [
    (1, 3),   # Activity 1
    (0, 7),   # Activity 2
    (5, 12),  # Activity 3
    (8, 14),  # Activity 4
    (13, 17), # Activity 5
    (14, 19), # Activity 6
    (18, 21), # Activity 7
    (16, 22), # Activity 8
    (18, 23)  # Activity 9
]

# Call the ActivitySelection function
max_activities, selected = ActivitySelection(activities)
print("\nFinal Result:")
print(f"Maximum number of activities: {max_activities}")
print(f"Selected activities: {selected}")
