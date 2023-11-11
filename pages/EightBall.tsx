"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface Todo {
  text: string;
  completed: boolean;
}

const SHAKE_THRESHOLD = 20;
const SHAKE_TIME_THRESHOLD = 1000;

function useShake(onShake: () => void) {
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const lastShake = useRef<number | null>(null);
  const accRef = useRef<DeviceMotionEventAcceleration | null>(null);
  const shakeRef = useRef<() => void>();
  shakeRef.current = onShake;

  useEffect(() => {
    if (!permission || permission !== "granted") return;

    const listener = (e: DeviceMotionEvent) => {
      e.preventDefault();
      const current = e.accelerationIncludingGravity;
      if (!current) return;

      if (!accRef.current) {
        accRef.current = current;
        return;
      }

      const deltaX = Math.abs(accRef.current.x! - current.x!);
      const deltaY = Math.abs(accRef.current.y! - current.y!);
      const deltaZ = Math.abs(accRef.current.z! - current.z!);
      if (
        (deltaX > SHAKE_THRESHOLD && deltaY > SHAKE_THRESHOLD) ||
        (deltaX > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD) ||
        (deltaY > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD)
      ) {
        if (!lastShake.current) {
          lastShake.current = Date.now();
          shakeRef.current?.();
        } else if (lastShake.current + SHAKE_TIME_THRESHOLD > Date.now()) {
          return;
        } else {
          lastShake.current = Date.now();
          shakeRef.current?.();
        }
      }
    };

    window.addEventListener("devicemotion", listener);

    return () => {
      window.removeEventListener("devicemotion", listener);
    };
  }, [permission]);

  useEffect(() => {
    // @ts-expect-error: TypeScript doesn't know about this:
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      // @ts-expect-error: TypeScript doesn't know about this:
      DeviceMotionEvent.requestPermission().then(
        (permissionState: PermissionState) => {
          setPermission(permissionState);
        }
      );
    } else {
      setPermission("granted");
    }
  }, []);
}

export default function EightBall() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todo, setTodo] = useState<string>("");

  const [todoTodo, setTodoTodo] = useState<Todo | null>(null);
  const [dragging, setDragging] = useState(false);
  const [draggingHasStarted, setDraggingHasStarted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!todo) return;
    setTodo("");
    setTodos((prevTodos) => [...prevTodos, { text: todo, completed: false }]);
  }

  const clearData = () => {
    setTodos([]);
    setTodo("");
    setTodoTodo(null);
  };

  const todoOpacity = draggingHasStarted && !dragging ? 1 : 0;

  // NOTE: This is implemented a little funky to make it not depend on the state:
  const showRandomTodo = useCallback(() => {
    setDraggingHasStarted(true);
    setDragging(false);
    setTodos((prevTodos) => {
      const uncompletedTodos = prevTodos.filter((todo) => !todo.completed);
      if (uncompletedTodos.length === 0) return prevTodos;

      const randomTodo =
        uncompletedTodos[Math.floor(Math.random() * uncompletedTodos.length)];
      setTodoTodo(randomTodo);

      return prevTodos.map((todo) =>
        todo === randomTodo ? { ...todo, completed: true } : todo
      );
    });
  }, []);

  useShake(showRandomTodo);

  return (
    <div className="relative flex w-full h-screen items-center justify-center bg-[#ffedd5]">
      <div className="absolute top-6 right-6 text-right">
        {todos.map((todo, i) => (
          <div
            className="text-black text-xs"
            style={{
              textDecoration: todo.completed ? "line-through" : undefined,
            }}
            key={todo.text}
          >
            {todo.text}
          </div>
        ))}
      </div>
      <div className=" flex flex-col items-center justify-center gap-8">
        <motion.div
          className="relative bg-black w-[400px] h-[400px] rounded-full"
          drag
          dragConstraints={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onDragStart={() => {
            setDragging(true);
            setDraggingHasStarted(true);
          }}
          onDragEnd={() => {
            setDragging(false);
            showRandomTodo();
          }}
        >
          <div
            className="transition-opacity absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border-4 border-gray-800 w-[150px] h-[150px] rounded-full"
            style={{ opacity: todoOpacity }}
          >
            <div className="relative h-full flex items-center justify-center mt-[25px]">
              <div className="absolute w-[60px] z-20 top-[30px] text-white text-[8px] text-center">
                {todoTodo?.text}
              </div>
              <div className="rotate-[180deg] w-[120px] h-[120px]">
                <svg fill="#4244F5" id="triangle" viewBox="0 0 100 100">
                  <polygon points="50 15, 100 100, 0 100" />
                </svg>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[150px] h-[150px] rounded-full text-black font-extrabold text-[130px] flex items-center justify-center">
            8
          </div>
        </motion.div>
        <form
          className="flex flex-col items-center justify-center"
          onSubmit={handleSubmit}
        >
          <input
            className="w-[300px] h-[50px] rounded-lg focus:border-2 focus:border-[#ffedd5]  text-center text-2xl text-black"
            type="text"
            placeholder="Enter a todo"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
          />

          <button className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded" type="button"
              onClick={clearData} >
            Clear
          </button>

        </form>
      </div>
    </div>
  );
}