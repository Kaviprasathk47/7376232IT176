const axios = require('axios');

class MinHeap {
    constructor(capacity) {
        this.heap = [];
        this.capacity = capacity;
    }

    getScore(notification) {
        let weight = 0;
        // Priority: Placement > Result > Event
        switch (notification.Type) {
            case 'Placement': weight = 30000000000000; break;
            case 'Result': weight = 20000000000000; break;
            case 'Event': weight = 10000000000000; break;
        }
        return weight + new Date(notification.Timestamp).getTime();
    }

    insert(notification) {
        const item = { ...notification, score: this.getScore(notification) };
        if (this.heap.length < this.capacity) {
            this.heap.push(item);
            this.bubbleUp(this.heap.length - 1);
        } else if (item.score > this.heap[0].score) {
            this.heap[0] = item;
            this.sinkDown(0);
        }
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].score <= this.heap[index].score) break;
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    sinkDown(index) {
        const length = this.heap.length;
        const element = this.heap[index];

        while (true) {
            let leftChildIdx = 2 * index + 1;
            let rightChildIdx = 2 * index + 2;
            let leftChild, rightChild;
            let swapIdx = null;

            if (leftChildIdx < length) {
                leftChild = this.heap[leftChildIdx];
                if (leftChild.score < element.score) {
                    swapIdx = leftChildIdx;
                }
            }

            if (rightChildIdx < length) {
                rightChild = this.heap[rightChildIdx];
                if (
                    (swapIdx === null && rightChild.score < element.score) ||
                    (swapIdx !== null && rightChild.score < leftChild.score)
                ) {
                    swapIdx = rightChildIdx;
                }
            }

            if (swapIdx === null) break;
            this.swap(index, swapIdx);
            index = swapIdx;
        }
    }

    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    getTopK() {
        return [...this.heap].sort((a, b) => b.score - a.score);
    }
}

async function fetchAndCalculatePriority() {
    try {
        console.log("Fetching notifications from Evaluation API...");
        
        // Fetching from the provided evaluation service
        // Since it's a protected route (as per constraints), assuming we have a mock token or it works without one for the test
        const response = await axios.get('http://4.224.186.213/evaluation-service/notifications', {
            // headers: { Authorization: `Bearer <token>` }
        });
        
        const notifications = response.data.notifications;
        
        if (!notifications || notifications.length === 0) {
            console.log("No notifications found.");
            return;
        }

        console.log(`Successfully fetched ${notifications.length} notifications. Processing top 10...`);
        
        // Use Min Heap to keep top 10 efficiently
        const minHeap = new MinHeap(10);
        
        notifications.forEach(notification => {
            minHeap.insert(notification);
        });

        const top10 = minHeap.getTopK();

        console.log("\n--- TOP 10 PRIORITY INBOX ---");
        top10.forEach((notif, index) => {
            console.log(`${index + 1}. [${notif.Type}] ${notif.Message} | Time: ${notif.Timestamp} (Score: ${notif.score})`);
        });
        
    } catch (error) {
        console.error("Error fetching notifications:", error.message);
    }
}

fetchAndCalculatePriority();
