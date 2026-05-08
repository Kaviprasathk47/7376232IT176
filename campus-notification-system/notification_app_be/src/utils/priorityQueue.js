class MinHeap {
    constructor(capacity) {
        this.heap = [];
        this.capacity = capacity;
    }

    insert(item) {
        if (this.heap.length < this.capacity) {
            this.heap.push(item);
            this.bubbleUp(this.heap.length - 1);
        } else if (item.priorityScore > this.heap[0].priorityScore) {
            this.heap[0] = item;
            this.sinkDown(0);
        }
    }

    bubbleUp(index) {
        while (index > 0) {
            let parent = Math.floor((index - 1) / 2);
            if (this.heap[parent].priorityScore <= this.heap[index].priorityScore) break;
            
            [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
            index = parent;
        }
    }

    sinkDown(index) {
        const length = this.heap.length;
        while (true) {
            let left = 2 * index + 1;
            let right = 2 * index + 2;
            let smallest = index;

            if (left < length && this.heap[left].priorityScore < this.heap[smallest].priorityScore) smallest = left;
            if (right < length && this.heap[right].priorityScore < this.heap[smallest].priorityScore) smallest = right;

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }

    getTopK() {
        return [...this.heap].sort((a, b) => b.priorityScore - a.priorityScore);
    }
}

module.exports = MinHeap;
