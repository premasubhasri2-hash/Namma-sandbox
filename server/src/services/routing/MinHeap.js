// A min-heap (priority queue). Dijkstra needs "give me the closest unvisited
// node next" quickly; a heap does that in O(log n) instead of scanning a list.

export class MinHeap {
  #items = [];

  get size() {
    return this.#items.length;
  }

  push(value, priority) {
    this.#items.push({ value, priority });
    this.#siftUp(this.#items.length - 1);
  }

  // Removes and returns the value with the smallest priority (undefined if empty).
  pop() {
    if (this.#items.length === 0) return undefined;
    const top = this.#items[0];
    const last = this.#items.pop();
    if (this.#items.length > 0) {
      this.#items[0] = last;
      this.#siftDown(0);
    }
    return top.value;
  }

  #swap(i, j) {
    [this.#items[i], this.#items[j]] = [this.#items[j], this.#items[i]];
  }

  #siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.#items[parent].priority <= this.#items[i].priority) break;
      this.#swap(parent, i);
      i = parent;
    }
  }

  #siftDown(i) {
    const n = this.#items.length;
    while (true) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < n && this.#items[left].priority < this.#items[smallest].priority) smallest = left;
      if (right < n && this.#items[right].priority < this.#items[smallest].priority) smallest = right;
      if (smallest === i) break;
      this.#swap(i, smallest);
      i = smallest;
    }
  }
}