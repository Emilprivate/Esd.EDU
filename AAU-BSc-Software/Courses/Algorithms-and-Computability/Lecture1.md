# Activity Selection Algorithm - Dynamic Programming Approach

```TS
ActivitySelection(S[1..n])
01  for i = 1 to n do           // Initialize the DP table
02      for j = 1 to n do
03          c[i, j] = 0          // Set all values in c[i, j] to 0 (base case)
04  return ActivitySelectionR(S, 1, n)  // Call recursive function to compute max activities

ActivitySelectionR(S, i, j)
01  if c[i, j] == 0 then        // If value has not been computed yet
02      if S_ij == ∅ then       // If there are no activities in (i, j), set value to 0
03          c[i, j] = 0
04      else
05          c[i, j] = 0         // Initialize value to 0
06          for k ∈ S_ij do     // Iterate over all valid activities k in interval (i, j)
07              // For each activity k, calculate:
                // 1. ActivitySelectionR(S, i, k)   -> max activities from interval start (i) to start of activity k
                // 2. ActivitySelectionR(S, k, j)   -> max activities from end of activity k to interval end (j)
                // 3. +1                            -> counting the current activity k itself
                // Take maximum between current best and this new combination
              c[i, j] = max(ActivitySelectionR(S, i, k) + ActivitySelectionR(S, k, j) + 1, c[i, j])
                                // Compute the maximum number of activities using recursion
08  return c[i, j]              // Return computed value for this subproblem


```

## Example

Consider the interval from 0 to 22 and the following activities:

- activity 1: 1-3
- activity 2: 0-7
- activity 3: 5-12
- activity 4: 8-14
- activity 5: 13-17
- activity 6: 14-19
- activity 7: 18-21
- activity 8: 16-22
- activity 9: 18-23

### Step-by-Step Execution

1. **Initialization**:

   - Create a DP table `c` with dimensions `[0..22][0..22]` and initialize all values to 0.

2. **Recursive Calculation**:

   - Call `ActivitySelectionR(S, 0, 22)`.

3. **Recursive Breakdown**:
   - For each subproblem `(i, j)`, iterate over all valid activities `k` in the interval `(i, j)` and compute the maximum number of activities.

### Detailed Calculation for Subproblems

- For interval `(0, 22)`:

  - Consider activities that start and end within this interval.
  - For example, activity 2 (0-7):
    - Calculate `ActivitySelectionR(S, 0, 0)` + `ActivitySelectionR(S, 7, 22)` + 1.
    - Continue this process for all activities within the interval.

- For interval `(0, 7)`:

  - Consider activities that start and end within this interval.
  - For example, activity 1 (1-3):
    - Calculate `ActivitySelectionR(S, 0, 1)` + `ActivitySelectionR(S, 3, 7)` + 1.
    - Continue this process for all activities within the interval.

- Continue breaking down the intervals recursively until all subproblems are solved.

### Result

After filling the DP table using the recursive approach, the value `c[0, 22]` will contain the maximum number of non-overlapping activities that can be selected from the given list.

```

```
