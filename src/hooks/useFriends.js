import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useFriends = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No user logged in');

            // 1. Get registered friends from friendships
            const { data: initiatedFriendships, error: initiatedError } = await supabase
                .from('friendships')
                .select('friend_id')
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            if (initiatedError) throw initiatedError;

            const { data: receivedFriendships, error: receivedError } = await supabase
                .from('friendships')
                .select('user_id')
                .eq('friend_id', user.id)
                .eq('status', 'accepted');

            if (receivedError) throw receivedError;

            // 2. Get manual friends
            const { data: manualFriends, error: manualError } = await supabase
                .from('manual_friends')
                .select('*')
                .eq('user_id', user.id);

            if (manualError) throw manualError;

            // Combine registered friend IDs
            const registeredFriendIds = [
                ...(initiatedFriendships || []).map(f => f.friend_id),
                ...(receivedFriendships || []).map(f => f.user_id)
            ];

            // 3. Get registered friend details if there are any
            let registeredFriends = [];
            if (registeredFriendIds.length > 0) {
                const { data: friendsData, error: friendsError } = await supabase
                    .from('users')
                    .select('id, email, full_name')
                    .in('id', registeredFriendIds);

                if (friendsError) throw friendsError;
                registeredFriends = friendsData.map(friend => ({
                    ...friend,
                    isRegistered: true,
                    isManualFriend: false,
                    balance: 0
                }));
            }

            // Transform manual friends
            const transformedManualFriends = (manualFriends || []).map(friend => ({
                id: friend.id,
                full_name: friend.name,
                email: null,
                isRegistered: false,
                isManualFriend: true,
                balance: 0
            }));

            // Combine both types of friends
            const allFriends = [...registeredFriends, ...transformedManualFriends];

            // Calculate balances for all friends
            for (const friend of allFriends) {
                try {
                    const { data: userExpenses, error: userExpError } = await supabase
                        .from('expenses')
                        .select(`
                            id,
                            amount,
                            expense_shares (
                                id,
                                amount,
                                registered_user_id,
                                manual_friend_id,
                                is_manual_friend
                            )
                        `)
                        .eq('created_by', user.id);

                    if (userExpError) throw userExpError;

                    const { data: friendExpenses, error: friendExpError } = await supabase
                        .from('expenses')
                        .select(`
                            id,
                            amount,
                            expense_shares (
                                id,
                                amount,
                                registered_user_id,
                                manual_friend_id,
                                is_manual_friend
                            )
                        `)
                        .eq('created_by', friend.id);

                    if (friendExpError && friend.isRegistered) throw friendExpError;

                    // What they owe you
                    const totalOwed = (userExpenses || [])
                        .reduce((sum, expense) => {
                            const friendShare = expense.expense_shares
                                ?.find(share => {
                                    const matches = (friend.isManualFriend && share.manual_friend_id === friend.id) ||
                                        (!friend.isManualFriend && share.registered_user_id === friend.id);
                                    return matches;
                                });
                            const amount = Number(friendShare?.amount) || 0;
                            return sum + amount;
                        }, 0);

                    // What you owe them
                    const totalOwes = friend.isRegistered ? (friendExpenses || [])
                        .reduce((sum, expense) => {
                            const userShare = expense.expense_shares
                                ?.find(share => share.registered_user_id === user.id);
                            const amount = Number(userShare?.amount) || 0;
                            return sum + amount;
                        }, 0) : 0;

                    friend.balance = (totalOwed || 0) - (totalOwes || 0);
                } catch (err) {
                    friend.balance = 0;
                }
            }

            setFriends(allFriends);
        } catch (err) {
            console.error('Error in fetchFriends:', err);
            setError(err.message);
            setFriends([]);
        } finally {
            setLoading(false);
        }
    };

    const addFriend = async (email) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No user logged in');

            // First find the friend in public.users table
            const { data: friendData, error: friendError } = await supabase
                .from('users')
                .select('id, email, full_name')
                .eq('email', email)
                .single();

            if (friendError || !friendData) {
                throw new Error('User not found');
            }

            // Check if friendship already exists in either direction
            const { data: existingFriendship, error: existingError } = await supabase
                .from('friendships')
                .select('*')
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
                .or(`user_id.eq.${friendData.id},friend_id.eq.${friendData.id}`)
                .single();

            if (existingFriendship) {
                throw new Error('Already friends with this user');
            }

            // Create new friendship
            const { error: friendshipError } = await supabase
                .from('friendships')
                .insert([{
                    user_id: user.id,
                    friend_id: friendData.id,
                    status: 'accepted'
                }])
                .select()
                .single();

            if (friendshipError) {
                throw friendshipError;
            }

            await fetchFriends();
        } catch (err) {
            console.error('Error in addFriend:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const refreshFriends = async () => {
        try {
            setLoading(true);
            setError(null);
            console.time('fetchFriends');

            const { data: { user } } = await supabase.auth.getUser();
            console.timeLog('fetchFriends', 'Got user');

            // Fetch registered friends
            const { data: registeredFriends, error: registeredError } = await supabase
                .from('friends')
                .select(`
                    id,
                    friend:friend_id(id, email, full_name),
                    balance
                `)
                .eq('user_id', user.id);
            console.timeLog('fetchFriends', 'Got registered friends');

            // Fetch manual friends
            const { data: manualFriends, error: manualError } = await supabase
                .from('manual_friends')
                .select('id, name, balance')
                .eq('user_id', user.id);
            console.timeLog('fetchFriends', 'Got manual friends');

            if (registeredError) throw registeredError;
            if (manualError) throw manualError;

            // Process and combine friends
            const processedFriends = [
                ...processRegisteredFriends(registeredFriends),
                ...processManualFriends(manualFriends)
            ];
            console.timeEnd('fetchFriends');

            setFriends(processedFriends);
        } catch (error) {
            console.error('Error in refreshFriends:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        let timeoutId;

        const loadFriends = async () => {
            try {
                if (!mounted) return;
                await fetchFriends();
            } catch (error) {
                console.error('Error loading friends:', error);
            }
        };

        // Debounced refresh function
        const debouncedRefresh = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(loadFriends, 300);
        };

        // Single subscription for all relevant tables
        const subscription = supabase
            .channel('friends-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expenses'
            }, debouncedRefresh)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expense_shares'
            }, debouncedRefresh)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'manual_friends'
            }, debouncedRefresh)
            .subscribe();

        // Initial load
        loadFriends();

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    return {
        friends,
        loading,
        error,
        addFriend,
        refreshFriends: fetchFriends
    };
}; 