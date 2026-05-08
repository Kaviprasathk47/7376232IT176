# Campus Notification System Design

## Stage 1

### REST API Contracts

#### 1. Create Notification (Admin/HR)
**Endpoint**: `POST /api/notifications`
**Headers**: `Authorization: Bearer <token>`
**Request**:
```json
{
  "studentId": 1042,
  "type": "Placement",
  "message": "You have been shortlisted for Google."
}
```
**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "Notification processing initiated"
}
```

#### 2. Get Notifications (Student)
**Endpoint**: `GET /api/notifications?page=1&limit=20&type=Placement`
**Headers**: `Authorization: Bearer <token>`
**Response** (200 OK):
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "60d5ecb8b392d7001f3e3a45",
      "studentId": 1042,
      "type": "Placement",
      "message": "You have been shortlisted for Google.",
      "isRead": false,
      "createdAt": "2026-05-08T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 3
  }
}
```

#### 3. Mark Notification as Read
**Endpoint**: `PUT /api/notifications/:id/read`
**Headers**: `Authorization: Bearer <token>`
**Response** (200 OK):
```json
{
  "success": true,
  "notification": {
    "_id": "60d5ecb8b392d7001f3e3a45",
    "isRead": true
  }
}
```

#### 4. Get Priority Inbox
**Endpoint**: `GET /api/notifications/priority-inbox`
**Headers**: `Authorization: Bearer <token>`
**Response** (200 OK):
```json
{
  "success": true,
  "count": 10,
  "priorityInbox": [ ... ]
}
```

### WebSocket Flow
1. **Connection**: Client connects to `ws://localhost:5000` with JWT via handshake query or headers.
2. **Room Joining**: Client emits `join` event with their `studentId` to join a personal room `student_{studentId}`.
3. **Receiving**: Server emits `new_notification` to the room when a notification is processed by the worker.

---

## Stage 2

### Database Choice: MongoDB
For a real-time notification system, **MongoDB** is highly suitable:
- **Flexible Schema**: Notification metadata can evolve easily.
- **Write Heavy**: Notifications are extremely write-heavy, and MongoDB can handle high ingestion rates efficiently.
- **Read Heavy with Indexes**: Fast read access using secondary indexes.
- **Scaling**: Built-in sharding allows horizontal scaling as the data volume increases past millions of records.

*Note: PostgreSQL with partitioning is also a strong choice if transactional consistency across other domains is needed, but MongoDB provides great velocity and read/write throughput for document-based feeds.*

### Schema Design (Mongoose)
```javascript
{
    studentId: { type: Number, required: true, index: true },
    type: { type: String, enum: ['Placement', 'Result', 'Event'] },
    message: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true }
}
```

### Scaling Challenges & Solutions
- **Problem**: 50,000 students x 100 notifications = 5,000,000 records causing slow queries.
- **Solution**: 
  - Shard the database on `studentId`.
  - Use compound indexes for frequently accessed queries (e.g., `studentId`, `isRead`, `createdAt`).
  - Implement Redis caching for unread/priority counts.

---

## Stage 3

### Slow Query Analysis
```sql
SELECT * FROM notifications 
WHERE studentID = 1042 AND isRead = false 
ORDER BY createdAt DESC;
```
**Why it's slow**: 
Without a compound index, the database engine might use an index on `studentID` to find records, but then has to scan and sort all matching records in memory by `createdAt`. If a student has thousands of notifications, the sort operation becomes computationally expensive (filesort).

### Optimization
**Compound Index:**
```sql
CREATE INDEX idx_student_read_created 
ON notifications(studentID, isRead, createdAt DESC);
```
**Computation Cost**: With this index, the query cost drops from `O(N log N)` (for memory sorting) to `O(K)` where K is the number of unread notifications, as the B-Tree is already sorted by `createdAt` for the specific `studentID` and `isRead` status.

**Dangers of indexing every column**:
- Indexes consume RAM and Disk space.
- Every `INSERT`, `UPDATE`, or `DELETE` requires updating all indexes, drastically degrading write performance (crucial for a write-heavy notification system).

### Placement Notification Query
```sql
SELECT studentID FROM notifications
WHERE type = 'Placement' 
AND createdAt >= NOW() - INTERVAL '7 days';
```
*(Requires an index on `(type, createdAt)` to be performant).*

---

## Stage 4

### DB Overload Solutions
Fetching notifications on every page load overwhelms the database.
1. **Redis Caching**: Cache the first page of a student's notifications and their unread count in Redis. Invalidate or update the cache when a new notification is generated.
2. **WebSockets**: Push notifications to the client via Socket.IO instead of the client polling the server.
3. **Pagination & Infinite Scrolling**: Use cursor-based pagination (`_id` or `createdAt` as cursor) instead of offset-based pagination (`skip`), which becomes slow on deep pages.
4. **Read Replicas**: Direct all `GET` queries to read-replicas, reserving the primary DB for `INSERT` operations.

**Tradeoffs**:
- **Caching**: Introduces staleness. Requires complex invalidation logic.
- **WebSockets**: Requires maintaining persistent connections which consumes server memory (requires load balancers and Redis Pub/Sub for horizontal scaling).

---

## Stage 5

### Flaws in Synchronous Processing
```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message) # Blocking network call
        save_to_db(student_id, message) # Blocking I/O
        push_to_app(student_id, message)
```
- **Timeouts**: Email APIs take ~200ms. For 50,000 students, this loop takes 2.7 hours. The HTTP request will timeout.
- **Partial Failures**: If it fails at student 200, the remaining 49,800 students get nothing. Retrying the whole function duplicates emails for the first 200.
- **Resource Exhaustion**: Opening 50,000 concurrent DB/Email connections will crash the application.

### Queue-Based Redesign
We decouple the generation of notifications from the delivery using an Event-Driven Architecture with Message Queues (BullMQ/Redis).

```python
# API Endpoint
function notify_all(student_ids, message):
    # Fast, batch push to Redis Queue
    queue.add_bulk([{ student_id, message } for student_id in student_ids])
    return 202_ACCEPTED

# Background Worker (Consumes Queue)
function process_job(job):
    try:
        # DB and Email do NOT have to happen in the same atomic transaction,
        # but DB save should happen first to ensure persistence.
        save_to_db(job.student_id, job.message)
        send_email(job.student_id, job.message)
        push_to_app(job.student_id, job.message)
    except Exception as e:
        # Job fails, will be retried automatically with exponential backoff
        throw e
```
- **Retries**: BullMQ handles retries.
- **Dead Letter Queue (DLQ)**: Jobs failing 3+ times go to DLQ for manual inspection.

---

## Stage 6

### Priority Inbox Algorithm
The goal is to maintain the top 10 most important notifications based on Weight (`Placement=3`, `Result=2`, `Event=1`) and Recency.

**Algorithm: Min-Heap (Size K = 10)**
1. We construct a score: `Score = (Weight * LargeConstant) + Timestamp`.
2. We use a Min-Heap of size 10.
3. As we iterate over unread notifications:
   - If heap size < 10, insert.
   - If new notification score > heap's minimum (root), extract root and insert new.
4. **Complexity**: `O(N log K)` where N is unread notifications and K=10. This is significantly faster than `O(N log N)` full sorting.

**Maintaining live top 10**:
Instead of recalculating the heap on every request:
1. Cache the top 10 in Redis as a Sorted Set (`ZSET`).
2. When a new notification arrives, `ZADD` it to the Redis set.
3. Use `ZREMRANGEBYRANK` to keep only the top 10 items in the cache. 
4. Fetching the priority inbox becomes an `O(1)` or `O(log K)` Redis read.
