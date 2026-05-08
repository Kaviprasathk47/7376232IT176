const { NOTIFICATION_TYPES } = require('../constants');

class MinHeap {
    constructor(capacity) {
        this.heap = [];
        this.capacity = capacity;
    }

    // Calculate score. Placement > Result > Event + recency
    getScore(notification) {
        let weight = 0;
        switch (notification.type) {
            case NOTIFICATION_TYPES.PLACEMENT:
                weight = 30000000000000;
                break;
            case NOTIFICATION_TYPES.RESULT:
                weight = 20000000000000;
                break;
            case NOTIFICATION_TYPES.EVENT:
                weight = 10000000000000;
                break;
        }
        // Add timestamp to weight to handle recency
        return weight + new Date(notification.createdAt).getTime();
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

    // Return descending sorted elements
    getTopK() {
        return [...this.heap].sort((a, b) => b.score - a.score);
    }
}

module.exports = MinHeap;
