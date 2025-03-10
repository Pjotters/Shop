import { db } from '../firebase-config.js';
import { ref, query, orderByChild, limitToLast, get } from 'firebase/database';

export class LeaderboardService {
    async getTop15() {
        const usersRef = ref(db, 'users');
        const topUsersQuery = query(
            usersRef,
            orderByChild('points'),
            limitToLast(15)
        );
        
        const snapshot = await get(topUsersQuery);
        const users = [];
        
        snapshot.forEach((child) => {
            users.unshift({
                name: child.val().name,
                points: child.val().points
            });
        });
        
        return users;
    }
} 