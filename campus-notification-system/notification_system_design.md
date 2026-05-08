# Stage 1: API Design

## Create Notification
POST /api/notifications
Headers: Authorization: Bearer <token>

Request:
{
  "studentId": 1042,
  "type": "Placement",
  "message": "Google interview scheduled"
}

Response (202):
{
  "success": true,
  "message": "Notification queued"
}

## Get Notifications
GET /api/notifications?page=1&limit=20
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "notifications": [
    {
      "studentId": 1042,
      "type": "Placement",
      "message": "Google interview scheduled",
      "isRead": false,
      "createdAt": "2026-05-08T10:00:00.000Z"
    }
  ]
}

## WebSockets
When users log in, they connect to a Socket.io server and join a room with their studentId. The server emits new notifications directly to that room.

---

# Stage 2: Database Storage

I chose MongoDB because notifications are schema-less and don't need complex joins. It's very fast for high-volume writes.

Schema:
```json
{
    "studentId": "Number",
    "type": "String",
    "message": "String",
    "isRead": "Boolean",
    "createdAt": "Date"
}
```

If data gets too large, fetching will slow down. We can add indexes on studentId and createdAt, and delete old notifications after a few months to save space.

---

# Stage 3: Query Optimization

The query `SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;` is slow because it has to sort millions of rows in memory.

**Solution**:
Add a compound index:
```sql
CREATE INDEX idx_student_read_created ON notifications(studentID, isRead, createdAt DESC);
```
This drops the complexity to O(K) because the database already has the data sorted on disk for that specific student.

We shouldn't index every column because it will make inserts really slow and use up too much disk space.

**Placement Query**:
```sql
SELECT studentID FROM notifications 
WHERE type = 'Placement' 
AND createdAt >= NOW() - INTERVAL 7 DAY;
```

---

# Stage 4: DB Overload

Fetching notifications on every page load will crash the database.

**Fixes**:
1. Caching: Store unread counts in Redis.
2. WebSockets: Push data instead of having the frontend poll for it.
3. Pagination: Don't load everything at once, just load 10 at a time.

Caching is fast but data can get stale. WebSockets are real-time but take up more server memory.

---

# Stage 5: Notify All Flaws

The pseudocode does everything synchronously in a loop.
- It will timeout if it runs for 50,000 students.
- If it crashes halfway, we can't resume it easily.
- Sending 50,000 emails synchronously will block the Node.js event loop.

**Fix (Queue System)**:
Use a message queue like RabbitMQ or BullMQ to process these in the background.

```javascript
function notify_all(student_ids, message):
    for id in student_ids:
        queue.push({ id, message })
    return "Started"

function worker(job):
    try {
        save_to_db(job.id, job.message)
        push_to_app(job.id, job.message)
        send_email(job.id, job.message)
    } catch (e) {
        throw e // queue handles retries automatically
    }
```

---

# Stage 6: Priority Inbox

I used a Min-Heap data structure to find the top 10 notifications efficiently.
I gave Placement a score of 3, Result 2, and Event 1, and added the timestamp to factor in recency.

I created a script `stage6_priority_inbox.js` that fetches the data from the Evaluation API using Axios, inserts it into the Min-Heap, and prints the top 10. The time complexity is O(N log 10), which is way better than sorting the whole array.
