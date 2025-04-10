
export interface FallbackQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const fallbackQuizQuestions: FallbackQuizQuestion[] = [
  {
    question: "What is the time complexity of binary search?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "O(log n)",
    explanation: "Binary search repeatedly divides the search space in half, leading to a logarithmic time complexity. With each comparison, the algorithm eliminates half of the remaining elements."
  },
  {
    question: "Which data structure uses LIFO (Last In, First Out) principle?",
    options: ["Queue", "Stack", "Linked List", "Binary Tree"],
    correctAnswer: "Stack",
    explanation: "A stack follows the Last In, First Out (LIFO) principle where the last element added is the first one to be removed. Common operations include push (to add) and pop (to remove)."
  },
  {
    question: "What is the worst-case time complexity of quicksort?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
    correctAnswer: "O(n²)",
    explanation: "Although quicksort's average time complexity is O(n log n), its worst-case scenario occurs when the pivot chosen is always the smallest or largest element, leading to highly unbalanced partitions and O(n²) complexity."
  },
  {
    question: "In a min-heap, which of the following statements is true?",
    options: [
      "The root node contains the maximum value in the heap", 
      "The root node contains the minimum value in the heap", 
      "All parent nodes are smaller than their children", 
      "The heap must be a complete binary tree"
    ],
    correctAnswer: "The root node contains the minimum value in the heap",
    explanation: "In a min-heap, the key of a node is less than or equal to the keys of its children. This property ensures that the minimum value is always at the root of the heap."
  },
  {
    question: "What is the space complexity of Depth-First Search (DFS) on a graph with V vertices and E edges?",
    options: ["O(1)", "O(V)", "O(E)", "O(V+E)"],
    correctAnswer: "O(V)",
    explanation: "The space complexity of DFS is O(V) where V is the number of vertices. This accounts for the recursion stack (or an explicit stack) which, in the worst case, might contain all vertices of the graph."
  },
  {
    question: "Which of the following sorting algorithms has the best average-case time complexity?",
    options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
    correctAnswer: "Merge Sort",
    explanation: "Among these options, Merge Sort has the best average-case time complexity of O(n log n). Bubble Sort, Insertion Sort, and Selection Sort all have O(n²) average-case time complexity."
  },
  {
    question: "What data structure would you use to implement a priority queue efficiently?",
    options: ["Array", "Linked List", "Binary Search Tree", "Heap"],
    correctAnswer: "Heap",
    explanation: "A heap is the most efficient data structure for implementing a priority queue, offering O(1) access to the highest/lowest priority element and O(log n) insertion and deletion operations."
  },
  {
    question: "What is the time complexity of finding an element in a hash table in the average case?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "O(1)",
    explanation: "Hash tables provide constant-time O(1) average case complexity for lookups, insertions, and deletions. This efficiency comes from the direct mapping of keys to array indices through a hash function."
  },
  {
    question: "Which of these data structures allows for O(1) insertion and deletion at both ends?",
    options: ["Array", "Linked List", "Deque", "Binary Search Tree"],
    correctAnswer: "Deque",
    explanation: "A deque (double-ended queue) allows for constant time O(1) insertions and deletions at both the front and back ends, making it more flexible than both stacks and queues."
  },
  {
    question: "What is the worst-case time complexity for finding an element in a balanced binary search tree?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "O(log n)",
    explanation: "In a balanced binary search tree, the height is logarithmic with respect to the number of nodes, resulting in O(log n) worst-case time complexity for search operations."
  }
];
