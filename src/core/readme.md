# Code docs

## User allocation and deallocation algorithm
1. User receives `atomic_visitor_id` (100 year cookie) and an `atomic_session_id` (session cookie) in cookies when they visit the site. This `atomic_visitor_id` serves as the consistent identifier for the user across sessions.

2. Visit to the experimentation page triggers the bucketing function, which hashes the `atomic_visitor_id || feature_flag` combination, and creates a bucket value between 0 and 1000.

3. Fetch the allocation weights for the current feature_flag, epoch and round from the server. For example, the server indicates that for a bucket value of 33, the user is assigned to variant A.

4. Display variant A on the checkout page based on the assignment.

5. Store the variant assignment in the cookies, such as "checkout_page": "variant A", for faster lookups on future visits.
```json
{
  "experiment_id": {
    "variant": "variant_id",
    "epoch": "epoch_id",
  }
}
```

6. When the user visits the checkout page again, the stored variant assignment is used to display the same variant as before. If the variant with variant_id is not present => display the default variant. If the epoch_id is different from the current running epoch_id, the user is re-allocated to a new variant.