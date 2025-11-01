import { useEffect, useState } from 'react';
import { getUsers, type User } from '../api/userApi';

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getUsers().then(data => setUsers(data));
  }, []);

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(u => (
          <li key={u._id}>{u.name} ({u.email})</li>
        ))}
      </ul>
    </div>
  );
}
