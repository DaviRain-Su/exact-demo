// app.ts: keeps the list, and answers what app.contract asks for.
// The list is in memory. A reload starts over; nothing is written to disk.
import type { Answer, Sources } from './app.contract.d.ts';

export const grants = '';

type Todo = { id: string; title: string; done: boolean };
let todos: Todo[] = [];
let next = 1;

const sources: Sources = {
  todos: () => todos,
  addTodo: ([title]) => {
    todos = [...todos, { id: String(next++), title, done: false }];
    return { count: todos.length };
  },
  setDone: ([id, done]) => {
    todos = todos.map((t) => (t.id === id ? { ...t, done } : t));
    return { count: todos.length };
  },
  removeTodo: ([id]) => {
    todos = todos.filter((t) => t.id !== id);
    return { count: todos.length };
  },
};

export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
