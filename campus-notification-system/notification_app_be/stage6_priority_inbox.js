require('dotenv').config();
const externalNotificationService = require('./src/services/externalNotificationService');

class MinHeap {
    constructor(capacity) {
        this.heap = [];
        this.capacity = capacity;
    }

    insert(notification) {
        if (this.heap.length < this.capacity) {
            this.heap.push(notification);
            this.bubbleUp(this.heap.length - 1);
        } else if (notification.priorityScore > this.heap[0].priorityScore) {
            this.heap[0] = notification;
            this.sinkDown(0);
        }
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].priorityScore <= this.heap[index].priorityScore) break;
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
                if (leftChild.priorityScore < element.priorityScore) {
                    swapIdx = leftChildIdx;
                }
            }

            if (rightChildIdx < length) {
                rightChild = this.heap[rightChildIdx];
                if (
                    (swapIdx === null && rightChild.priorityScore < element.priorityScore) ||
                    (swapIdx !== null && rightChild.priorityScore < leftChild.priorityScore)
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
        return [...this.heap].sort((a, b) => b.priorityScore - a.priorityScore);
    }
}

async function runPriorityInbox() {
    try {
        console.log("Fetching notifications from External API Service...");
        
        // This utilizes the stale-while-revalidate strategy and exponential backoff
        const notifications = await externalNotificationService.getNotifications();
        
        if (!notifications || notifications.length === 0) {
            console.log("No notifications found.");
            process.exit(0);
        }

        console.log(`Successfully retrieved ${notifications.length} notifications. Processing top 10...`);
        
        const minHeap = new MinHeap(10);
        
        notifications.forEach(notification => {
            minHeap.insert(notification);
        });

        const top10 = minHeap.getTopK();

        console.log("\n--- TOP 10 PRIORITY INBOX ---");
        top10.forEach((notif, index) => {
            console.log(`${index + 1}. [${notif.type}] ${notif.message} | Time: ${notif.timestamp} (Score: ${notif.priorityScore})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error("Critical Error generating Priority Inbox:", error.message);
        process.exit(1);
    }
}

runPriorityInbox();
