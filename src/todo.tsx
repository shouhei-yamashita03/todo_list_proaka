import React, { useState, useEffect } from 'react';
import localforage from 'localforage';

// "Todo" 型の定義をコンポーネント外で行います
type Todo = {
  content: string;
  readonly id: number;
  completed_flg: boolean;
  delete_flg: boolean;
};

type Filter = 'all' | 'completed' | 'unchecked' | 'delete';

// Todo コンポーネントの定義
const Todo: React.FC = () => {
  const [text, setText] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [nextId, setNextId] = useState(1); // 次のTodoのIDを保持するステート
  const [filter, setFilter] = useState<Filter>('all'); 

  // useEffect フックを使ってコンポーネントのマウント時にデータを取得
useEffect(() => {
  localforage.getItem('todo-20240622').then((values) => {
    if (values) {
      setTodos(values as Todo[]);
    }
  });
}, []);


// useEffect フックを使って todos ステートが更新されるたびにデータを保存
useEffect(() => {
  localforage.setItem('todo-20240622', todos);
}, [todos]);
  
  // todos ステートを更新する関数
  const handleSubmit = () => {
    // 何も入力されていなかったらリターン
    if (!text) return;

    // 新しい Todo を作成
    const newTodo: Todo = {
      content: text, // text ステートの値を content プロパティへ
      id: nextId,
      completed_flg: false,
      delete_flg: false,
    };

    /**
     * 更新前の todos ステートを元に
     * スプレッド構文で展開した要素へ
     * newTodo を加えた新しい配列でステートを更新
     **/
    setTodos((prevTodos) => [newTodo, ...prevTodos]);
    setNextId(nextId + 1); // 次の ID を更新


    // フォームへの入力をクリアする
    setText('');
  };

  // フィルタリングされたタスクリストを取得する関数
  const getFilteredTodos = () => {
    switch (filter) {
      case 'completed':
        // 完了済み **かつ** 削除されていないタスクを返す
        return todos.filter((todo) => todo.completed_flg && !todo.delete_flg);
      case 'unchecked':
        // 未完了 **かつ** 削除されていないタスクを返す
        return todos.filter((todo) => !todo.completed_flg && !todo.delete_flg);
      case 'delete':
        // 削除されたタスクを返す
        return todos.filter((todo) => todo.delete_flg);
      default:
        // 削除されていないすべてのタスクを返す
        return todos.filter((todo) => !todo.delete_flg);
    }
  };

  const handleTodo = <K extends keyof Todo, V extends Todo[K]>(
    id: number,
    key: K,
    value: V
  ) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, [key]: value };
        } else {
          return todo;
        }
      });
      return newTodos;
    });
  };
  
  const handleFilterChange = (filter: Filter) => {
    setFilter(filter);
  };

  const isFormDisabled = filter === 'completed' || filter === 'delete';

  // 物理的に削除する関数
  const handleEmpty = () => {
    setTodos((todos) => todos.filter((todo) => !todo.delete_flg));
  };

  return (
    <div className="todo-container">
      <select
        defaultValue="all"
        onChange={(e) => handleFilterChange(e.target.value as Filter)}
      >
        <option value="all">すべてのタスク</option>
        <option value="completed">完了したタスク</option>
        <option value="unchecked">現在のタスク</option>
        <option value="delete">ごみ箱</option>
      </select>
      {/* フィルターが `delete` のときは「ごみ箱を空にする」ボタンを表示 */}
      {filter === 'delete' ? (
        <button onClick={handleEmpty}>
          ごみ箱を空にする
        </button>
      ) : (
        // フィルターが `completed` でなければ Todo 入力フォームを表示
        filter !== 'completed' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              type="text"
              value={text} // フォームの入力値をステートにバインド
              onChange={(e) => setText(e.target.value)} // 入力値が変わった時にステートを更新
            />
            <button type="submit">追加</button>
          </form>
        )
      )}
      <ul>
        {getFilteredTodos().map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              disabled={todo.delete_flg}
              checked={todo.completed_flg}
              onChange={() => handleTodo(todo.id, 'completed_flg', !todo.completed_flg)}
            />
            <input
              type="text"
              disabled={todo.completed_flg || todo.delete_flg}
              value={todo.content}
              onChange={(e) => handleTodo(todo.id, 'content', e.target.value)}
            />
            <button onClick={() => handleTodo(todo.id, 'delete_flg', !todo.delete_flg)}>
              {todo.delete_flg ? '復元' : '削除'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};


export default Todo;