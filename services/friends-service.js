export class FriendsService {
    async sendFriendRequest(fromUserId, toUserId) {
        const requestRef = ref(db, `friendRequests/${toUserId}/${fromUserId}`);
        await set(requestRef, {
            status: 'pending',
            timestamp: Date.now()
        });
    }

    async acceptFriendRequest(userId, friendId) {
        // Voeg vriend toe aan beide gebruikers
        await Promise.all([
            set(ref(db, `users/${userId}/friends/${friendId}`), true),
            set(ref(db, `users/${friendId}/friends/${userId}`), true)
        ]);
    }
} 